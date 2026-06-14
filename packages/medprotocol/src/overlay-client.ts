// The dev overlay client — a framework-agnostic vanilla script served by
// `medprotocol overlay --serve` at GET /overlay.js. Its job is to retrofit
// medical-protocol into apps that were built WITHOUT it: the doctor hovers ANY
// element on ANY page, selects it, and chooses to Audit that region or Implement
// it with medical protocol. Selection does not require the app to be tagged —
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

  // Is this element part of the overlay's own UI? Never select those.
  function isOwn(node) {
    return !!(node && node.closest && node.closest('.mpo-ui'));
  }

  var style = document.createElement('style');
  style.textContent = [
    '.mpo-box{position:fixed;z-index:2147483646;pointer-events:none;border:2px solid #2563eb;background:rgba(37,99,235,.08);border-radius:4px;display:none}',
    '.mpo-badge{position:fixed;z-index:2147483647;pointer-events:none;background:#2563eb;color:#fff;font:600 11px/1.4 ui-monospace,monospace;padding:2px 6px;border-radius:4px;display:none;max-width:60vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mpo-toggle{position:fixed;bottom:16px;right:16px;z-index:2147483647;background:#0f172a;color:#fff;font:600 12px/1 system-ui,sans-serif;border:1px solid #334155;border-radius:8px;padding:10px 14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3)}',
    '.mpo-toggle[data-on="1"]{background:#2563eb;border-color:#2563eb}',
    '.mpo-menu{position:fixed;z-index:2147483647;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.4);font:500 13px/1 system-ui,sans-serif;display:none;max-width:320px}',
    '.mpo-menu button{display:block;width:100%;text-align:left;background:none;border:none;color:#fff;padding:8px 12px;border-radius:6px;cursor:pointer;white-space:nowrap}',
    '.mpo-menu button:hover{background:#1e293b}',
    '.mpo-head{padding:6px 12px;color:#94a3b8;font:600 11px/1.4 ui-monospace,monospace;border-bottom:1px solid #1e293b;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mpo-hint{padding:4px 12px 6px;color:#64748b;font:400 10px/1.4 system-ui,sans-serif}',
    '.mpo-toast{position:fixed;bottom:64px;right:16px;z-index:2147483647;color:#fff;font:500 13px/1.4 system-ui,sans-serif;padding:10px 14px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.3);transition:opacity .3s;max-width:340px}',
    '@keyframes mpo-spin{to{transform:rotate(360deg)}}',
    '@keyframes mpo-pulse{0%,100%{opacity:.45}50%{opacity:1}}',
    '.mpo-track-box{position:fixed;z-index:2147483645;pointer-events:none;border:2px dashed #f59e0b;border-radius:4px;display:none;animation:mpo-pulse 1.2s ease-in-out infinite}',
    '.mpo-track-box.done{border-style:solid;border-color:#16a34a;animation:none}',
    '.mpo-track-pill{position:fixed;z-index:2147483647;pointer-events:none;display:none;align-items:center;gap:6px;background:#f59e0b;color:#0f172a;font:600 11px/1.4 system-ui,sans-serif;padding:4px 9px;border-radius:9999px;box-shadow:0 2px 8px rgba(0,0,0,.3);white-space:nowrap}',
    '.mpo-track-pill.done{background:#16a34a;color:#fff}',
    '.mpo-spin{width:10px;height:10px;border:2px solid rgba(15,23,42,.3);border-top-color:#0f172a;border-radius:50%;display:inline-block;animation:mpo-spin .7s linear infinite}',
    '.mpo-clickable{pointer-events:auto;cursor:pointer}',
    '.mpo-panel{position:fixed;top:8vh;right:16px;z-index:2147483647;width:min(540px,92vw);max-height:80vh;display:none;flex-direction:column;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.5)}',
    '.mpo-panel-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #1e293b}',
    '.mpo-panel-title{flex:1;min-width:0;font:600 12px/1.4 ui-monospace,monospace;color:#93c5fd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mpo-panel-btn{background:#1e293b;color:#e2e8f0;border:none;border-radius:6px;padding:5px 9px;cursor:pointer;font:600 11px/1 system-ui,sans-serif}',
    '.mpo-panel-btn:hover{background:#334155}',
    '.mpo-panel-body{padding:12px 14px;overflow:auto;white-space:pre-wrap;word-break:break-word;font:400 12.5px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}'
  ].join('');
  document.head.appendChild(style);

  var box = el('div', 'mpo-box mpo-ui');
  var badge = el('div', 'mpo-badge mpo-ui');
  var menu = el('div', 'mpo-menu mpo-ui');
  var toggle = el('button', 'mpo-toggle mpo-ui');
  toggle.textContent = '🩺 Protocol select';

  // Result panel (singleton)
  var panel = el('div', 'mpo-panel mpo-ui');
  var panelTitle = el('div', 'mpo-panel-title');
  var panelBody = el('div', 'mpo-panel-body');
  (function buildPanel() {
    var head = el('div', 'mpo-panel-head');
    var dismiss = el('button', 'mpo-panel-btn'); dismiss.textContent = 'Dismiss';
    dismiss.addEventListener('click', function () { if (panelOrder) dropMarker(panelOrder); closePanel(); });
    var close = el('button', 'mpo-panel-btn'); close.textContent = '✕';
    close.addEventListener('click', closePanel);
    head.appendChild(panelTitle); head.appendChild(dismiss); head.appendChild(close);
    panel.appendChild(head); panel.appendChild(panelBody);
  })();

  function mount() {
    document.body.appendChild(box);
    document.body.appendChild(badge);
    document.body.appendChild(menu);
    document.body.appendChild(toggle);
    document.body.appendChild(panel);
  }
  if (document.body) { mount(); } else { document.addEventListener('DOMContentLoaded', mount); }

  function hideHighlight() { box.style.display = 'none'; badge.style.display = 'none'; }
  function hideMenu() { menu.style.display = 'none'; }

  function setActive(on) {
    active = on;
    toggle.setAttribute('data-on', on ? '1' : '0');
    toggle.textContent = on ? '🩺 Selecting… (↑ wider · Esc)' : '🩺 Protocol select';
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

  function menuBtn(txt, fn) {
    var b = document.createElement('button');
    b.textContent = txt;
    b.addEventListener('click', function (ev) { ev.stopPropagation(); fn(); });
    return b;
  }

  function openMenu(x, y, node) {
    menu.innerHTML = '';
    var head = el('div', 'mpo-head'); head.textContent = label(node); menu.appendChild(head);
    menu.appendChild(menuBtn('Audit this with medical protocol', function () { send('audit', node); }));
    menu.appendChild(menuBtn('Implement with medical protocol', function () { send('implement', node); }));
    menu.appendChild(menuBtn('Copy selector', function () { copy(cssPath(node)); hideMenu(); }));
    menu.appendChild(menuBtn('Cancel', function () { hideMenu(); }));
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

  function send(action, node) {
    hideMenu();
    var order = {
      action: action,
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
      toast('Queued ' + action + ' for <' + (order.tag || 'node') + '>', '#16a34a');
      track(resp.file, order.selector, action);
    }).catch(function (err) {
      toast('Queue failed: ' + err.message + ' — is "medprotocol overlay --serve" running?', '#dc2626');
    });
  }

  // ── Progress markers: pin a spinner over the selected element until the agent finishes ──

  function track(file, selector, action) {
    if (!file) return;
    var b = el('div', 'mpo-track-box mpo-ui');
    var p = el('div', 'mpo-track-pill mpo-ui');
    var spin = el('span', 'mpo-spin');
    var lbl = document.createElement('span');
    lbl.textContent = action === 'audit' ? 'queued audit…' : 'queued implement…';
    p.appendChild(spin); p.appendChild(lbl);
    document.body.appendChild(b); document.body.appendChild(p);
    var t = { file: file, selector: selector, action: action, box: b, pill: p, label: lbl, done: false };
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

  function setStatus(t, status, hasResult) {
    if (t.done) return;
    if (status === 'processing') {
      t.label.textContent = t.action === 'audit' ? 'auditing…' : 'implementing…';
    } else if (status === 'done') {
      t.done = true;
      t.box.classList.add('done');
      t.pill.classList.add('done');
      t.pill.innerHTML = '';
      var c = document.createElement('span');
      if (hasResult) {
        c.textContent = (t.action === 'audit' ? '✓ audited' : '✓ implemented') + ' — view';
        t.pill.appendChild(c);
        t.pill.classList.add('mpo-clickable');
        t.pill.addEventListener('click', function () { openResultPanel(t); });
        // keep the marker on screen until the doctor dismisses it
      } else {
        c.textContent = t.action === 'audit' ? '✓ audited' : '✓ implemented';
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

  function openResultPanel(t) {
    panelOrder = t;
    panelTitle.textContent = (t.action === 'audit' ? 'Audit' : 'Implement') + ' — ' + (t.selector || t.file);
    panelBody.textContent = 'Loading…';
    panel.style.display = 'flex';
    fetch(BASE + '/result?file=' + encodeURIComponent(t.file)).then(function (r) { return r.json(); }).then(function (d) {
      var res = d && d.result;
      if (!res) { panelBody.textContent = 'No result recorded for this selection.'; return; }
      var text = '';
      if (res.score) text += 'Score: ' + res.score + '\\n\\n';
      text += (res.report != null ? res.report : JSON.stringify(res, null, 2));
      panelBody.textContent = text;
      panelBody.scrollTop = 0;
    }).catch(function (err) { panelBody.textContent = 'Could not load result: ' + err.message; });
  }

  function closePanel() { panel.style.display = 'none'; panelOrder = null; }

  function startPolling() { if (!pollTimer) pollTimer = setInterval(poll, 1200); }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function poll() {
    if (!tracked.length) { stopPolling(); return; }
    fetch(BASE + '/status').then(function (r) { return r.json(); }).then(function (list) {
      var byFile = {};
      for (var i = 0; i < list.length; i++) byFile[list[i].file] = list[i];
      for (var j = tracked.length - 1; j >= 0; j--) {
        var t = tracked[j];
        var s = byFile[t.file];
        // missing from the queue = cleared after completion → treat as done (no result to show)
        setStatus(t, s ? s.status : 'done', s ? s.hasResult : false);
        if (t.done) tracked.splice(j, 1);
      }
      repositionAll();
      if (!tracked.length) stopPolling();
    }).catch(function () { /* server down between polls — keep markers, retry next tick */ });
  }

  function copy(text) {
    if (navigator.clipboard) { navigator.clipboard.writeText(text); }
    toast('Copied selector', '#2563eb');
  }

  function toast(msg, color) {
    var t = el('div', 'mpo-toast mpo-ui');
    t.style.background = color || '#16a34a';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2800);
  }

  console.info('[medprotocol] overlay loaded — click "🩺 Protocol select" (bottom-right), hover any element, click to Audit or Implement. Server: ' + BASE);
})();
`;
