// The dev overlay client — a framework-agnostic vanilla script served by
// `medprotocol overlay --serve` at GET /overlay.js. Its job is to retrofit
// medical-protocol into apps that were built WITHOUT it: the doctor hovers ANY
// element on ANY page, selects it, and chooses to Audit that region, Implement it
// with medical protocol, or Add a brand-new component there from a free-text brief
// typed into the overlay. Selection does not require the app to be tagged —
// the overlay captures a CSS selector + outerHTML + text so the agent can locate
// the region in source and classify it. `data-medprotocol-*` tags, when present,
// are used only as an optional fast-path hint.
//
// It POSTs a work order back to the serving origin (POST /queue), never runs
// clinical logic, and is inert in production (loaded in dev only).
//
// Kept as a string (no template-literal `${}` inside) so tsup bundles it into
// the single CLI dist without a separate asset.

export const OVERLAY_CLIENT_JS = `(function () {
  if (window.__medprotocolOverlay) return;
  window.__medprotocolOverlay = true;

  var script = document.currentScript;
  var BASE = script ? new URL(script.src).origin : window.location.origin;
  var active = false;
  var current = null;
  var raf = null;
  var tracked = [];   // orders still being polled (not yet done)
  var markers = [];   // all on-screen markers, including completed-with-result (for repositioning)
  var pollTimer = null;
  var panelOrder = null;

  function el(tag, cls) { var e = document.createElement(tag); e.className = cls; return e; }

  // Technical stroke icons (24x24, currentColor) — no emoji anywhere in this UI.
  function svgIcon(body, size) {
    return '<svg class="mpo-ic" width="' + (size || 14) + '" height="' + (size || 14) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  }
  var ICONS = {
    reticle: '<circle cx="12" cy="12" r="6.5"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>',
    frame: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>',
    audit: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-3.6-3.6"/>',
    implement: '<path d="M8.5 6 3.5 12l5 6M15.5 6l5 6-5 6"/>',
    add: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M12 8.5v7M8.5 12h7"/>',
    send: '<path d="M4 12l16-7-7 16-2.5-6.5L4 12z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
    cancel: '<path d="M6 6l12 12M18 6 6 18"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="M4 12.5 9 17.5 20 6.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'
  };

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  // Inline markdown applied to ALREADY-escaped text: code spans, bold, italic, links.
  function inlineMd(s) {
    return s
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
      .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\\*([^*\\s][^*]*?)\\*/g, '$1<em>$2</em>')
      .replace(/\\[([^\\]]+)\\]\\((https?:[^)\\s]+)\\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  // Minimal, safe Markdown → HTML for the result panel. Escapes first, then structures,
  // so any raw HTML in an agent-authored report is neutralized (never executed).
  function renderMarkdown(md) {
    var lines = String(md).replace(/\\r\\n?/g, '\\n').split('\\n');
    var out = '', listType = null, inCode = false, code = [];
    function closeList() { if (listType) { out += '</' + listType + '>'; listType = null; } }
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/^\\s*\`\`\`/.test(ln)) {
        if (inCode) { out += '<pre><code>' + code.join('\\n') + '</code></pre>'; code = []; inCode = false; }
        else { closeList(); inCode = true; }
        continue;
      }
      if (inCode) { code.push(escapeHtml(ln)); continue; }
      var t = ln.replace(/\\s+$/, '');
      if (!t.trim()) { closeList(); continue; }
      var h = t.match(/^(#{1,6})\\s+(.*)$/);
      if (h) { closeList(); var lv = h[1].length; out += '<h' + lv + '>' + inlineMd(escapeHtml(h[2])) + '</h' + lv + '>'; continue; }
      if (/^\\s*(---+|\\*\\*\\*+|___+)\\s*$/.test(t)) { closeList(); out += '<hr>'; continue; }
      var ul = t.match(/^\\s*[-*+]\\s+(.*)$/);
      if (ul) { if (listType !== 'ul') { closeList(); out += '<ul>'; listType = 'ul'; } out += '<li>' + inlineMd(escapeHtml(ul[1])) + '</li>'; continue; }
      var ol = t.match(/^\\s*\\d+[.)]\\s+(.*)$/);
      if (ol) { if (listType !== 'ol') { closeList(); out += '<ol>'; listType = 'ol'; } out += '<li>' + inlineMd(escapeHtml(ol[1])) + '</li>'; continue; }
      closeList();
      out += '<p>' + inlineMd(escapeHtml(t)) + '</p>';
    }
    if (inCode) out += '<pre><code>' + code.join('\\n') + '</code></pre>';
    closeList();
    return out;
  }

  // Is this element part of the overlay's own UI? Never select those.
  function isOwn(node) {
    return !!(node && node.closest && node.closest('.mpo-ui'));
  }

  var MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
  var SANS = 'system-ui,-apple-system,Segoe UI,sans-serif';

  var style = document.createElement('style');
  style.textContent = [
    '.mpo-ui,.mpo-ui *{box-sizing:border-box}',
    '.mpo-ic{display:inline-block;vertical-align:middle;flex:0 0 auto}',
    // Selection reticle: a thin tinted frame with solid cyan corner brackets — an instrument target.
    '.mpo-box{position:fixed;z-index:2147483646;pointer-events:none;border:1px solid rgba(34,211,238,.30);background:rgba(34,211,238,.05);box-shadow:0 0 0 1px rgba(6,20,31,.6);display:none}',
    '.mpo-corner{position:absolute;width:10px;height:10px;border:1.5px solid #22d3ee}',
    '.mpo-corner.tl{top:-1px;left:-1px;border-right:none;border-bottom:none}',
    '.mpo-corner.tr{top:-1px;right:-1px;border-left:none;border-bottom:none}',
    '.mpo-corner.bl{bottom:-1px;left:-1px;border-right:none;border-top:none}',
    '.mpo-corner.br{bottom:-1px;right:-1px;border-left:none;border-top:none}',
    // Label readout tag: dark chip, cyan mono text — a HUD readout, not a solid fill.
    '.mpo-badge{position:fixed;z-index:2147483647;pointer-events:none;background:rgba(6,20,31,.94);color:#67e8f9;border:1px solid #164e63;font:600 10.5px/1.5 ' + MONO + ';letter-spacing:.03em;padding:2px 6px;display:none;max-width:60vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mpo-toggle{position:fixed;bottom:16px;right:16px;z-index:2147483647;display:inline-flex;align-items:center;gap:8px;background:#06141f;color:#cbd5e1;font:600 12px/1 ' + SANS + ';letter-spacing:.01em;border:1px solid #164e63;border-radius:6px;padding:9px 13px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.45)}',
    '.mpo-toggle:hover{border-color:#22d3ee;color:#e6eef7}',
    '.mpo-toggle[data-on="1"]{background:#0891b2;border-color:#22d3ee;color:#04181f}',
    '.mpo-toggle .mpo-ic{color:#22d3ee}',
    '.mpo-toggle[data-on="1"] .mpo-ic{color:#04181f}',
    '.mpo-menu{position:fixed;z-index:2147483647;background:#06141f;border:1px solid #164e63;border-radius:6px;padding:5px;box-shadow:0 14px 36px rgba(0,0,0,.55);font:500 13px/1 ' + SANS + ';display:none;min-width:248px;max-width:340px}',
    '.mpo-menu button{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:none;border:none;color:#dbe4f0;padding:9px 11px;border-radius:4px;cursor:pointer;white-space:nowrap;font:500 13px/1.2 ' + SANS + '}',
    '.mpo-menu button .mpo-ic{color:#5b7d8f}',
    '.mpo-menu button:hover{background:#0d2433}',
    '.mpo-menu button:hover .mpo-ic{color:#22d3ee}',
    '.mpo-head{display:flex;align-items:center;gap:7px;padding:7px 11px 8px;color:#67e8f9;font:600 11px/1.4 ' + MONO + ';border-bottom:1px solid #133243;margin-bottom:4px}',
    '.mpo-head .mpo-ic{color:#3a8fa6}',
    '.mpo-head span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mpo-hint{padding:6px 11px 4px;color:#5b7387;font:400 10.5px/1.45 ' + SANS + '}',
    '.mpo-toast{position:fixed;bottom:64px;right:16px;z-index:2147483647;display:flex;align-items:center;gap:8px;background:#06141f;color:#e6eef7;font:500 12.5px/1.45 ' + SANS + ';padding:10px 13px;border-radius:6px;border:1px solid #164e63;box-shadow:0 6px 18px rgba(0,0,0,.45);transition:opacity .3s;max-width:340px}',
    '.mpo-toast .mpo-dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex:0 0 auto}',
    '@keyframes mpo-spin{to{transform:rotate(360deg)}}',
    '@keyframes mpo-pulse{0%,100%{opacity:.5}50%{opacity:1}}',
    '.mpo-track-box{position:fixed;z-index:2147483645;pointer-events:none;border:1px dashed #f59e0b;display:none;animation:mpo-pulse 1.2s ease-in-out infinite}',
    '.mpo-track-box.done{border-style:solid;border-color:#10b981;animation:none}',
    // Waiting: queued but no processor attached — calm slate, no pulse, so it never reads as a hang.
    '.mpo-track-box.waiting{border-style:dashed;border-color:#64748b;animation:none}',
    '.mpo-track-pill.waiting{background:#334155;color:#e2e8f0}',
    '.mpo-track-pill.waiting .mpo-ic{color:#e2e8f0}',
    '.mpo-track-pill{position:fixed;z-index:2147483647;pointer-events:none;display:none;align-items:center;gap:6px;background:#f59e0b;color:#1a1206;font:600 10.5px/1.4 ' + MONO + ';letter-spacing:.02em;padding:3px 8px;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.4);white-space:nowrap}',
    '.mpo-track-pill.done{background:#10b981;color:#04140d}',
    '.mpo-spin{width:10px;height:10px;border:2px solid rgba(26,18,6,.25);border-top-color:#1a1206;border-radius:50%;display:inline-block;animation:mpo-spin .7s linear infinite}',
    '.mpo-clickable{pointer-events:auto;cursor:pointer}',
    '.mpo-clickable:hover{filter:brightness(1.08)}',
    '.mpo-panel{position:fixed;top:8vh;right:16px;z-index:2147483647;width:min(540px,92vw);max-height:80vh;display:none;flex-direction:column;background:#06141f;color:#dbe4f0;border:1px solid #164e63;border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.6)}',
    '.mpo-panel-head{display:flex;align-items:center;gap:8px;padding:11px 12px;border-bottom:1px solid #133243}',
    '.mpo-panel-title{flex:1;min-width:0;font:600 11px/1.4 ' + MONO + ';letter-spacing:.02em;color:#67e8f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mpo-panel-btn{display:inline-flex;align-items:center;gap:5px;background:#0d2433;color:#cbd5e1;border:1px solid #164e63;border-radius:4px;padding:5px 9px;cursor:pointer;font:600 11px/1 ' + SANS + '}',
    '.mpo-panel-btn:hover{background:#123246;color:#fff;border-color:#22d3ee}',
    '.mpo-panel-btn.icon{padding:5px 6px}',
    '.mpo-panel-btn.primary{background:#0891b2;border-color:#22d3ee;color:#04181f}',
    '.mpo-panel-btn.primary:hover{background:#0aa5cb;color:#04181f}',
    '.mpo-panel-btn[disabled]{opacity:.55;cursor:not-allowed}',
    '.mpo-panel-body{padding:14px 16px;overflow:auto;word-break:break-word;font:400 13px/1.6 ' + SANS + ';color:#bcccdc}',
    '.mpo-panel-body>*:first-child{margin-top:0}',
    '.mpo-panel-body>*:last-child{margin-bottom:0}',
    '.mpo-panel-body h1,.mpo-panel-body h2,.mpo-panel-body h3,.mpo-panel-body h4{margin:16px 0 7px;color:#e6eef7;font-weight:600;line-height:1.3}',
    '.mpo-panel-body h1{font-size:15px}',
    '.mpo-panel-body h2{font-size:14px;padding-bottom:5px;border-bottom:1px solid #133243}',
    '.mpo-panel-body h3{font-size:11px;color:#67e8f9;letter-spacing:.06em;text-transform:uppercase}',
    '.mpo-panel-body h4{font-size:12px;color:#9fb3c8}',
    '.mpo-panel-body p{margin:7px 0}',
    '.mpo-panel-body ul,.mpo-panel-body ol{margin:7px 0;padding-left:20px}',
    '.mpo-panel-body li{margin:3px 0}',
    '.mpo-panel-body li::marker{color:#3a8fa6}',
    '.mpo-panel-body strong{color:#e6eef7;font-weight:600}',
    '.mpo-panel-body em{color:#cdd9e6}',
    '.mpo-panel-body code{font:600 11.5px/1.4 ' + MONO + ';background:#0d2433;color:#7dd3fc;border:1px solid #133243;border-radius:3px;padding:1px 5px}',
    '.mpo-panel-body pre{margin:9px 0;padding:11px 12px;background:#040e16;border:1px solid #133243;border-radius:5px;overflow:auto}',
    '.mpo-panel-body pre code{background:none;border:none;padding:0;color:#bcccdc;font-weight:400;font-size:12px;line-height:1.55}',
    '.mpo-panel-body hr{border:none;border-top:1px solid #133243;margin:12px 0}',
    '.mpo-panel-body a{color:#22d3ee}',
    '.mpo-score{display:inline-flex;align-items:center;gap:8px;margin:0 0 12px;padding:5px 11px;background:#0d2433;border:1px solid #164e63;border-radius:5px;font:700 12px/1 ' + MONO + ';letter-spacing:.04em;color:#67e8f9}',
    '.mpo-score .mpo-score-k{color:#5b7d8f;font-weight:600}',
    // Inline skill trigger: a /medical-protocol:x mention in the report, clickable to re-run it here.
    '.mpo-skill{display:inline;background:#0d2433;color:#7dd3fc;border:1px solid #164e63;border-radius:3px;padding:1px 6px;margin:0 1px;font:600 11.5px/1.4 ' + MONO + ';cursor:pointer}',
    '.mpo-skill:hover{background:#123246;border-color:#22d3ee;color:#bff0ff}',
    // Suggested-actions row: structured skill triggers the report attached to its result.
    '.mpo-suggest{margin-top:16px;padding-top:13px;border-top:1px solid #133243;display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.mpo-suggest-head{width:100%;color:#67e8f9;font:600 11px/1.4 ' + MONO + ';letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px}',
    '.mpo-suggest-btn{display:inline-flex;align-items:center;gap:6px;background:#0891b2;color:#04181f;border:1px solid #22d3ee;border-radius:5px;padding:6px 11px;cursor:pointer;font:600 12px/1 ' + SANS + '}',
    '.mpo-suggest-btn:hover{background:#0aa5cb}',
    '.mpo-suggest-btn .mpo-ic{color:#04181f}',
    // Compose panel: free-text "add a component here" brief the doctor types for the agent.
    '.mpo-compose-body{padding:13px 16px 4px;display:flex;flex-direction:column;gap:9px}',
    '.mpo-compose-target{font:600 10.5px/1.4 ' + MONO + ';letter-spacing:.02em;color:#5b7d8f}',
    '.mpo-compose-target b{color:#67e8f9;font-weight:600}',
    '.mpo-compose textarea{width:100%;min-height:96px;resize:vertical;background:#040e16;color:#e6eef7;border:1px solid #164e63;border-radius:6px;padding:10px 12px;font:400 13px/1.55 ' + SANS + '}',
    '.mpo-compose textarea:focus{outline:none;border-color:#22d3ee}',
    '.mpo-compose textarea::placeholder{color:#4a657a}',
    '.mpo-compose-hint{color:#5b7387;font:400 10.5px/1.45 ' + SANS + '}',
    '.mpo-compose-foot{display:flex;justify-content:flex-end;gap:8px;padding:10px 16px 14px}',
    '.mpo-compose-foot .mpo-panel-btn.primary{background:#0891b2;border-color:#22d3ee;color:#04181f}',
    '.mpo-compose-foot .mpo-panel-btn.primary:hover{background:#0aa5cb;color:#04181f}',
    '.mpo-compose-foot .mpo-panel-btn[disabled]{opacity:.5;cursor:not-allowed}'
  ].join('');
  document.head.appendChild(style);

  var box = el('div', 'mpo-box mpo-ui');
  ['tl', 'tr', 'bl', 'br'].forEach(function (p) { box.appendChild(el('span', 'mpo-corner ' + p)); });
  var badge = el('div', 'mpo-badge mpo-ui');
  var menu = el('div', 'mpo-menu mpo-ui');
  var toggle = el('button', 'mpo-toggle mpo-ui');
  toggle.innerHTML = svgIcon(ICONS.reticle) + '<span>Protocol select</span>';

  // Result panel (singleton)
  var panel = el('div', 'mpo-panel mpo-ui');
  var panelTitle = el('div', 'mpo-panel-title');
  var panelBody = el('div', 'mpo-panel-body');
  var panelApply = el('button', 'mpo-panel-btn primary');
  (function buildPanel() {
    var head = el('div', 'mpo-panel-head');
    panelApply.innerHTML = svgIcon(ICONS.check, 13) + '<span>Apply</span>';
    panelApply.title = 'Land the staged diff into source';
    panelApply.style.display = 'none';
    panelApply.addEventListener('click', function () { if (panelOrder) applyOrder(panelOrder); });
    var dismiss = el('button', 'mpo-panel-btn'); dismiss.textContent = 'Dismiss';
    dismiss.addEventListener('click', function () { if (panelOrder) dropMarker(panelOrder); closePanel(); });
    var close = el('button', 'mpo-panel-btn icon'); close.title = 'Close'; close.innerHTML = svgIcon(ICONS.close, 13);
    close.addEventListener('click', closePanel);
    head.appendChild(panelTitle); head.appendChild(panelApply); head.appendChild(dismiss); head.appendChild(close);
    panel.appendChild(head); panel.appendChild(panelBody);
    // Delegate clicks on any skill trigger inside the report (inline chips + the suggested-actions row).
    panelBody.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('.mpo-skill,.mpo-suggest-btn') : null;
      if (!b || !panelOrder) return;
      e.preventDefault();
      runSkill(panelOrder, b.getAttribute('data-skill'), b.getAttribute('data-prompt'));
    });
  })();

  // Compose panel (singleton) — typing a free-text brief to ADD a new component into the selected area.
  var compose = el('div', 'mpo-panel mpo-ui');
  var composeTitle = el('div', 'mpo-panel-title');
  var composeTarget = el('div', 'mpo-compose-target');
  var composeInput = document.createElement('textarea');
  var composeSubmit = el('button', 'mpo-panel-btn primary');
  var composeNode = null; // the element the new component will be added into/near
  (function buildCompose() {
    var head = el('div', 'mpo-panel-head');
    composeTitle.textContent = 'ADD COMPONENT';
    var close = el('button', 'mpo-panel-btn icon'); close.title = 'Close'; close.innerHTML = svgIcon(ICONS.close, 13);
    close.addEventListener('click', closeCompose);
    head.appendChild(composeTitle); head.appendChild(close);

    var body = el('div', 'mpo-compose-body');
    body.classList.add('mpo-compose');
    composeInput.placeholder = 'Describe the component to add here, e.g. "a chronic kidney disease anemia tracker".';
    composeInput.setAttribute('rows', '4');
    var hint = el('div', 'mpo-compose-hint');
    hint.textContent = 'A headless Claude run builds it with medical protocol and stages a diff into the selected area. ⌘/Ctrl+Enter to submit.';
    body.appendChild(composeTarget); body.appendChild(composeInput); body.appendChild(hint);

    var foot = el('div', 'mpo-compose-foot');
    var cancel = el('button', 'mpo-panel-btn'); cancel.textContent = 'Cancel';
    cancel.addEventListener('click', closeCompose);
    composeSubmit.innerHTML = svgIcon(ICONS.send, 13) + '<span>Add</span>';
    composeSubmit.addEventListener('click', submitCompose);
    foot.appendChild(cancel); foot.appendChild(composeSubmit);

    composeInput.addEventListener('input', function () { composeSubmit.disabled = !composeInput.value.trim(); });
    composeInput.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submitCompose(); }
      if (e.key === 'Escape') { e.stopPropagation(); closeCompose(); }
    });

    compose.appendChild(head); compose.appendChild(body); compose.appendChild(foot);
  })();

  function openCompose(node) {
    composeNode = node;
    composeInput.value = '';
    composeSubmit.disabled = true;
    composeTarget.innerHTML = 'Add into <b>' + escapeHtml(label(node)) + '</b>';
    compose.style.display = 'flex';
    setTimeout(function () { composeInput.focus(); }, 0);
  }
  function closeCompose() { compose.style.display = 'none'; composeNode = null; }
  function submitCompose() {
    var prompt = composeInput.value.trim();
    if (!prompt || !composeNode) return;
    send('add', composeNode, prompt);
    closeCompose();
  }

  function mount() {
    document.body.appendChild(box);
    document.body.appendChild(badge);
    document.body.appendChild(menu);
    document.body.appendChild(toggle);
    document.body.appendChild(panel);
    document.body.appendChild(compose);
  }
  if (document.body) { mount(); } else { document.addEventListener('DOMContentLoaded', mount); }

  function hideHighlight() { box.style.display = 'none'; badge.style.display = 'none'; }
  function hideMenu() { menu.style.display = 'none'; }

  function setActive(on) {
    active = on;
    toggle.setAttribute('data-on', on ? '1' : '0');
    toggle.innerHTML = svgIcon(ICONS.reticle) + '<span>' + (on ? 'Selecting — ↑ widen · Esc' : 'Protocol select') + '</span>';
    if (!on) { hideHighlight(); hideMenu(); current = null; }
  }
  toggle.addEventListener('click', function (e) { e.stopPropagation(); setActive(!active); });

  // Short human label for the highlighted node: registry id if tagged, else tag(.class).
  function label(node) {
    var id = node.getAttribute && node.getAttribute('data-medprotocol-id');
    if (id) return id;
    var t = node.tagName ? node.tagName.toLowerCase() : 'node';
    if (node.id) return t + '#' + node.id;
    var c = (node.getAttribute && node.getAttribute('class')) || '';
    c = c.split(/\\s+/).filter(Boolean)[0];
    return c ? t + '.' + c : t;
  }

  function highlight(node) {
    if (!node || node === document.body || node === document.documentElement) { hideHighlight(); return; }
    var r = node.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = r.left + 'px'; box.style.top = r.top + 'px';
    box.style.width = r.width + 'px'; box.style.height = r.height + 'px';
    badge.style.display = 'block';
    badge.textContent = label(node);
    badge.style.left = r.left + 'px';
    badge.style.top = Math.max(0, r.top - 22) + 'px';
  }

  document.addEventListener('mousemove', function (e) {
    if (!active || menu.style.display === 'block' || raf) return;
    raf = requestAnimationFrame(function () {
      raf = null;
      var node = e.target;
      if (isOwn(node)) { return; }
      current = node;
      highlight(node);
    });
  }, true);

  // ArrowUp widens the selection to the parent element (Impeccable-style).
  document.addEventListener('keydown', function (e) {
    if (!active) return;
    if (e.key === 'Escape') {
      if (menu.style.display === 'block') { hideMenu(); } else { setActive(false); }
      return;
    }
    if (e.key === 'ArrowUp' && current && current.parentElement && menu.style.display !== 'block') {
      e.preventDefault();
      if (current.parentElement !== document.body) { current = current.parentElement; highlight(current); }
    }
  });
  window.addEventListener('scroll', function () {
    if (active && menu.style.display !== 'block') highlight(current);
    if (tracked.length) repositionAll();
  }, true);
  window.addEventListener('resize', function () { if (tracked.length) repositionAll(); });

  document.addEventListener('click', function (e) {
    if (!active || isOwn(e.target) || !current) return;
    e.preventDefault(); e.stopPropagation();
    openMenu(e.clientX, e.clientY, current);
  }, true);

  function menuBtn(icon, txt, fn) {
    var b = document.createElement('button');
    b.innerHTML = svgIcon(icon) + '<span></span>';
    b.querySelector('span').textContent = txt;
    b.addEventListener('click', function (ev) { ev.stopPropagation(); fn(); });
    return b;
  }

  function openMenu(x, y, node) {
    menu.innerHTML = '';
    var head = el('div', 'mpo-head'); head.innerHTML = svgIcon(ICONS.frame, 13) + '<span></span>';
    head.querySelector('span').textContent = label(node); menu.appendChild(head);
    menu.appendChild(menuBtn(ICONS.audit, 'Audit this with medical protocol', function () { send('audit', node); }));
    menu.appendChild(menuBtn(ICONS.implement, 'Implement with medical protocol', function () { send('implement', node); }));
    menu.appendChild(menuBtn(ICONS.add, 'Add a component here…', function () { hideMenu(); openCompose(node); }));
    menu.appendChild(menuBtn(ICONS.copy, 'Copy selector', function () { copy(cssPath(node)); hideMenu(); }));
    menu.appendChild(menuBtn(ICONS.cancel, 'Cancel', function () { hideMenu(); }));
    var hint = el('div', 'mpo-hint'); hint.textContent = 'Tip: press ↑ before clicking to widen the selection.';
    menu.appendChild(hint);
    menu.style.display = 'block';
    menu.style.left = Math.min(x, window.innerWidth - 300) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 200) + 'px';
  }

  // Build a reasonably stable CSS selector from the node up to <body>.
  function cssPath(node) {
    if (!node || !node.tagName) return '';
    var parts = [];
    var n = node;
    while (n && n.nodeType === 1 && n !== document.body && parts.length < 8) {
      if (n.id) { parts.unshift('#' + CSS.escape(n.id)); break; }
      var tag = n.tagName.toLowerCase();
      var i = 1, sib = n;
      while ((sib = sib.previousElementSibling)) { if (sib.tagName === n.tagName) i++; }
      parts.unshift(tag + ':nth-of-type(' + i + ')');
      n = n.parentElement;
    }
    return parts.join(' > ');
  }

  function send(action, node, prompt) {
    hideMenu();
    var order = {
      action: action,
      prompt: prompt || null,   // free-text brief — required for "add", null otherwise
      selector: cssPath(node),
      tag: node.tagName ? node.tagName.toLowerCase() : null,
      classes: (node.getAttribute && node.getAttribute('class')) || null,
      text: (node.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 300),
      html: (node.outerHTML || '').slice(0, 4000),
      rect: (function () { var r = node.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; })(),
      suggestedId: (node.closest && node.closest('[data-medprotocol-id]') ? node.closest('[data-medprotocol-id]').getAttribute('data-medprotocol-id') : null),
      source: (node.closest && node.closest('[data-medprotocol-source]') ? node.closest('[data-medprotocol-source]').getAttribute('data-medprotocol-source') : null),
      url: location.href,
      ts: new Date().toISOString(),
      status: 'pending'
    };
    fetch(BASE + '/queue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (resp) {
      toast('Queued ' + action + ' for <' + (order.tag || 'node') + '>', '#10b981');
      track(resp.file, order.selector, action);
    }).catch(function (err) {
      toast('Queue failed: ' + err.message + ' — is "medprotocol overlay --serve" running?', '#ef4444');
    });
  }

  // ── Progress markers: pin a spinner over the selected element until the agent finishes ──

  // Per-action labels for the live marker: { queued, ing, done }.
  function verbs(action) {
    if (action === 'audit') return { queued: 'queued audit…', ing: 'auditing…', done: 'audited' };
    if (action === 'add') return { queued: 'queued add…', ing: 'adding…', done: 'added' };
    if (action === 'skill') return { queued: 'queued…', ing: 'running…', done: 'ran' };
    return { queued: 'queued implement…', ing: 'implementing…', done: 'implemented' };
  }

  // The skill that drains each action, named so the doctor knows exactly what to run.
  function drainHint(action) {
    var skill = action === 'audit' ? '/medical-protocol:overlay-audit'
      : action === 'add' ? '/medical-protocol:overlay-add'
      : action === 'skill' ? 'the overlay queue'
      : '/medical-protocol:overlay-implement';
    return 'Queued, but no processor is attached — nothing will run on its own. Process it in Claude Code ('
      + skill + '), or restart the server with --auto.';
  }

  // (Re)build a pill as an active spinner with the given label. Used for queued (auto) and processing.
  function spinnerPill(t, text) {
    t.pill.classList.remove('done', 'waiting', 'mpo-clickable');
    t.pill.onclick = null;
    t.pill.innerHTML = '';
    var spin = el('span', 'mpo-spin');
    var lbl = document.createElement('span'); lbl.textContent = text;
    t.pill.appendChild(spin); t.pill.appendChild(lbl);
    t.label = lbl;
  }

  function track(file, selector, action) {
    if (!file) return;
    var b = el('div', 'mpo-track-box mpo-ui');
    var p = el('div', 'mpo-track-pill mpo-ui');
    var spin = el('span', 'mpo-spin');
    var lbl = document.createElement('span');
    lbl.textContent = verbs(action).queued;
    p.appendChild(spin); p.appendChild(lbl);
    document.body.appendChild(b); document.body.appendChild(p);
    var t = { file: file, selector: selector, action: action, box: b, pill: p, label: lbl, done: false, mode: 'init' };
    tracked.push(t); markers.push(t);
    positionMarker(t);
    startPolling();
  }

  function positionMarker(t) {
    var node = null;
    try { node = t.selector ? document.querySelector(t.selector) : null; } catch (e) { node = null; }
    if (!node) { t.box.style.display = 'none'; t.pill.style.display = 'none'; return; }
    var r = node.getBoundingClientRect();
    t.box.style.display = 'block';
    t.box.style.left = r.left + 'px'; t.box.style.top = r.top + 'px';
    t.box.style.width = r.width + 'px'; t.box.style.height = r.height + 'px';
    t.pill.style.display = 'inline-flex';
    t.pill.style.left = r.left + 'px';
    t.pill.style.top = Math.max(0, r.top - 26) + 'px';
  }

  function repositionAll() { for (var i = 0; i < markers.length; i++) positionMarker(markers[i]); }

  function spliceFrom(arr, t) { var i = arr.indexOf(t); if (i >= 0) arr.splice(i, 1); }

  function dropMarker(t) {
    spliceFrom(tracked, t); spliceFrom(markers, t);
    if (t.box.parentNode) t.box.parentNode.removeChild(t.box);
    if (t.pill.parentNode) t.pill.parentNode.removeChild(t.pill);
    if (!tracked.length) stopPolling();
  }

  function setStatus(t, status, hasResult, auto) {
    if (t.done) return;
    var v = verbs(t.action);
    if (status === 'pending') {
      if (auto) {
        // A processor is attached — it will pick this up shortly. Keep the live spinner.
        if (t.mode !== 'queued') { t.mode = 'queued'; t.box.classList.remove('waiting'); spinnerPill(t, v.queued); }
      } else if (t.mode !== 'waiting') {
        // No processor — make it unmistakably "waiting on you", not "working". No spinner.
        t.mode = 'waiting';
        t.box.classList.add('waiting');
        t.pill.classList.add('waiting', 'mpo-clickable');
        t.pill.innerHTML = svgIcon(ICONS.clock, 12);
        var w = document.createElement('span'); w.textContent = 'queued — needs drain';
        t.pill.appendChild(w);
        t.pill.onclick = function () { toast(drainHint(t.action), '#f59e0b'); };
      }
      return;
    }
    if (status === 'processing') {
      if (t.mode !== 'processing') { t.mode = 'processing'; t.box.classList.remove('waiting'); spinnerPill(t, v.ing); }
    } else if (status === 'done') {
      t.done = true;
      t.mode = 'done';
      t.box.classList.remove('waiting');
      t.pill.classList.remove('waiting', 'mpo-clickable');
      t.pill.onclick = null;
      t.box.classList.add('done');
      t.pill.classList.add('done');
      t.pill.innerHTML = svgIcon(ICONS.check, 12);
      var c = document.createElement('span');
      if (hasResult) {
        c.textContent = v.done + ' — view';
        t.pill.appendChild(c);
        t.pill.classList.add('mpo-clickable');
        t.pill.addEventListener('click', function () { openResultPanel(t); });
        // keep the marker on screen until the doctor dismisses it
      } else {
        c.textContent = v.done;
        t.pill.appendChild(c);
        setTimeout(function () { fadeOut(t.box); fadeOut(t.pill); spliceFrom(markers, t); }, 1800);
      }
    }
  }

  function fadeOut(node) {
    node.style.transition = 'opacity .4s';
    node.style.opacity = '0';
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 420);
  }

  // Turn every "/medical-protocol:<skill>" mention in one text node into a clickable trigger chip.
  function skillChips(text) {
    var rx = new RegExp('/medical-protocol:[a-z][a-z0-9-]*', 'g');
    var frag = document.createDocumentFragment();
    var last = 0, m, hit = false;
    while ((m = rx.exec(text))) {
      hit = true;
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mpo-skill';
      b.setAttribute('data-skill', m[0]);
      b.title = 'Run ' + m[0] + ' on this selection';
      b.textContent = m[0];
      frag.appendChild(b);
      last = m.index + m[0].length;
    }
    if (!hit) return null;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }
  // Walk the rendered report's text nodes and linkify skill mentions — skipping code, links, and
  // existing chips so we never rewrite literal code samples or break markup.
  function linkifySkills(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      if (n.parentNode && n.parentNode.closest && n.parentNode.closest('code,pre,a,.mpo-skill')) continue;
      if (n.nodeValue.indexOf('/medical-protocol:') >= 0) nodes.push(n);
    }
    for (var i = 0; i < nodes.length; i++) {
      var frag = skillChips(nodes[i].nodeValue);
      if (frag && nodes[i].parentNode) nodes[i].parentNode.replaceChild(frag, nodes[i]);
    }
  }

  function openResultPanel(t) {
    panelOrder = t;
    var titleVerb = t.action === 'audit' ? 'Audit' : t.action === 'add' ? 'Add' : t.action === 'skill' ? 'Run' : 'Implement';
    panelTitle.textContent = titleVerb + ' — ' + (t.selector || t.file);
    panelBody.textContent = 'Loading…';
    panelApply.style.display = 'none';
    panel.style.display = 'flex';
    fetch(BASE + '/result?file=' + encodeURIComponent(t.file)).then(function (r) { return r.json(); }).then(function (d) {
      var res = d && d.result;
      if (!res) { panelBody.textContent = 'No result recorded for this selection.'; return; }
      var html = '';
      if (res.score) html += '<div class="mpo-score"><span class="mpo-score-k">SCORE</span>' + escapeHtml(String(res.score)) + '</div>';
      html += (res.report != null ? renderMarkdown(res.report) : '<pre><code>' + escapeHtml(JSON.stringify(res, null, 2)) + '</code></pre>');
      panelBody.innerHTML = html;
      linkifySkills(panelBody);
      renderSuggestions(res.suggestions);
      panelBody.scrollTop = 0;
      // add/implement/skill results are STAGED until approved — offer "Apply" to land the diff from here.
      if ((d.action === 'add' || d.action === 'implement' || d.action === 'skill') && d.approved === false) {
        panelApply.disabled = false;
        panelApply.innerHTML = svgIcon(ICONS.check, 13) + '<span>Apply</span>';
        panelApply.style.display = 'inline-flex';
      }
    }).catch(function (err) { panelBody.textContent = 'Could not load result: ' + err.message; });
  }

  // Render the report's structured skill suggestions as a row of "Run" buttons under the report.
  function renderSuggestions(list) {
    if (!Array.isArray(list) || !list.length) return;
    var wrap = el('div', 'mpo-suggest');
    var head = el('div', 'mpo-suggest-head'); head.textContent = 'Suggested actions';
    wrap.appendChild(head);
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (!s || !s.skill) continue;
      var b = el('button', 'mpo-suggest-btn'); b.type = 'button';
      b.setAttribute('data-skill', s.skill);
      if (s.prompt) b.setAttribute('data-prompt', s.prompt);
      b.title = 'Run ' + s.skill + ' on this selection';
      var sp = document.createElement('span'); sp.textContent = s.label || s.skill;
      b.innerHTML = svgIcon(ICONS.send, 12); b.appendChild(sp);
      wrap.appendChild(b);
    }
    panelBody.appendChild(wrap);
  }

  // Trigger a recommended skill against this same selection (POST /run). Records intent; with --auto
  // a headless run processes it. Re-uses the order's anchor server-side, so we only send the file ref.
  function runSkill(t, skill, prompt) {
    if (!t || !skill) return;
    toast('Triggering ' + skill + '…', '#22d3ee');
    fetch(BASE + '/run', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: t.file, skill: skill, prompt: prompt || null })
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (d) { throw new Error(d && d.error ? d.error : 'HTTP ' + r.status); });
      return r.json();
    }).then(function (d) {
      toast(d.auto ? 'Triggered ' + skill + ' — running headless…' : 'Queued ' + skill + ' — run the overlay queue in Claude Code to process it.', '#10b981');
      if (d.file) track(d.file, t.selector, 'skill');
    }).catch(function (err) { toast('Trigger failed: ' + err.message, '#ef4444'); });
  }

  // Approve a staged add/implement order → the server re-queues it and (in --auto) the agent lands the diff.
  function applyOrder(t) {
    panelApply.disabled = true;
    panelApply.innerHTML = svgIcon(ICONS.check, 13) + '<span>Applying…</span>';
    fetch(BASE + '/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: t.file })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (d) {
      if (!d.ok) throw new Error(d.error || 'approve failed');
      toast(d.auto ? 'Approved — landing the staged diff…' : 'Approved — run the overlay skill in Claude Code to land it.', '#10b981');
      reTrack(t);
      closePanel();
    }).catch(function (err) {
      panelApply.disabled = false;
      panelApply.innerHTML = svgIcon(ICONS.check, 13) + '<span>Apply</span>';
      toast('Apply failed: ' + err.message, '#ef4444');
    });
  }

  // Re-arm a completed marker so it shows progress again while the approved diff is applied.
  function reTrack(t) {
    t.done = false;
    t.mode = 'init';
    t.box.classList.remove('done');
    t.pill.classList.remove('done', 'mpo-clickable');
    t.pill.innerHTML = '';
    var spin = el('span', 'mpo-spin');
    var lbl = document.createElement('span'); lbl.textContent = 'applying…';
    t.pill.appendChild(spin); t.pill.appendChild(lbl);
    t.label = lbl;
    if (tracked.indexOf(t) < 0) tracked.push(t);
    if (markers.indexOf(t) < 0) markers.push(t);
    positionMarker(t);
    startPolling();
  }

  function closePanel() { panel.style.display = 'none'; panelOrder = null; }

  function startPolling() { if (!pollTimer) pollTimer = setInterval(poll, 1200); }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function poll() {
    if (!tracked.length) { stopPolling(); return; }
    fetch(BASE + '/status').then(function (r) { return r.json(); }).then(function (data) {
      // /status returns { auto, orders }; tolerate the older bare-array shape too.
      var list = data && data.orders ? data.orders : (Array.isArray(data) ? data : []);
      var auto = !!(data && data.auto);
      var byFile = {};
      for (var i = 0; i < list.length; i++) byFile[list[i].file] = list[i];
      for (var j = tracked.length - 1; j >= 0; j--) {
        var t = tracked[j];
        var s = byFile[t.file];
        // missing from the queue = cleared after completion → treat as done (no result to show)
        setStatus(t, s ? s.status : 'done', s ? s.hasResult : false, auto);
        if (t.done) tracked.splice(j, 1);
      }
      repositionAll();
      if (!tracked.length) stopPolling();
    }).catch(function () { /* server down between polls — keep markers, retry next tick */ });
  }

  function copy(text) {
    if (navigator.clipboard) { navigator.clipboard.writeText(text); }
    toast('Copied selector', '#22d3ee');
  }

  function toast(msg, color) {
    var t = el('div', 'mpo-toast mpo-ui');
    var dot = el('span', 'mpo-dot');
    dot.style.color = color || '#22d3ee';
    var txt = document.createElement('span');
    txt.textContent = msg;
    t.appendChild(dot); t.appendChild(txt);
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2800);
  }

  console.info('[medprotocol] overlay loaded — click "Protocol select" (bottom-right), hover any element, click to Audit, Implement, or Add a component. Server: ' + BASE);
})();
`;
