// The page `medprotocol syndromic --serve` serves: synthetic patients for the six bedside rules.
// Step 1 sets up a patient (at random, or with the results the user chooses) and the note's tone; step 2 is
// the note the model drafts for it; step 3 is each rule's result beside that note. The server generates the
// patient and runs every rule from plugin/lib: this page only draws what it gets. Nothing clinical is typed here.
// The look of the extraction page (extract-artifact.ts). Kept as String.raw with no backticks or `${`.

export const SYNDROMIC_PAGE_HTML = String.raw`<!doctype html>
<meta charset="utf-8">
<title>Synthetic patients</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital@0;1&family=Fira+Sans:wght@400;600&family=Fira+Sans+Condensed:wght@700&family=Geist+Mono:wght@500;600&display=swap" media="print" onload="this.media='all'">
<style>
:root{
  --ground:#f1ebde; --sheet:#fbf8f2; --ink:#1d1a16; --ink-2:#5a534a; --line:#cdc3b0; --hl:#e3d9c3;
  --bad:#b0182f; --warn:#8a5200; --mark:#3a2e2a;
  --ui:"Fira Sans",system-ui,sans-serif; --label:"Fira Sans Condensed","Arial Narrow",sans-serif;
  --text:"Spectral",Georgia,serif; --mono:"Geist Mono",ui-monospace,Menlo,monospace;
  --ease:cubic-bezier(.16,1,.3,1); --gut:16px;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#1d1a16; --sheet:#28241e; --ink:#f1ebde; --ink-2:#a89e8e; --line:#3d372f; --hl:#3d372f;
  --bad:#e7959f; --warn:#e3b566; --mark:var(--ink); color-scheme:dark}}
:root[data-theme="dark"]{
  --ground:#1d1a16; --sheet:#28241e; --ink:#f1ebde; --ink-2:#a89e8e; --line:#3d372f; --hl:#3d372f;
  --bad:#e7959f; --warn:#e3b566; --mark:var(--ink); color-scheme:dark}
@media (min-width:700px){:root{--gut:28px}}
*{box-sizing:border-box}
body{display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-height:100dvh;margin:0;background:var(--ground);color:var(--ink);font:400 15px/1.4 var(--ui);font-variant-numeric:tabular-nums}
@media (min-width:1024px){body{height:100dvh;overflow:hidden}}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
h1,h2,h3,p,ol,ul{margin:0;padding:0}
ol,ul{list-style:none}
[hidden]{display:none!important}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}

.run{display:flex;flex-wrap:wrap;align-items:center;gap:4px 24px;min-height:52px;padding:8px var(--gut);border-bottom:1px solid var(--ink)}
.brand{display:flex;align-items:center;gap:9px;font:700 14px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
.brand svg{width:20px;height:20px}
.brand path{stroke:var(--mark)}
h1{font:400 23px/1.1 var(--text);padding-left:24px;border-left:1px solid var(--line)}
.btn{all:unset;box-sizing:border-box;cursor:pointer;padding:8px 14px;border:1px solid var(--ink);font:600 14px/1.2 var(--ui);color:var(--ink);transition:background-color .3s var(--ease)}
.btn:hover{background:var(--line)}
.btn:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.btn.fill{border-radius:3px;background:var(--ink);color:var(--ground)}
.btn.fill:hover{background:var(--ink-2);border-color:var(--ink-2)}
.btn:disabled{border-color:var(--ink-2);color:var(--ink-2);cursor:default;background:transparent}
.bar{margin-left:auto;padding-inline:2px;border-color:transparent;font:700 12.5px/1.2 var(--label);letter-spacing:.12em;text-transform:uppercase}
.bar:hover{background:none;text-decoration:underline}

.shell{min-height:0}
@media (min-width:1024px){.shell{display:grid;grid-template-columns:300px minmax(0,1fr)}}
nav{padding:0 var(--gut) 20px;border-bottom:1px solid var(--line)}
@media (min-width:1024px){nav{overflow-y:auto;border-bottom:0;border-right:1px solid var(--line);padding-right:20px}}
.pane{min-width:0;padding:0 var(--gut) 40px}
@media (min-width:1024px){.pane{overflow-y:auto}}
.hd{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:end;gap:4px 12px;min-height:40px;padding-bottom:6px;border-bottom:1px solid var(--ink);font:italic 400 21px/24px var(--text)}
.hd span{font:400 13px/1.3 var(--ui);font-style:normal;color:var(--ink-2)}
.row{all:unset;box-sizing:border-box;cursor:pointer;display:flex;gap:12px;width:100%;padding:12px 10px;border-bottom:1px solid var(--line);transition:background-color .2s var(--ease)}
@media (min-width:1024px){.row{margin-inline:-10px;width:calc(100% + 20px)}}
.row:hover,.row[aria-current]{background:var(--sheet)}
.row:focus-visible{outline-offset:-2px}
.num{flex:none;display:grid;place-items:center;width:22px;height:22px;margin-top:1px;border:1px solid var(--ink-2);font:500 12px/1 var(--mono);color:var(--ink-2)}
.num.on{border-color:var(--ink);background:var(--ink);color:var(--ground)}
.tick{flex:none;width:16px;height:16px;margin-top:3px;border:1px solid var(--ink-2)}
.tick.done{border-color:var(--ink);background:linear-gradient(var(--ink),var(--ink)) center/8px 8px no-repeat}
.t{display:block;font-weight:600}
.s{display:block;margin-top:2px;font-size:13px;color:var(--ink-2)}
.code{font:500 14px/1 var(--mono);color:var(--ink)}

.view>header{padding:24px 0}
.view h2{font:400 30px/1.15 var(--text);text-wrap:balance}
.lead{margin-top:4px;font-size:14px;color:var(--ink-2)}
.form{display:grid;gap:32px;max-width:44rem}
.form .help{margin-top:8px;font-size:13px;color:var(--ink-2)}
.choice{display:inline-flex;flex-wrap:wrap;gap:16px;margin-top:10px}
.choice button{all:unset;cursor:pointer;padding:4px 1px;border-bottom:2px solid transparent;font:700 12.5px/1.2 var(--label);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2)}
.choice button[aria-checked="true"]{border-color:var(--ink);color:var(--ink)}
.choice button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.grid{display:grid;gap:12px 16px;margin-top:12px}
@media (min-width:640px){.grid{grid-template-columns:1fr 1fr}}
label{display:grid;gap:4px;font-size:14px;font-weight:600}
select{height:36px;padding:0 8px;border:1px solid var(--line);border-radius:0;background:var(--sheet);color:var(--ink);font:400 14px var(--ui)}
select:hover{border-color:var(--ink)}

.two{display:grid;gap:40px}
@media (min-width:1280px){.two{grid-template-columns:minmax(0,40rem) minmax(300px,1fr)}}
.sheet{align-self:start;border:1px solid var(--ink);background:var(--sheet);box-shadow:0 1px 2px rgba(29,26,22,.06),0 14px 28px -14px rgba(29,26,22,.28)}
.sheet>header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:4px 16px;padding:6px 20px;border-bottom:1px solid var(--ink);font:500 14px var(--mono)}
.sheet .choice{margin:0}
.note{padding:20px 28px 32px;font:400 17px/1.65 var(--text);white-space:pre-wrap;overflow-wrap:anywhere}
.acts{display:flex;flex-wrap:wrap;gap:10px;padding:0 28px 24px}
.note .err{font:400 14px var(--ui);color:var(--bad);white-space:normal}
.skel{height:14px;margin:12px 0;background:var(--hl);animation:p 1.4s ease-in-out infinite}
@keyframes p{50%{opacity:.4}}
@media (prefers-reduced-motion:reduce){.skel{animation:none}}
.res{padding:12px 0;border-bottom:1px solid var(--line)}
.res h3{display:flex;gap:10px;font:400 20px/1.2 var(--text)}
.res h3::before{content:"";flex:none;width:8px;height:8px;margin-top:7px;background:var(--ink)}
.res.found h3{color:var(--warn)}
.res.found h3::before{background:var(--warn)}
.res.open h3::before{background:none;border:1.5px solid var(--ink-2);border-radius:50%}
.res p{margin-top:6px;padding-left:18px;font-size:14px;color:var(--ink-2)}
.res .k{margin-right:6px;font:700 11.5px/1 var(--label);letter-spacing:.1em;text-transform:uppercase;color:var(--ink)}
.cav{margin-top:12px;font-size:12.5px;color:var(--ink-2)}
dl{display:grid;grid-template-columns:auto 1fr;gap:0 16px;margin-top:8px;font-size:14px}
dt,dd{margin:0;padding:6px 0;border-bottom:1px solid var(--line)}
dt{color:var(--ink-2)}
dd{font-weight:600}
.list .row{display:grid;grid-template-columns:24px minmax(0,1fr) auto;align-items:baseline}
.list .i{font:500 12px var(--mono);color:var(--ink-2)}
.list .go{font-size:13px;color:var(--ink-2)}
.next{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:48px;padding-top:16px;border-top:1px solid var(--ink)}
.mt{margin-top:24px}

footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 24px;padding:10px var(--gut);border-top:1px solid var(--ink);background:var(--ground);font-size:14px}
footer b{font-weight:600}
footer span{color:var(--ink-2)}
</style>

<header class="run">
  <span class="brand"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8.5 6 L2.5 16 L8.5 26 M23.5 6 L29.5 16 L23.5 26" fill="none" stroke-width="4" stroke-linecap="square"/><rect x="9.5" y="13.75" width="13" height="4.5" fill="#e8907a"/><rect x="13.75" y="9.5" width="4.5" height="13" fill="#e8907a"/></svg>Medical Protocol</span>
  <h1>Synthetic patients</h1>
  <button type="button" class="btn bar" id="theme">Dark mode</button>
</header>

<main class="shell">
  <nav aria-label="Steps">
    <h2 class="hd">In this order <span id="count"></span></h2>
    <ol id="steps"></ol>
  </nav>
  <div class="pane" id="pane">
    <section class="view" id="setup" aria-labelledby="setup-h">
      <header><h2 id="setup-h">Generate a patient</h2><p class="lead">One synthetic person for all six assessments. The model then drafts its note.</p></header>
      <div class="form">
        <div>
          <h3 class="hd">How</h3>
          <div class="choice" role="radiogroup" aria-label="How to make the patient" id="mode"></div>
          <p class="help" id="mode-help"></p>
        </div>
        <div id="results" hidden>
          <h3 class="hd">Results <span>Only results that fit together, plus each one's "no".</span></h3>
          <div class="grid" id="selects"></div>
          <p class="help">A "no" that fits no case with the others is taken from another case; the patient then says so.</p>
        </div>
        <div>
          <h3 class="hd">Note tone</h3>
          <div class="choice" role="radiogroup" aria-label="Note tone" id="tone"></div>
        </div>
        <div><button type="button" class="btn fill" id="go">Generate random patient</button> <p class="help" id="go-err" role="alert"></p></div>
      </div>
    </section>
    <section class="view" id="noteview" aria-labelledby="note-h" hidden>
      <header><h2 id="note-h">The note</h2><p class="lead" id="note-lead"></p></header>
      <div class="two">
        <div id="sheet-a"></div>
        <div>
          <h3 class="hd">What the six rules say <span>Step 3, in this order</span></h3>
          <ol class="list" id="summary"></ol>
          <button type="button" class="btn fill mt" id="first">Next: Shock category →</button>
        </div>
      </div>
    </section>
    <section class="view" id="rule" aria-labelledby="rule-h" hidden>
      <header><h2 id="rule-h"></h2><p class="lead" id="rule-lead"></p></header>
      <div class="two">
        <div id="sheet-b"></div>
        <div>
          <h3 class="hd">What the rule says</h3>
          <div id="verdict"></div>
          <h3 class="hd mt">Findings <span>As the generator drew them</span></h3>
          <dl id="findings"></dl>
        </div>
      </div>
      <nav class="next" aria-label="Assessment order"><button type="button" class="btn" id="prev"></button><button type="button" class="btn fill" id="nxt"></button></nav>
    </section>
  </div>
</main>

<footer><b>Learning prototype — not for patient care.</b><span>Every patient is synthetic. Notes are drafted by the model; results come from plugin/lib.</span></footer>

<script>
(function () {
  var MODES = { random: "Random", choose: "Choose the results" };
  var TONES = { ed: "ED shorthand", outpatient: "Outpatient, written" };
  var ANY = "Any";
  var S = { view: "setup", mode: "random", tone: "ed", want: {}, assessments: [], options: {}, patient: null, notes: {}, seen: {} };

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function $(id) { return document.getElementById(id); }
  function post(path, body) {
    return fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Request failed"); return j; }); });
  }

  var themeBtn = $("theme");
  function dark() { var t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
  function themeLabel() { themeBtn.textContent = dark() ? "Light mode" : "Dark mode"; }
  themeBtn.onclick = function () { document.documentElement.dataset.theme = dark() ? "light" : "dark"; themeLabel(); };
  themeLabel();

  /** A row of radio buttons, arrow keys move between them. */
  function choice(box, labels, value, onPick) {
    box.textContent = "";
    Object.keys(labels).forEach(function (k, i, keys) {
      var b = el("button", "", labels[k]);
      b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(k === value)); b.tabIndex = k === value ? 0 : -1;
      b.onclick = function () { onPick(k); };
      b.onkeydown = function (e) {
        var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!d) return;
        e.preventDefault(); onPick(keys[(i + d + keys.length) % keys.length]);
        box.querySelector('[aria-checked="true"]').focus();
      };
      box.appendChild(b);
    });
  }

  function title(id) { var a = S.assessments.filter(function (x) { return x.id === id; })[0]; return a ? a.title : id; }
  function mixedText(p) { return p.mixed.map(title).join(" and ") + " from another case"; }

  function open(view) {
    S.view = view;
    if (view !== "setup" && view !== "noteview") S.seen[view] = true;
    draw();
    $("pane").scrollTo(0, 0);
  }

  // --- step 1 -------------------------------------------------------------------------------------------
  function drawSetup() {
    $("setup-h").textContent = S.patient ? "Generate another patient" : "Generate a patient";
    choice($("mode"), MODES, S.mode, function (m) { S.mode = m; drawSetup(); });
    $("mode-help").textContent = S.mode === "random" ? "A case at random sets all six results." : 'Set the results you want; the rest stay "Any" and are picked at random.';
    $("results").hidden = S.mode !== "choose";
    choice($("tone"), TONES, S.tone, function (t) { S.tone = t; draw(); });
    $("go").textContent = S.mode === "choose" ? "Generate patient with these results" : "Generate random patient";
    var box = $("selects");
    box.textContent = "";
    S.assessments.forEach(function (a) {
      var l = el("label", "", a.title), sel = el("select");
      [ANY].concat(S.options[a.id] || []).forEach(function (o) { var op = el("option", "", o); op.value = o === ANY ? "" : o; sel.appendChild(op); });
      sel.value = S.want[a.id] || "";
      sel.onchange = function () {
        if (sel.value) S.want[a.id] = sel.value; else delete S.want[a.id];
        loadOptions().then(function () { drawSetup(); box.querySelectorAll("select")[S.assessments.indexOf(a)].focus(); });
      };
      l.appendChild(sel); box.appendChild(l);
    });
  }
  function loadOptions() {
    return post("/api/options", { want: S.want }).then(function (j) { S.assessments = j.assessments; S.options = j.options; });
  }
  $("go").onclick = function () {
    var go = $("go");
    go.disabled = true; $("go-err").textContent = "";
    post("/api/patients", { want: S.mode === "choose" ? S.want : {} })
      .then(function (p) { S.patient = p; S.notes = {}; S.seen = {}; open("noteview"); })
      .catch(function (e) { $("go-err").textContent = e.message; })
      .then(function () { go.disabled = false; });
  };

  // --- the note -----------------------------------------------------------------------------------------
  function note() {
    var p = S.patient, key = p.code + ":" + S.tone;
    if (!S.notes[key]) {
      S.notes[key] = { text: null };
      post("/api/notes", { findings: p.findings, style: S.tone })
        .then(function (j) { S.notes[key] = { text: j.note }; })
        .catch(function (e) { S.notes[key] = { error: e.message }; })
        .then(draw);
    }
    return S.notes[key];
  }
  function sheet(box) {
    var n = note(), f = el("figure", "sheet"), h = el("header"), t = el("div", "choice");
    f.style.margin = "0";
    h.appendChild(el("span", "", "Note for patient " + S.patient.code));
    t.setAttribute("role", "radiogroup"); t.setAttribute("aria-label", "Note tone");
    choice(t, TONES, S.tone, function (k) { S.tone = k; draw(); });
    h.appendChild(t); f.appendChild(h);
    var body = el("div", "note");
    if (n.text) body.textContent = n.text;
    else if (n.error) { var e = el("p", "err", n.error + " "); var again = el("button", "btn", "Try again"); again.type = "button"; again.onclick = function () { delete S.notes[S.patient.code + ":" + S.tone]; draw(); }; e.appendChild(again); body.appendChild(e); }
    else { body.setAttribute("role", "status"); body.setAttribute("aria-label", "Drafting the note"); [92, 64, 80, 48, 86, 70].forEach(function (w) { var d = el("div", "skel"); d.style.width = w + "%"; body.appendChild(d); }); }
    f.appendChild(body);
    if (n.text) f.appendChild(noteActions(n.text));
    box.textContent = ""; box.appendChild(f);
  }
  /** Copy the note, or save it as a text file through the browser's own download. */
  function noteActions(text) {
    var row = el("div", "acts"), copy = el("button", "btn", "Copy note"), save = el("button", "btn", "Save as text file");
    copy.type = save.type = "button";
    function said(ok) { copy.textContent = ok ? "Copied" : "Copy failed"; setTimeout(function () { copy.textContent = "Copy note"; }, 1800); }
    copy.onclick = function () {
      function fallback() {
        var t = el("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
        t.remove(); said(ok);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { said(true); }, fallback);
      else fallback();
    };
    save.onclick = function () {
      var a = el("a"), url = URL.createObjectURL(new Blob([text + "\n"], { type: "text/plain" }));
      a.href = url; a.download = "synthetic-note-" + S.patient.code + "-" + S.tone + ".txt";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    };
    row.appendChild(copy); row.appendChild(save);
    return row;
  }
  function lead() {
    var p = S.patient;
    return "Synthetic patient " + p.code + " · " + p.story.toLowerCase() + (p.mixed.length ? " · " + mixedText(p) + ", so the note may not read as one person" : "");
  }
  function drawNote() {
    $("note-lead").textContent = lead();
    sheet($("sheet-a"));
    var ol = $("summary"); ol.textContent = "";
    S.patient.cards.forEach(function (c, i) {
      var li = el("li"), b = el("button", "row"), mid = el("span");
      b.type = "button"; b.onclick = function () { open(c.id); };
      mid.appendChild(el("span", "t", c.title)); mid.appendChild(el("span", "s", c.result));
      b.appendChild(el("span", "i", String(i + 1))); b.appendChild(mid); b.appendChild(el("span", "go", "Open →"));
      li.appendChild(b); ol.appendChild(li);
    });
  }
  $("first").onclick = function () { open(S.assessments[0].id); };

  // --- one rule -----------------------------------------------------------------------------------------
  function line(box, k, text) { if (!text) return; var p = el("p"); p.appendChild(el("b", "k", k)); p.appendChild(document.createTextNode(text)); box.appendChild(p); }
  function drawRule() {
    var cards = S.patient.cards, at = cards.map(function (c) { return c.id; }).indexOf(S.view), c = cards[at];
    $("rule-h").textContent = c.title;
    $("rule-lead").textContent = "Assessment " + (at + 1) + " of " + cards.length + " · " + lead().charAt(0).toLowerCase() + lead().slice(1);
    sheet($("sheet-b"));
    var v = $("verdict"); v.textContent = "";
    var r = el("div", "res " + c.tone); r.appendChild(el("h3", "", c.result));
    line(r, "Why", c.why); line(r, "Agrees", c.agrees);
    c.next.forEach(function (n) { line(r, "Next", n); });
    r.appendChild(el("p", "cav", c.caveat));
    v.appendChild(r);
    var dl = $("findings"); dl.textContent = "";
    c.findings.forEach(function (f) { dl.appendChild(el("dt", "", f[0])); dl.appendChild(el("dd", "", f[1])); });
    var prev = cards[at - 1], next = cards[at + 1];
    $("prev").textContent = "← " + (prev ? prev.title : "The note");
    $("prev").onclick = function () { open(prev ? prev.id : "noteview"); };
    $("nxt").textContent = (next ? "Next: " + next.title : "Back to the note") + " →";
    $("nxt").onclick = function () { open(next ? next.id : "noteview"); };
  }

  // --- the rail -----------------------------------------------------------------------------------------
  function step(n, on, done, t, s, view, current) {
    var li = el("li"), b = el("button", "row"), mid = el("span");
    b.type = "button"; if (current) b.setAttribute("aria-current", "true");
    b.onclick = function () { open(view); };
    b.appendChild(el("span", on ? "num on" : "num", String(n)));
    mid.appendChild(el("span", "t", t)); if (done) mid.appendChild(el("span", "sr", " (done)"));
    mid.appendChild(el("span", "s", s)); b.appendChild(mid); li.appendChild(b);
    return li;
  }
  function drawRail() {
    var p = S.patient, seen = Object.keys(S.seen).length, total = S.assessments.length;
    var next = !p ? 1 : seen === 0 ? 2 : seen < total ? 3 : 0;
    var n = p && S.notes[p.code + ":" + S.tone];
    $("count").textContent = p ? seen + " of " + total + " checked" : "";
    var ol = $("steps"); ol.textContent = "";
    ol.appendChild(step(1, next === 1, !!p, "Generate a patient", p ? p.code + " · " + p.story + (p.mixed.length ? " · " + mixedText(p) : "") : "Random, or with the results you choose.", "setup", S.view === "setup"));
    ol.appendChild(step(2, next === 2, !!p && seen > 0, "Read the note", !p ? "After step 1." : n && n.text ? TONES[S.tone] + ", ready to read." : n && n.error ? "The note could not be drafted." : "The model is drafting it…", p ? "noteview" : "setup", S.view === "noteview"));
    var li = el("li"), h = step(3, next === 3, !!p && next === 0, "Check the six assessments", p ? (next === 0 ? "All six seen." : "In order, each beside the note.") : "After step 1.", p ? S.assessments[0].id : "setup", false);
    li.appendChild(h.firstChild);
    var sub = el("ol");
    S.assessments.forEach(function (a) {
      var c = p && p.cards.filter(function (x) { return x.id === a.id; })[0];
      var r = el("li"), b = el("button", "row"), mid = el("span");
      b.type = "button"; if (S.view === a.id) b.setAttribute("aria-current", "true");
      b.disabled = !p; b.onclick = function () { if (p) open(a.id); };
      b.appendChild(el("span", S.seen[a.id] ? "tick done" : "tick"));
      mid.appendChild(el("span", "t", a.title)); mid.appendChild(el("span", "s", c ? c.result : "No patient yet"));
      b.appendChild(mid); r.appendChild(b); sub.appendChild(r);
    });
    li.appendChild(sub); ol.appendChild(li);
  }

  function draw() {
    ["setup", "noteview", "rule"].forEach(function (v) { $(v).hidden = true; });
    var view = S.patient || S.view === "setup" ? S.view : "setup";
    if (view === "setup") { $("setup").hidden = false; drawSetup(); }
    else if (view === "noteview") { $("noteview").hidden = false; drawNote(); }
    else { $("rule").hidden = false; drawRule(); }
    drawRail();
  }

  loadOptions().then(draw).catch(function (e) { $("go-err").textContent = "Could not reach the page's server: " + e.message; draw(); });
})();
</script>
`;
