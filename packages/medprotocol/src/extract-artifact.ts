// The page `medprotocol extract --artifact <file>` writes: one extraction as a marked-up proof. Every
// value is listed at left in one place (what needs review, then current illness, history, labs); the note
// stands at right as it was written, with the words each value came from highlighted.
// The field sheet of the landing page (claude-medical-protocol/DESIGN.md): warm paper, ink, one carmine.
// A standalone local file: it holds the full note and is never published.
// __TITLE__ and __DATA__ are filled by the CLI. Kept as String.raw with no backticks or `${`.
// `medprotocol extract --serve` serves the same page with __DATA__ = {"live":true}: it then takes the
// note in a form, asks the local server for the state of #<hash> and draws that.

export const EXTRACT_ARTIFACT_HTML = String.raw`<!doctype html>
<meta charset="utf-8">
<title>__TITLE__</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital@0;1&family=Fira+Sans:wght@400;600&family=Fira+Sans+Condensed:wght@700&family=Geist+Mono:wght@500&display=swap" media="print" onload="this.media='all'">
<style>
:root{
  --ground:#f1ebde; --sheet:#fbf8f2; --ink:#1d1a16; --ink-2:#5a534a; --line:#cdc3b0;
  --hl:#e3d9c3; --hl-line:#1d1a16;
  --bad:#b0182f; --bad-t:#f1d5d8;
  --ui:"Fira Sans",system-ui,sans-serif;
  --label:"Fira Sans Condensed","Arial Narrow",sans-serif;
  --text:"Spectral",Georgia,serif;
  --mono:"Geist Mono",ui-monospace,Menlo,monospace;
  --ease:cubic-bezier(.16,1,.3,1); --mark:#3a2e2a;
  --gut:max(16px,env(safe-area-inset-left,0px)); --lh:29px; --mw:35rem;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#1d1a16; --sheet:#28241e; --ink:#f1ebde; --ink-2:#a89e8e; --line:#3d372f;
  --hl:#3d372f; --hl-line:#f1ebde;
  --bad:#e7959f; --bad-t:#4a2228; --mark:var(--ink); color-scheme:dark}}
:root[data-theme="dark"]{
  --ground:#1d1a16; --sheet:#28241e; --ink:#f1ebde; --ink-2:#a89e8e; --line:#3d372f;
  --hl:#3d372f; --hl-line:#f1ebde;
  --bad:#e7959f; --bad-t:#4a2228; --mark:var(--ink); color-scheme:dark}
@media (min-width:700px){:root{--gut:max(28px,env(safe-area-inset-left,0px))}}
*{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:var(--ink-2) transparent}
body{display:grid;grid-template-rows:auto minmax(0,1fr);height:100dvh;overflow:hidden;margin:0;background:var(--ground);color:var(--ink);font:400 15px/1.4 var(--ui);font-variant-numeric:tabular-nums;caret-color:var(--ink)}
::selection{background:var(--bad);color:var(--sheet)}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
h1,h2,h3,p,ol,ul{margin:0;padding:0}
ol,ul{list-style:none}
[hidden]{display:none!important}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}

/* top bar */
.run{display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px;min-height:52px;padding:8px var(--gut);padding-top:calc(8px + env(safe-area-inset-top,0px));border-bottom:1px solid var(--ink)}
.brand{display:flex;align-items:center;gap:9px;font:700 14px/1 var(--label);letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
.brand svg{width:20px;height:20px}
.brand path{stroke:var(--mark)}
h1{font:400 23px/1.1 var(--text);text-wrap:balance;overflow-wrap:anywhere;min-width:0;padding-left:24px;border-left:1px solid var(--line)}
.tally{margin-left:auto;display:flex;flex-wrap:wrap;gap:4px 18px;font-size:14px}
.tally li{display:flex;align-items:center;gap:7px}
.tally b{font:500 14px/1 var(--mono)}
.tally[hidden]~#new,.tally[hidden]~#new[hidden]~#theme{margin-left:auto}
/* live mode: the saved notes of this folder, in a dialog */
dialog{width:min(960px,calc(100vw - 32px));max-height:calc(100dvh - 32px);padding:0;border:1px solid var(--ink);background:var(--ground);color:var(--ink)}
dialog[open]{display:grid;grid-template-rows:auto minmax(0,1fr) auto}
dialog::backdrop{background:rgba(29,26,22,.55)}
dialog h2{margin:20px 20px 0}
dialog ol{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));align-content:start;overflow-y:auto;overscroll-behavior:contain}
dialog li{min-width:0}
dialog a{display:grid;gap:3px;padding:12px 20px;border-bottom:1px solid var(--line);color:inherit;text-decoration:none;transition:background-color .3s var(--ease)}
dialog a:hover,dialog a[aria-current]{background:var(--sheet)}
dialog a:focus-visible{outline-offset:-2px}
.first{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font:400 16px/1.5 var(--text)}
dialog a span+span{font-size:13px;color:var(--ink-2)}
dialog form{display:flex;justify-content:flex-end;padding:14px 20px}
.conn{flex-basis:100%;font-size:14px;color:var(--bad)}

.btn{all:unset;box-sizing:border-box;cursor:pointer;padding:8px 14px;border:1px solid var(--ink);font:600 14px/1.2 var(--ui);color:var(--ink);white-space:nowrap;transition:background-color .3s var(--ease),color .3s var(--ease)}
.btn:hover{background:var(--line)}
.btn:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.btn.fill{border-radius:3px;background:var(--ink);color:var(--ground)}
.btn.fill:hover{background:var(--ink-2);border-color:var(--ink-2)}
.btn:disabled,.btn:disabled:hover{background:transparent;border-color:var(--ink-2);color:var(--ink-2);cursor:default}

/* the one ramp of marks, the same in the bar, the rail and the margin:
   small square = found word for word, framed = the same in the history, dashed = close match, ring = missing or not stated.
   What was found is drawn small: the marks that need the eye are the carmine ones */
.m{display:inline-block;flex:none;width:14px;height:14px;background:linear-gradient(var(--ink),var(--ink)) center/6px 6px no-repeat}
.m.his{box-shadow:inset 0 0 0 1px var(--ink)}
.m.close{background:none;border:2px dashed var(--bad)}
.m.bad{background:none;border:2.5px solid var(--bad);border-radius:50%}

/* at left every value in one place; the note at right keeps its reading width. Each side scrolls by itself */
main{min-height:0}
.shell{display:grid;grid-template-columns:316px minmax(0,1fr);height:100%}
#panes{grid-template-columns:minmax(340px,1fr) minmax(0,44rem)}
.rail .lead,.rail .box,.step{max-width:34rem}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:0 36px;margin-bottom:26px}
.rail{min-height:0;overflow-y:auto;padding:0 20px 22px var(--gut);border-right:1px solid var(--line)}
h2{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:7px;border-bottom:1px solid var(--ink);font:italic 400 21px/24px var(--text)}
h2 span,h2 b{font:400 13px/1.3 var(--ui);color:var(--ink-2)}
h2 b{font:500 12px/1.3 var(--mono);color:var(--ink)}
/* the heads stack at the top of the pane as their sections scroll under them: head --i stops below the
   ones before it, and a click on it brings its section back. All are one height, so the stops are exact */
.rail h2,.ph{position:sticky;top:calc(var(--i,0)*40px);z-index:1;height:40px;padding-top:8px;background:var(--ground);box-shadow:-12px 0 var(--ground),12px 0 var(--ground)}
.rail section{display:contents}
.rail section>h2{cursor:pointer}
.lead{padding-top:10px;font-size:14px;color:var(--ink-2);text-wrap:pretty}
.empty{font-style:italic;color:var(--ink-2)}
.card{margin-inline:-12px;padding:10px 12px 12px;border-bottom:1px solid var(--line);transition:background-color .3s var(--ease)}
.card:hover,.card:focus-visible,.card:focus-within,.card.on{background:var(--sheet)}
.card:focus-visible{outline-offset:-2px}
h3{display:flex;align-items:start;gap:10px;font:400 20px/1.2 var(--text)}
h3 .m{margin-top:5px}
/* an answered correction steps back: its answer in words, and one button to change it */
.card.done h3{color:var(--ink-2)}
.card.done .st{color:var(--ink)}
.card p{margin-top:5px;font-size:14px;color:var(--ink-2)}
.card .st{font-weight:600}
.card.bad .st{color:var(--bad)}
.card.close .st{color:var(--bad)}
.k{margin-right:7px;font:700 11.5px/1 var(--label);letter-spacing:.1em;text-transform:uppercase}
/* the extracted value and the note's own numbers are set alike, to compare digit by digit */
.n{font:500 15px/1.3 var(--mono);color:var(--ink)}
.n.x,.card.bad .cmp:first-of-type .n{color:var(--bad)}
q{quotes:"\201C" "\201D";font-family:var(--text);color:var(--ink)}
/* the two answers stand apart, so neither is pressed by accident */
.acts{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;margin-top:12px}
/* the legend drops from its button in the bar: what each mark means, and how many there are */
.lg{position:relative}
.lg summary::-webkit-details-marker{display:none}
.run .btn:not(.fill){padding-inline:2px;border-color:transparent;font:700 12.5px/1.2 var(--label);letter-spacing:.12em;text-transform:uppercase;text-underline-offset:5px}
.run .btn:not(.fill):hover,.lg[open] summary{background:none;text-decoration:underline}
.key{position:absolute;right:0;top:calc(100% + 8px);z-index:2;display:grid;gap:9px;width:max-content;max-width:min(440px,calc(100vw - 32px));padding:14px 16px;border:1px solid var(--ink);background:var(--ground);font-size:14px;color:var(--ink-2)}
.key li{display:grid;grid-template-columns:14px auto 1fr;align-items:baseline;gap:9px}
.key .m{align-self:start;margin-top:3px}
.key b{font:500 14px/1 var(--mono);color:var(--ink)}

/* the proof: the note as it was written, one sheet of raw text; only the quotes are marked */
.proof{display:grid;grid-template-rows:auto minmax(0,1fr);min-width:0;min-height:0;padding:0 var(--gut) 22px 28px}
#note,textarea{margin-top:14px;border:1px solid var(--ink);box-shadow:0 1px 2px rgba(29,26,22,.06),0 14px 28px -14px rgba(29,26,22,.28)}
#note{overflow-y:auto;padding:26px 40px 36px;background:var(--sheet);font:400 18px/var(--lh) var(--text);white-space:pre-wrap;overflow-wrap:anywhere}
/* a quote is a band of highlighter lower than the line, so two marked lines never touch, over a line under
   its words: solid = found, double = history, dashed carmine and no band = close match, carmine on a wash = bad */
mark{color:var(--ink);background:linear-gradient(var(--hl),var(--hl)) 0 50%/100% 1.3em no-repeat;padding:0 3px;text-decoration:underline 1px var(--hl-line);text-underline-offset:5px;text-decoration-skip-ink:none;-webkit-box-decoration-break:clone;box-decoration-break:clone;cursor:pointer}
mark.his{text-decoration-style:double;text-decoration-thickness:1px}
mark.close{--hl:transparent;--hl-line:var(--bad);text-decoration-style:dashed}
mark.bad{--hl:var(--bad-t);--hl-line:var(--bad);text-decoration-thickness:1.5px}
/* the quote pointed at is filled with its own ink, the text in paper */
mark.on{--hl:var(--hl-line);color:var(--sheet);text-decoration-color:transparent}
/* a group of values reads like a lab sheet, across then down, in as many columns as fit:
   field at left, the figure and its unit in fixed places at right, so figures line up */
.vals{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(15rem,100%),1fr));gap:0 36px;margin-bottom:26px}
.e{display:grid;grid-template-columns:14px fit-content(100%) minmax(0,1fr) auto;align-content:start;align-items:baseline;gap:0 6px;margin-inline:-6px;padding:6px 6px 7px;border-bottom:1px solid var(--line);font-size:13px;color:var(--ink-2);cursor:pointer;transition:background-color .3s var(--ease)}
.e .m{align-self:start;margin-top:3px}
.e:hover,.e:focus-visible,.e.on{background:var(--hl);color:var(--ink)}
.e:focus-visible{outline-offset:-2px}
.val{grid-column:4;text-align:right;white-space:nowrap}
.e:not(.t)::after{content:"";grid-area:1/3;border-bottom:1px dotted;opacity:.45;transform:translateY(-3px)}
/* a value in words is read, not compared: under its field, at text weight */
.e.t>span{grid-column:2/-1}
.e.t .val{text-align:left;white-space:normal}
/* the figure is the largest thing in an entry */
.v{font:500 15px/1.3 var(--mono);color:var(--ink)}
.v.txt{font:400 14.5px/1.35 var(--ui)}
.e small,.e .why{margin-left:5px;font-size:12px}
.e .u{display:inline-block;min-width:5ch;text-align:left}
.e.bad,.e.bad .v{color:var(--bad)}
.e.close .why{color:var(--bad)}
.e:hover.bad,.e.on.bad{background:var(--bad-t)}
@media (prefers-reduced-motion:no-preference){
  /* the highlighter is drawn across each quote once, when the note first appears */
  .fresh mark{animation:stroke .9s var(--ease) .1s both}
  @keyframes stroke{from{background-size:0 1.3em}}
}

/* live mode only (extract --serve): the intake form, the steps, the failed box */
.in .proof{grid-template-rows:auto minmax(160px,1fr) auto}
textarea{display:block;max-width:calc(var(--mw) + 80px);width:100%;padding:26px 40px;resize:none;background:var(--sheet);color:var(--ink);font:400 18px/var(--lh) var(--text)}
textarea:focus-visible{outline-offset:0}
textarea::placeholder{color:var(--ink-2);font-style:italic}
.send{display:grid;gap:16px;max-width:calc(var(--mw) + 80px);padding:22px 0 0}
.agree{display:flex;align-items:flex-start;gap:12px;color:var(--ink-2);cursor:pointer}
/* a square in a frame, like the marks */
.agree input{appearance:none;flex:none;width:18px;height:18px;margin:2px 0 0;border:1px solid var(--ink);background:var(--sheet);cursor:pointer;transition:background-color .3s var(--ease)}
.agree input:checked{background:var(--ink);box-shadow:inset 0 0 0 3px var(--sheet)}
.go{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-size:14px;color:var(--ink-2)}
.go .btn{padding:10px 20px}
/* the steps: done is a tick, now is the spinner, next is its number */
.step{display:grid;grid-template-columns:22px minmax(0,1fr);gap:2px 12px;padding:12px 0;border-bottom:1px solid var(--line)}
.step b{font:600 16px/1.25 var(--ui)}
.step p{grid-column:2;font-size:14px;color:var(--ink-2)}
.step.next b{color:var(--ink-2)}
.tr{display:grid;place-items:center;width:22px;height:22px;border:1px solid var(--ink-2);font:500 11px/1 var(--mono);color:var(--ink-2)}
.tr.ok{border-color:var(--ink);background:var(--ink)}
.tr svg{width:14px;height:14px;fill:none;stroke:var(--ground);stroke-width:2.2;stroke-linecap:square}
.tr.now{border:0}
/* waiting: a square whose filled quarter steps round; in a button it stands before the label */
.spin,.btn[aria-busy="true"]::before{content:"";display:inline-block;flex:none;width:16px;height:16px;border:2px solid var(--ink);background:conic-gradient(var(--ink) 25%,transparent 0)}
.btn[aria-busy="true"]::before{width:10px;height:10px;margin-right:8px;border:1.5px solid currentColor;vertical-align:-1px;background:conic-gradient(currentColor 25%,transparent 0)}
.busy .ph{position:relative}
.busy .ph::after{content:"";position:absolute;left:0;bottom:-2px;width:28%;height:2px;background:var(--bad)}
pre{margin:10px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;font:500 12.5px/1.5 var(--mono);color:var(--ink-2)}
.box{display:grid;justify-items:start;gap:14px;padding-top:4px}
@media (prefers-reduced-motion:no-preference){
  .spin,.btn[aria-busy="true"]::before{animation:turn 1s steps(4) infinite}
  @keyframes turn{to{transform:rotate(1turn)}}
  .busy .ph::after{animation:read 1.5s cubic-bezier(.65,0,.35,1) infinite alternate}
  @keyframes read{to{transform:translateX(257.2%)}}
}


/* narrow screens: one column, the page scrolls: the values, then the note */
@media (max-width:900px){
  body{display:block;height:auto;overflow:visible}
  .shell,#panes{display:flex;flex-direction:column;height:auto}
  .rail{overflow:visible;padding:0 var(--gut) 22px;border-right:0}
  /* a stack would take too much of a small screen: each head gives way to the next */
  .rail h2{top:0}
  /* the note is pasted first; what happens next comes after it */
  .in .rail{order:1}
  .proof{padding:0 var(--gut) 22px}
  textarea{min-height:240px}
  #note{overflow:visible;padding:18px 18px 24px}
  textarea{padding-inline:18px}
  /* the legend opens in the flow of the bar, on a line of its own */
  .lg[open]{flex-basis:100%}
  .key{position:static;margin-top:8px}
}
@media (max-width:640px){
  .tally{margin-left:0;flex-basis:100%}
  .run{column-gap:14px}
  h1{padding-left:14px}
}
</style>

<header class="run">
  <span class="brand"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8.5 6 L2.5 16 L8.5 26 M23.5 6 L29.5 16 L23.5 26" fill="none" stroke="#3a2e2a" stroke-width="4" stroke-linecap="square"/><rect x="9.5" y="13.75" width="13" height="4.5" fill="#e8907a"/><rect x="13.75" y="9.5" width="4.5" height="13" fill="#e8907a"/></svg>Medical Protocol</span>
  <h1 id="t"></h1>
  <button class="btn" id="pick" type="button" hidden>Saved notes</button>
  <ul class="tally" id="tally" aria-label="Counts"></ul>
  <details class="lg" id="legend"><summary class="btn">Legend</summary><ul class="key" id="key"></ul></details>
  <button class="btn fill" id="copy" type="button">Copy extraction JSON</button>
  <a class="btn" id="new" href="#" hidden>New note</a>
  <button class="btn" id="theme" type="button">Dark mode</button>
  <p class="conn" id="conn" role="alert" hidden>Lost the connection to the local server. Start it again with medprotocol extract --serve.</p>
</header>

<dialog id="notes" aria-labelledby="nh">
  <h2 id="nh">Saved notes<b id="ncount"></b></h2>
  <ol id="nlist"></ol>
  <form method="dialog"><button class="btn">Close</button></form>
</dialog>

<main>
  <form class="shell in" id="intake" hidden>
    <aside class="rail" id="plan">
      <h2>What happens next</h2>
      <p class="lead">It usually takes a minute or two.</p>
    </aside>
    <section class="proof">
      <h2 class="ph"><label for="paste">Paste the note here</label><span id="plen"></span></h2>
      <textarea id="paste" required placeholder="A made-up or de-identified note. Nothing is sent until you press Extract."></textarea>
      <div class="send">
        <label class="agree"><input type="checkbox" id="agree" required><span>This note is sent to the AI model, which runs on external servers. I confirm it is made up or de-identified: no names, record numbers, addresses or dates.</span></label>
        <p class="go"><button class="btn fill" id="go" type="submit" aria-describedby="why" disabled>Extract</button><span id="why"></span></p>
      </div>
    </section>
  </form>
  <div class="shell" id="panes">
    <aside class="rail" id="rail" aria-label="Extracted values"></aside>
    <section class="proof" aria-label="The note">
      <h2 class="ph">Note, as written<span id="len"></span></h2>
      <div class="fresh" id="note" tabindex="0"></div>
    </section>
  </div>
</main>

<script type="application/json" id="data">__DATA__</script>
<script>
(function () {
  var data = JSON.parse(document.getElementById("data").textContent);
  var CLOSE = { edited: 1, approximate: 1, reordered: 1 };
  // a figure is set in mono; words are set as text
  var FIG = /^[-+<>]?\d[\d.,\/]*$/;
  var LABEL = {
    quoted: "Found in note",
    edited: "Close match: case or accents differ",
    reordered: "Close match: words in another order",
    mismatched: "Quote doesn't state this value",
    unverified: "Not found in note",
    none: "No quote"
  };
  var TICK = '<svg viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5"/></svg>';
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  // how far to trust an item: "" found word for word (the words are there, not "this is right"),
  // "his" the same in the history, "close" a close match, "bad" missing or not stated
  function kind(it) { return it.status !== "quoted" ? (CLOSE[it.status] ? "close" : "bad") : it.episode === "history" ? "his" : ""; }
  function status(it) {
    if (it.status === "approximate") return "Close match: " + it.distance + (it.distance === 1 ? " character" : " characters") + " off";
    return LABEL[it.status] || it.status;
  }
  function mk(k) { var i = el("i", "m " + k); i.setAttribute("aria-hidden", "true"); return i; }
  function head(txt, count) { var h = el("h2", "", txt); if (count != null) h.appendChild(el("b", "", String(count))); return h; }
  // a labelled line of a card
  function line(label, cls) { var p = el("p", cls); p.appendChild(el("b", "k", label)); return p; }

  // light or dark: the system's choice until the button is pressed, then the one chosen, kept for next time
  var themeBtn = document.getElementById("theme"), root = document.documentElement;
  function theme(t) {
    if (t === "light" || t === "dark") root.dataset.theme = t;
    var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    themeBtn.textContent = dark ? "Light mode" : "Dark mode";
    return dark;
  }
  try { theme(localStorage.getItem("theme")); } catch (e) { theme(); }
  themeBtn.addEventListener("click", function () {
    var t = theme() ? "light" : "dark";
    theme(t);
    try { localStorage.setItem("theme", t); } catch (e) {}
  });

  var title = document.getElementById("t");
  var tally = document.getElementById("tally");
  var copyBtn = document.getElementById("copy");
  var legend = document.getElementById("legend"), key = document.getElementById("key");
  // a click anywhere else closes the legend
  document.addEventListener("click", function (e) { if (!legend.contains(e.target)) legend.open = false; });
  var note = document.getElementById("note");
  var rail = document.getElementById("rail");
  var len = document.getElementById("len");
  // what the last render drew; the listeners below work on these. rows[n]: the margin entry and the rail card of item n
  var items = [], text = "", json = "[]", marksOf = [], rows = [], flagged = 0;

  function copied(ok) {
    // the JSON carries no status, so say here that some of it is not verified
    copyBtn.textContent = !ok ? "Copy failed" : flagged ? "Copied, " + flagged + (flagged === 1 ? " needs review" : " need review") : "Copied";
    setTimeout(function () { copyBtn.textContent = "Copy extraction JSON"; }, flagged ? 3500 : 1800);
  }
  copyBtn.addEventListener("click", function () {
    function fallback() {
      var t = el("textarea"); t.value = json; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      t.remove(); copied(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(function () { copied(true); }, fallback);
    else fallback();
  });

  // pinned: the item chosen with a click or Enter; it stays lit until another is chosen or Esc
  var pinned = -1;
  function on(n) {
    rows[n].forEach(function (r) { r.classList.add("on"); });
    marksOf[n].forEach(function (m) { m.classList.add("on"); });
  }
  function clear() {
    document.querySelectorAll(".on").forEach(function (e) { e.classList.remove("on"); });
    if (pinned >= 0) on(pinned);
  }
  // brings e to top px below the top of its pane (no top: to the middle). Only that pane moves, or the
  // page on a narrow screen: scrollIntoView would also move the page under the bar
  function bring(e, top) {
    var box = e.closest("#rail,#note"), own = getComputedStyle(box).overflowY !== "visible";
    var r = e.getBoundingClientRect(), b = own ? box.getBoundingClientRect() : { top: 0, height: innerHeight };
    if (top == null) top = (b.height - r.height) / 2;
    (own ? box : window).scrollBy({ top: r.top - b.top - top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function pin(n) {
    pinned = n; clear();
    if (marksOf[n][0]) bring(marksOf[n][0]);
  }
  // pointing at (or focusing) e lights item n in the note; a click or Enter brings its words into view.
  // Pointing alone never moves the note: the pointer crosses other rows on its way there
  function point(e, n) {
    function lit() { clear(); on(n); }
    e.addEventListener("mouseenter", lit);
    e.addEventListener("focusin", lit);
    e.addEventListener("mouseleave", clear);
    e.addEventListener("focusout", clear);
    e.addEventListener("click", function () { pin(n); });
    // not from a button inside a card
    e.addEventListener("keydown", function (ev) {
      if (ev.target !== e || (ev.key !== "Enter" && ev.key !== " ")) return;
      ev.preventDefault(); pin(n);
    });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { pinned = -1; clear(); legend.open = false; } });
  function over(e) {
    var m = e.target.closest("mark");
    if (!m) return;
    clear();
    m.dataset.items.split(" ").forEach(function (n) { on(n); });
  }
  note.addEventListener("mouseover", over);
  note.addEventListener("focusin", over);
  note.addEventListener("mouseleave", clear);
  note.addEventListener("focusout", clear);
  // a highlight, clicked or entered, brings its row into view
  function toRow(e) {
    var m = e.target.closest("mark");
    if (!m || (e.type === "keydown" && e.key !== "Enter")) return;
    var n = +m.dataset.items.split(" ")[0], r = rows[n];
    pinned = n; clear();
    // below the stacked heads
    if (r.length) bring(r[r.length - 1], rail.querySelectorAll("h2").length * 40 + 8);
  }
  note.addEventListener("click", toRow);
  note.addEventListener("keydown", toRow);

  // the row of an item in its group: its mark, field and value. Pointing at it lights its words in the note
  function entry(it, n) {
    var k = kind(it), fig = FIG.test(it.value), li = el("li", "e " + k + (fig ? "" : " t")), name = el("span", "", it.field), val = el("span", "val");
    li.tabIndex = 0;
    li.appendChild(mk(k));
    // the notes on a value stand with its field, so the figures stay in line
    // the labs are one group: say which ones are from before this illness
    if (it.lab === true && it.episode === "history") name.appendChild(el("small", "", "history"));
    // when it was taken: the one thing the check cannot verify, so it is always shown
    if (it.time) name.appendChild(el("small", "", it.time));
    if (k === "close" || k === "bad") name.appendChild(el("span", "why", k === "close" ? "close match" : it.status === "mismatched" ? "not stated" : "not found"));
    if (it.ambiguous) name.appendChild(el("small", "", "first of several"));
    li.appendChild(name);
    val.appendChild(el("b", fig ? "v" : "v txt", it.value));
    // a figure keeps the place of its unit even without one
    if (fig || it.unit) val.appendChild(el("small", "u", it.unit || ""));
    li.appendChild(val);
    li.appendChild(el("span", "sr", status(it)));
    point(li, n); rows[n].push(li);
    return li;
  }

  // the rail card of an item to review: its status in words, the value, and what the note says
  function card(it, n) {
    var k = kind(it), bad = it.status === "mismatched", li = el("li", "card " + k);
    li.tabIndex = 0;
    var h = el("h3"); h.appendChild(mk(k)); h.appendChild(document.createTextNode(it.field)); li.appendChild(h);
    li.appendChild(el("p", "st", status(it)));
    var v = line(bad ? "Extracted" : "Value", "cmp");
    v.appendChild(FIG.test(it.value) ? el("span", "n", it.value) : document.createTextNode(it.value));
    if (it.unit) v.appendChild(document.createTextNode(" " + it.unit));
    li.appendChild(v);
    if (it.quote && bad) {
      var q = line("Note says", "cmp");
      (it.start != null ? text.slice(it.start, it.end) : it.quote).split(/(\d[\d.,\/]*)/).forEach(function (part, i) {
        q.appendChild(i % 2 ? el("span", "n x", part) : document.createTextNode(part));
      });
      li.appendChild(q);
    } else if (it.quote) {
      var p = line("Quote"); p.appendChild(el("q", "", it.quote)); li.appendChild(p);
    }
    if (CLOSE[it.status] && it.start != null) {
      var s = line("Note says"); s.appendChild(document.createTextNode(text.slice(it.start, it.end))); li.appendChild(s);
    }
    var meta = [(it.lab === true ? "Labs · " : "") + (it.episode === "history" ? "History" : "Current illness")];
    if (it.time) meta.push(it.time);
    if (it.ambiguous) meta.push("Appears more than once: first occurrence marked");
    li.appendChild(el("p", "", meta.join(" · ")));
    point(li, n); rows[n].push(li);
    return li;
  }

  // numbers the heads of the rail for the stack; a click on one brings its section up under the stack
  function stack() {
    rail.querySelectorAll("h2").forEach(function (h, i) {
      h.style.setProperty("--i", i);
      h.onclick = function () { bring(h.nextElementSibling, (i + 1) * 40); };
    });
  }

  // draws one extraction from scratch: the bar, the rail and the proof
  function render(data) {
    var segs = data.segments;
    items = data.items;
    text = segs.map(function (s) { return s.text; }).join("");
    note.textContent = ""; rail.textContent = ""; tally.textContent = ""; key.textContent = "";
    pinned = -1; legend.hidden = !data.items.length;

    title.textContent = data.name;
    var count = { "": 0, his: 0, close: 0, bad: 0 };
    items.forEach(function (i) { count[kind(i)]++; });
    var found = count[""] + count.his;
    flagged = items.length - found;

    // copies the items as extracted; status and offsets are computed, never stored
    json = JSON.stringify(items.map(function (i) {
      var o = {};
      ["field", "key", "value", "unit", "quote", "episode", "lab", "time"].forEach(function (k) { if (i[k] != null) o[k] = i[k]; });
      return o;
    }), null, 2);

    // the note, only from its segments, as raw text. Each mark knows its items
    marksOf = items.map(function () { return []; });
    rows = items.map(function () { return []; });
    segs.forEach(function (s) {
      if (!s.items.length) { note.appendChild(document.createTextNode(s.text)); return; }
      var ks = s.items.map(function (n) { return kind(items[n]); });
      var m = el("mark", ks.indexOf("bad") >= 0 ? "bad" : ks.indexOf("close") >= 0 ? "close" : ks[0], s.text);
      m.dataset.items = s.items.join(" ");
      m.tabIndex = 0;
      s.items.forEach(function (n) { marksOf[n].push(m); });
      note.appendChild(m);
    });
    len.textContent = items.length ? "The highlighted words are where each value came from" : "";

    // the bar: what to distrust first
    [["bad", "missing or not stated"], ["close", count.close === 1 ? "close match" : "close matches"]].forEach(function (g) {
      if (!count[g[0]]) return;
      var li = el("li"); li.appendChild(mk(g[0])); li.appendChild(el("b", "", String(count[g[0]]))); li.appendChild(el("span", "", g[1])); tally.appendChild(li);
    });
    var f = el("li"); f.appendChild(mk("")); f.appendChild(el("b", "", found + "/" + items.length)); f.appendChild(el("span", "", "found word for word")); tally.appendChild(f);

    if (!items.length) { rail.appendChild(el("p", "empty", "Nothing was extracted from this note.")); return; }
    // a section of the rail: its head, then its body
    function sec(title, n, body, lead) {
      var s = el("section"); s.appendChild(head(title, n));
      if (lead) s.appendChild(el("p", "lead", lead));
      s.appendChild(body); rail.appendChild(s);
    }
    // first, every item that is not found word for word, in note order, with what the note says
    if (flagged) {
      var ol = el("ol", "cards");
      items.forEach(function (it, n) { if (it.status !== "quoted") ol.appendChild(card(it, n)); });
      sec("Needs review", flagged, ol, "The quote is missing, inexact, or doesn't state the value. Check each against the note.");
    }
    // then every item once, in its group, in note order; in the labs, this illness before the history
    [
      ["Current illness", function (i) { return i.lab !== true && i.episode !== "history"; }],
      ["History", function (i) { return i.lab !== true && i.episode === "history"; }],
      ["Labs", function (i) { return i.lab === true && i.episode !== "history"; }, function (i) { return i.lab === true && i.episode === "history"; }]
    ].forEach(function (g) {
      var ul = el("ul", "vals");
      g.slice(1).forEach(function (is) { items.forEach(function (it, n) { if (is(it)) ul.appendChild(entry(it, n)); }); });
      if (ul.firstChild) sec(g[0], ul.children.length, ul);
    });
    stack();
    // the legend: the counts by mark
    [["", "current illness, found word for word"], ["his", "history, found word for word"], ["close", "close match"], ["bad", "missing, or the quote doesn't state the value"]].forEach(function (g) {
      if (!count[g[0]]) return;
      var li = el("li"); li.appendChild(mk(g[0])); li.appendChild(el("b", "", String(count[g[0]]))); li.appendChild(el("span", "", g[1])); key.appendChild(li);
    });
  }

  if (!data.live) { render(data); return; }

  // live mode: the address holds the note's id as #<hash>; no hash is the intake form
  var panes = document.getElementById("panes");
  var intake = document.getElementById("intake");
  var paste = document.getElementById("paste");
  var agree = document.getElementById("agree");
  var go = document.getElementById("go");
  var why = document.getElementById("why");
  var conn = document.getElementById("conn");
  // one node for every state, so a change of its text is announced
  var statusLine = el("p", "sr"); statusLine.setAttribute("role", "status");
  // last: the response text already drawn. seq: answers to an older request are dropped
  var id = null, last = null, timer = 0, seq = 0, tick = 0;

  // the saved notes of this folder, newest first; asked for again each time the note on the page changes
  var pick = document.getElementById("pick"), dlg = document.getElementById("notes"), nlist = document.getElementById("nlist");
  var STATE = { extracting: "Working", verifying: "Working", failed: "Did not finish", review: "To review", done: "Done" };
  function notes() {
    fetch("/api/extractions").then(function (r) { return r.json(); }).then(function (list) {
      if (!Array.isArray(list)) return;
      pick.textContent = "Saved notes (" + list.length + ")";
      pick.hidden = !list.length;
      document.getElementById("ncount").textContent = String(list.length);
      nlist.textContent = "";
      list.forEach(function (n) {
        var li = el("li"), a = el("a");
        a.href = "#" + n.id;
        if (n.id === id) a.setAttribute("aria-current", "true");
        a.appendChild(el("span", "first", n.first));
        a.appendChild(el("span", "", (n.id === id ? "Open now · " : "") + STATE[n.state] + " · saved " + new Date(n.saved).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })));
        li.appendChild(a); nlist.appendChild(li);
      });
    }, function () {});
  }
  pick.addEventListener("click", function () { dlg.showModal(); });
  // a link opens its note through the address; the dialog only has to get out of the way
  nlist.addEventListener("click", function (e) { if (e.target.closest("a")) dlg.close(); });

  var STEPS = [
    ["Pull out the values", "Each value is copied with the exact words it came from."],
    ["Second check", "A second run re-reads the note and proposes corrections."],
    ["You review", "Accept or reject each correction. Nothing is interpreted."]
  ];
  // at: the step running now; -1 before the start
  function stepList(at) {
    var ol = el("ol");
    STEPS.forEach(function (s, n) {
      var done = n < at, now = n === at;
      var li = el("li", "step" + (at >= 0 && n > at ? " next" : ""));
      var ic = el("span", done ? "tr ok" : now ? "tr now" : "tr", done || now ? null : String(n + 1));
      ic.setAttribute("aria-hidden", "true");
      if (done) ic.innerHTML = TICK;
      if (now) { ic.appendChild(el("span", "spin")); li.setAttribute("aria-current", "step"); }
      li.appendChild(ic); li.appendChild(el("b", "", s[0])); li.appendChild(el("p", "", s[1]));
      ol.appendChild(li);
    });
    return ol;
  }
  document.getElementById("plan").appendChild(stepList(-1));

  // when this tab first saw the note being worked on, so a reload keeps the clock
  function started(id) {
    var t = Date.now();
    try { t = +sessionStorage.getItem("t" + id) || t; sessionStorage.setItem("t" + id, t); } catch (e) {}
    return t;
  }

  function send(noteText) {
    return fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: noteText, consent: true }) })
      .then(function (r) { return r.json(); });
  }

  function draw(s) {
    render(s);
    title.textContent = "Note extraction";
    var busy = s.state === "extracting" || s.state === "verifying";
    clearInterval(tick);
    panes.classList.toggle("busy", busy);
    tally.hidden = copyBtn.hidden = busy || s.state === "failed";
    if (tally.hidden) legend.hidden = true;
    if (!tally.hidden) { corrections(s); return; }
    rail.textContent = "";
    if (busy) {
      var at = s.state === "verifying" ? 1 : 0, clock = el("b"), from = started(s.id);
      var show = function () {
        var t = Math.max(0, Math.floor((Date.now() - from) / 1000));
        clock.textContent = Math.floor(t / 60) + ":" + ("0" + t % 60).slice(-2);
      };
      var h = head("Working on your note"); h.appendChild(clock); rail.appendChild(h);
      rail.appendChild(el("p", "lead", "It usually takes a minute or two. This page updates by itself."));
      show(); tick = setInterval(show, 1000);
      rail.appendChild(stepList(at));
      len.textContent = "The values appear when both steps finish";
      statusLine.textContent = at ? "Step 2 of 3: the second check is re-reading the note." : "Step 1 of 3: pulling out the values.";
      rail.appendChild(statusLine);
      return;
    }
    try { sessionStorage.removeItem("t" + s.id); } catch (e) {}
    var box = el("div", "box");
    rail.appendChild(head("The extraction did not finish"));
    rail.appendChild(el("p", "lead", "Your note is still here. Run it again, or start a new note."));
    statusLine.textContent = "The extraction did not finish.";
    box.appendChild(statusLine);
    if (s.error && s.error.indexOf("'claude' command was not found") >= 0) box.appendChild(el("p", "lead", "This page needs the Claude Code command line tool. You can also run the extraction from the chat with /medical-protocol:extract."));
    else if (s.error) box.appendChild(el("pre", "", s.error));
    var again = el("button", "btn fill", "Try again"); again.type = "button";
    // the doctor already confirmed this note
    again.addEventListener("click", function () {
      again.disabled = true; again.setAttribute("aria-busy", "true");
      // drawn again even when the run fails the same way, so the button comes back
      last = null;
      send(s.note).then(load, function () { again.disabled = false; again.removeAttribute("aria-busy"); conn.hidden = false; });
    });
    box.appendChild(again);
    rail.appendChild(box);
  }

  // one line of a finding: the label, then the item and its quote
  // old: the value being replaced, set in the alarm colour
  function says(label, it, old) {
    var p = line(label);
    if (!it) return p;
    p.appendChild(document.createTextNode(it.field + " "));
    p.appendChild(el("span", old ? "n x" : "n", it.value));
    p.appendChild(document.createTextNode((it.unit ? " " + it.unit : "") + " "));
    if (it.quote) p.appendChild(el("q", "", it.quote));
    return p;
  }

  function decide(s, n, decision, btn) {
    // both answers wait for the server; the pressed one shows it
    var both = btn.parentNode.querySelectorAll("button");
    function wait(on) {
      both.forEach(function (b) { b.disabled = on; });
      if (on) btn.setAttribute("aria-busy", "true"); else { btn.removeAttribute("aria-busy"); btn.focus(); }
    }
    wait(true);
    fetch("/api/extractions/" + s.id + "/decisions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ finding: n, decision: decision }) })
      .then(function (r) {
        return r.text().then(function (body) {
          conn.hidden = true;
          if (!r.ok) { last = null; load(); return; }
          // the redraw empties the rail and the note: keep where the doctor was reading and the pressed button
          var a = rail.scrollTop, b = note.scrollTop;
          // the highlights are already on the page: don't draw them in again
          note.classList.remove("fresh");
          last = body; draw(JSON.parse(body));
          rail.scrollTop = a; note.scrollTop = b;
          var btn = rail.querySelector('[data-f="' + n + '"]');
          if (btn) btn.focus();
        });
      }, function () { wait(false); conn.hidden = false; });
  }

  // review and done: the findings of the second check at the top of the rail, each with its two answers
  function corrections(s) {
    if (!s.findings.length) return;
    var open = s.findings.filter(function (f) { return (f.correction || f.index != null) && !f.decision; }).length;
    if (open) { var t = el("li"); t.appendChild(el("b", "", String(open))); t.appendChild(el("span", "", "to decide")); tally.insertBefore(t, tally.firstChild); }
    var sec = el("section");
    sec.appendChild(head("Corrections", s.findings.length));
    sec.appendChild(el("p", "lead", "The second check re-read the note. Accept each change or keep the original."));
    var ol = el("ol", "cards");
    s.findings.forEach(function (f, n) {
      var li = el("li", "card");
      li.appendChild(el("h3", "", f.problem));
      ol.appendChild(li);
      // a remark changes no item: a plain line
      if (!f.correction && f.index == null) return;
      var add = f.index == null;
      // the answer already given, in words: a filled button alone reads as something to press
      if (f.decision) li.classList.add("done");
      if (f.decision) li.appendChild(el("p", "st", f.decision === "rejected" ? (add ? "Not added" : "Kept the original") : add ? "Added" : f.correction ? "Accepted" : "Removed"));
      // a changed figure is named in both answers
      var fig = f.before && f.correction && f.before.value !== f.correction.value;
      if (f.before) li.appendChild(says("Was", f.before, fig));
      li.appendChild(add ? says("Add this item", f.correction) : f.correction ? says("Now", f.correction) : says("Remove this item"));
      var go = el("div", "acts"); go.setAttribute("role", "group"); go.setAttribute("aria-label", "Your answer");
      // neither answer is filled; once one is chosen only the other is offered, to change it
      [["accepted", add ? "Add" : fig ? "Accept " + f.correction.value : "Accept"], ["rejected", add ? "Don't add" : fig ? "Keep " + f.before.value : "Keep the original"]].forEach(function (d) {
        if (f.decision === d[0]) return;
        var b = el("button", "btn", d[1]); b.type = "button";
        b.dataset.f = n;
        b.addEventListener("click", function () { decide(s, n, d[0], b); });
        go.appendChild(b);
      });
      li.appendChild(go);
      // the item this finding leaves on the page, found by its content; a removed item has no quote to light
      var shown = f.decision === "rejected" ? f.before : f.correction, at = -1;
      if (shown) items.some(function (it, i) { return it.field === shown.field && it.value === shown.value && it.quote === shown.quote && (at = i, true); });
      // the same mark as the item has in the margin; a removed item has none there
      li.firstChild.insertBefore(mk(at >= 0 ? kind(items[at]) : "bad"), li.firstChild.firstChild);
      if (at >= 0) point(li, at);
    });
    sec.appendChild(ol);
    rail.insertBefore(sec, rail.firstChild);
    stack();
  }

  function load() {
    clearTimeout(timer);
    var mine = ++seq;
    fetch("/api/extractions/" + id).then(function (r) {
      return r.text().then(function (body) {
        if (mine !== seq) return;
        conn.hidden = true;
        // an address for a note this folder does not hold: back to the intake form
        if (!r.ok) { location.hash = ""; return; }
        var s = JSON.parse(body);
        // an unchanged answer is not drawn again, so the note keeps its scroll position
        if (body !== last) { last = body; draw(s); }
        if (s.state === "extracting" || s.state === "verifying") timer = setTimeout(load, 1500);
      });
    }, function () {
      if (mine !== seq) return;
      conn.hidden = false;
      timer = setTimeout(load, 1500);
    });
  }

  function route() {
    clearTimeout(timer); clearInterval(tick); seq++; last = null;
    var m = /^#([0-9a-f]{12})$/.exec(location.hash);
    id = m && m[1];
    intake.hidden = !!id; panes.hidden = !id;
    tally.hidden = copyBtn.hidden = legend.hidden = true;
    document.getElementById("new").hidden = !id;
    title.textContent = "Note extraction";
    // the bar under the note's head runs until the first answer
    panes.classList.toggle("busy", !!id);
    notes();
    if (id) { note.classList.add("fresh"); note.textContent = ""; rail.textContent = ""; len.textContent = ""; load(); }
    else paste.focus();
  }

  function sync() {
    var need = !paste.value.trim() ? "Paste the note to continue" : !agree.checked ? "Tick the box to continue" : "";
    go.disabled = !!need; why.textContent = need;
    go.removeAttribute("aria-busy"); go.textContent = "Extract";
    var lines = paste.value ? paste.value.split("\n").length : 0;
    document.getElementById("plen").textContent = lines ? lines + (lines === 1 ? " line" : " lines") : "";
  }
  paste.addEventListener("input", sync);
  agree.addEventListener("change", sync);
  intake.addEventListener("submit", function (e) {
    e.preventDefault();
    if (go.disabled) return;
    go.disabled = true; go.setAttribute("aria-busy", "true"); go.textContent = "Sending"; why.textContent = "";
    send(paste.value).then(function (r) {
      if (!r.id) { sync(); why.textContent = "The note could not be sent: " + r.error; return; }
      conn.hidden = true; intake.reset(); sync();
      location.hash = r.id;
    }, function () { sync(); conn.hidden = false; });
  });
  window.addEventListener("hashchange", route);
  sync(); route();
})();
</script>
`;
