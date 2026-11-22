// The page `medprotocol extract --artifact <file>` writes: one extraction as a marked-up proof. The note
// fills the centre, each value sits in the margin beside the line it came from, and the rail at left
// holds only what needs review. Black ink on white, yellow highlighter on the quotes, red for alarm.
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600&family=Schibsted+Grotesk:wght@400;500;700;800&family=Red+Hat+Mono:wght@500;700&display=swap">
<style>
:root{
  --ground:#eceef1; --sheet:#fff; --ink:#14171f; --ink-2:#565d6b; --line:#c6cbd3;
  --hl:#ffee8c; --hl-on:#ffd61f; --hl-line:#14171f;
  --bad:#c81e30; --bad-t:#fbe3e5; --close:#0b7a55;
  --bar:#14171f; --bar-close:#7fe0bb; --bar-bad:#ff8e99;
  --ui:"Schibsted Grotesk","Helvetica Neue",Arial,sans-serif;
  --text:"Literata",Georgia,serif;
  --mono:"Red Hat Mono",ui-monospace,Menlo,monospace;
  --gut:max(16px,env(safe-area-inset-left,0px)); --lh:29px; --mw:35rem;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#14171f; --sheet:#1d212b; --ink:#eceef1; --ink-2:#a6aebb; --line:#3a404d;
  --hl:#5a4f0e; --hl-on:#8a7912; --hl-line:#ffee8c;
  --bad:#ff7c88; --bad-t:#4a1c22; --close:#5ad6a6; --bar:#0b0d12; color-scheme:dark}}
:root[data-theme="dark"]{
  --ground:#14171f; --sheet:#1d212b; --ink:#eceef1; --ink-2:#a6aebb; --line:#3a404d;
  --hl:#5a4f0e; --hl-on:#8a7912; --hl-line:#ffee8c;
  --bad:#ff7c88; --bad-t:#4a1c22; --close:#5ad6a6; --bar:#0b0d12; color-scheme:dark}
@media (min-width:700px){:root{--gut:max(28px,env(safe-area-inset-left,0px))}}
*{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:var(--ink-2) transparent}
body{display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:100dvh;overflow:hidden;margin:0;background:var(--ground);color:var(--ink);font:400 15px/1.4 var(--ui);caret-color:var(--ink)}
::selection{background:var(--hl);color:var(--ink)}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
h1,h2,h3,p,ol,ul{margin:0;padding:0}
ol,ul{list-style:none}
[hidden]{display:none!important}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}

/* top bar */
.run{display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px;min-height:56px;padding:8px var(--gut);padding-top:calc(8px + env(safe-area-inset-top,0px));background:var(--bar);color:#fff}
.run :focus-visible{outline-color:#fff}
.brand{font:800 14px/1 var(--ui);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
h1{font:700 21px/1.1 var(--ui);text-wrap:balance;overflow-wrap:anywhere;min-width:0;padding-left:24px;border-left:1px solid rgba(255,255,255,.35)}
.tally{margin-left:auto;display:flex;flex-wrap:wrap;gap:4px 18px;font-weight:500;font-size:14px}
.tally li{display:flex;align-items:center;gap:7px}
.tally b{font:700 14px/1 var(--mono)}
.tally[hidden]~#new,.tally[hidden]~#new[hidden]~#theme{margin-left:auto}
/* live mode: the saved notes of this folder, in a dialog */
dialog{width:min(960px,calc(100vw - 32px));max-height:calc(100dvh - 32px);padding:0;border:1.5px solid var(--ink);background:var(--ground);color:var(--ink)}
dialog[open]{display:grid;grid-template-rows:auto minmax(0,1fr) auto}
dialog::backdrop{background:rgba(20,23,31,.55)}
dialog h2{margin:20px 20px 0}
dialog ol{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));align-content:start;overflow-y:auto;overscroll-behavior:contain}
dialog li{min-width:0}
dialog a{display:grid;gap:3px;padding:12px 20px;border-bottom:1px solid var(--line);color:inherit;text-decoration:none;transition:background-color .15s}
dialog a:hover,dialog a[aria-current]{background:var(--sheet)}
dialog a:focus-visible{outline-offset:-2px}
.first{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font:400 16px/1.5 var(--text)}
dialog a span+span{font-size:13px;color:var(--ink-2)}
dialog form{display:flex;justify-content:flex-end;padding:14px 20px}
.conn{flex-basis:100%;font-size:14px;color:var(--bar-bad)}

.btn{all:unset;box-sizing:border-box;cursor:pointer;padding:8px 14px;border:1.5px solid var(--ink);font:700 14px/1.2 var(--ui);color:var(--ink);white-space:nowrap;transition:background-color .15s,color .15s}
.btn:hover{background:var(--line)}
.btn:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.btn.fill{background:var(--ink);color:var(--ground)}
.btn.fill:hover{background:var(--ink-2);border-color:var(--ink-2)}
.btn:disabled,.btn:disabled:hover{background:transparent;border-color:var(--ink-2);color:var(--ink-2);cursor:default}
.run .btn{background:#fff;border-color:#fff;color:#14171f}
.run .btn:hover{background:#dfe2e7}
.run a.btn,.run #theme,.run #pick{background:transparent;color:#fff}
.run a.btn:hover,.run #theme:hover,.run #pick:hover{background:rgba(255,255,255,.16)}

/* the one ramp of marks, the same in the bar, the rail and the margin:
   filled = found word for word, double = the same in the history, dashed = close match, ring = missing or not stated */
.m{display:inline-block;flex:none;width:14px;height:14px;background:var(--ink)}
.m.his{background:none;border:4px double var(--ink)}
.m.close{background:none;border:2px dashed var(--close)}
.m.bad{background:none;border:2.5px solid var(--bad);border-radius:50%}
.run .m{background:#fff}
.run .m.close{background:none;border-color:var(--bar-close)}
.run .m.bad{background:none;border-color:var(--bar-bad)}

/* rail at left: what is left to do. The proof at right scrolls by itself */
main{min-height:0}
.shell{display:grid;grid-template-columns:316px minmax(0,1fr);height:100%}
.rail{min-height:0;overflow-y:auto;padding:22px 20px 22px var(--gut);border-right:1px solid var(--line)}
h2{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:10px;border-bottom:2px solid var(--ink);font:800 12.5px/1.3 var(--ui);letter-spacing:.1em;text-transform:uppercase}
h2 span,h2 b{font:500 12.5px/1.3 var(--ui);letter-spacing:0;text-transform:none;color:var(--ink-2)}
h2 b{font:700 12px/1.3 var(--mono);color:var(--ink)}
.rail *+h2,.rail *+div>h2{margin-top:30px}
.lead{padding-top:10px;font-size:14px;color:var(--ink-2)}
.empty{font-style:italic;color:var(--ink-2)}
.card{margin-inline:-12px;padding:14px 12px 16px;border-bottom:1px solid var(--line);transition:background-color .15s}
.card:hover,.card:focus-visible,.card:focus-within,.card.on{background:var(--sheet)}
.card:focus-visible{outline-offset:-2px}
h3{display:flex;align-items:start;gap:10px;font:700 16px/1.25 var(--ui)}
h3 .m{margin-top:3px}
/* an answered correction steps back: its answer in words, and one button to change it */
.card.done h3{font-weight:500}
.card.done .st{color:var(--ink)}
.card p{margin-top:5px;font-size:14px;color:var(--ink-2)}
.card .st{font-weight:700}
.card.bad .st{color:var(--bad)}
.card.close .st{color:var(--close)}
.k{margin-right:7px;font:800 11.5px/1 var(--ui);letter-spacing:.08em;text-transform:uppercase}
/* the extracted value and the note's own numbers are set alike, to compare digit by digit */
.n{font:700 15px/1.3 var(--mono);color:var(--ink)}
.n.x,.card.bad .cmp:first-of-type .n{color:var(--bad)}
q{quotes:"\201C" "\201D";font-family:var(--text);color:var(--ink)}
/* the two answers stand apart, so neither is pressed by accident */
.acts{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;margin-top:12px}
.key{display:grid;gap:9px;padding-top:12px;font-size:14px;color:var(--ink-2)}
.key li{display:grid;grid-template-columns:14px auto 1fr;align-items:baseline;gap:9px}
.key .m{align-self:start;margin-top:3px}
.key b{font:700 14px/1 var(--mono);color:var(--ink)}

/* the proof: one row per line of the note; each value sits in the margin beside its words */
.proof{display:grid;grid-template-rows:auto minmax(0,1fr);min-width:0;min-height:0;padding:22px var(--gut) 0 0}
.ph{margin-left:46px}
#note{display:grid;grid-template-columns:46px minmax(0,var(--mw)) minmax(240px,1fr);align-content:start;overflow-y:auto;padding-bottom:22px;--ry:19px}
.ln{padding:5px 12px 0 0;font:500 12px/var(--lh) var(--mono);color:var(--ink-2);text-align:right;user-select:none}
.l{min-height:calc(var(--lh) + 10px);padding:5px 22px;background:var(--sheet);font:400 17px/var(--lh) var(--text);white-space:pre-wrap;overflow-wrap:anywhere}
.mg{display:flex;flex-wrap:wrap;align-content:start;gap:0 4px;padding:5px 0 5px 10px}
.mg:not(:empty){background:linear-gradient(var(--line),var(--line)) 0 var(--ry)/100% 1px no-repeat}
#note>:nth-child(-n+3){padding-top:14px;--ry:28px}
#note>.l:nth-last-child(2){padding-bottom:14px}
mark{color:var(--ink);background:linear-gradient(var(--hl),var(--hl)) 0 0/100% 100% no-repeat;padding:2px 3px;border-bottom:2px solid var(--hl-line);-webkit-box-decoration-break:clone;box-decoration-break:clone;cursor:pointer}
mark.his{border-bottom:4px double var(--hl-line)}
mark.close{background:none;border-bottom:2px dashed var(--close)}
mark.bad{--hl:var(--bad-t);border-bottom:0;box-shadow:inset 0 0 0 2px var(--bad)}
mark.on{--hl:var(--hl-on);outline:2px solid var(--ink);outline-offset:1px}
.e{display:flex;flex-wrap:wrap;align-items:center;gap:0 5px;min-height:var(--lh);max-width:100%;padding:0 5px;background:var(--ground);font-size:12px;font-weight:500;color:var(--ink-2);cursor:default;transition:background-color .15s}
.e:hover,.e:focus-visible,.e.on{background:var(--hl);color:var(--ink)}
.e:focus-visible{outline-offset:-2px}
/* the figure is the largest thing in an entry */
.v{font:700 16px/var(--lh) var(--mono);color:var(--ink)}
.v.txt{font:700 14px/var(--lh) var(--ui)}
.e small{font-size:12px}
.e.bad,.e.bad .v{color:var(--bad)}
.e.close .why{color:var(--close)}
.e:hover.bad,.e.on.bad{background:var(--bad-t)}
@media (prefers-reduced-motion:no-preference){
  /* the highlighter is drawn across each quote once, when the note first appears */
  .fresh mark{animation:stroke .6s cubic-bezier(.16,1,.3,1) .1s both}
  @keyframes stroke{from{background-size:0 100%}}
}

/* live mode only (extract --serve): the intake form, the steps, the failed box */
.in .proof{grid-template-rows:auto minmax(160px,1fr) auto}
textarea{display:block;max-width:var(--mw);margin-left:46px;width:calc(100% - 46px);padding:14px 22px;border:1px solid var(--line);resize:none;background:var(--sheet);color:var(--ink);font:400 17px/var(--lh) var(--text)}
textarea:focus-visible{outline-offset:0}
textarea::placeholder{color:var(--ink-2);font-style:italic}
.send{display:grid;gap:16px;max-width:calc(var(--mw) + 46px);padding:18px 0 22px 46px}
.agree{display:flex;align-items:flex-start;gap:12px;color:var(--ink-2);cursor:pointer}
/* a square in a frame, like the marks */
.agree input{appearance:none;flex:none;width:18px;height:18px;margin:2px 0 0;border:1.5px solid var(--ink);background:var(--sheet);cursor:pointer;transition:background-color .15s}
.agree input:checked{background:var(--ink);box-shadow:inset 0 0 0 3px var(--sheet)}
.go{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-size:14px;color:var(--ink-2)}
.go .btn{padding:10px 20px}
/* the steps: done is a tick, now is the spinner, next is its number */
.step{display:grid;grid-template-columns:22px minmax(0,1fr);gap:2px 12px;padding:12px 0;border-bottom:1px solid var(--line)}
.step b{font:700 16px/1.25 var(--ui)}
.step p{grid-column:2;font-size:14px;color:var(--ink-2)}
.step.next b{color:var(--ink-2)}
.tr{display:grid;place-items:center;width:22px;height:22px;border:1.5px solid var(--ink-2);font:700 11px/1 var(--mono);color:var(--ink-2)}
.tr.ok{border-color:var(--ink);background:var(--ink)}
.tr svg{width:14px;height:14px;fill:none;stroke:var(--ground);stroke-width:2.2;stroke-linecap:square}
.tr.now{border:0}
/* waiting: a square whose filled quarter steps round; in a button it stands before the label */
.spin,.btn[aria-busy="true"]::before{content:"";display:inline-block;flex:none;width:16px;height:16px;border:2px solid var(--ink);background:conic-gradient(var(--ink) 25%,transparent 0)}
.btn[aria-busy="true"]::before{width:10px;height:10px;margin-right:8px;border:1.5px solid currentColor;vertical-align:-1px;background:conic-gradient(currentColor 25%,transparent 0)}
.busy .ph{position:relative}
.busy .ph::after{content:"";position:absolute;left:0;bottom:-2px;width:28%;height:2px;background:var(--hl-on)}
pre{margin:10px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;font:500 12.5px/1.5 var(--mono);color:var(--ink-2)}
.box{display:grid;justify-items:start;gap:14px;padding-top:4px}
@media (prefers-reduced-motion:no-preference){
  .spin,.btn[aria-busy="true"]::before{animation:turn 1s steps(4) infinite}
  @keyframes turn{to{transform:rotate(1turn)}}
  .busy .ph::after{animation:read 1.5s cubic-bezier(.65,0,.35,1) infinite alternate}
  @keyframes read{to{transform:translateX(257.2%)}}
}

footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 24px;padding:9px var(--gut) calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);font-size:13px;color:var(--ink-2)}
footer code{font:500 12px var(--mono)}

/* narrow screens: one column, the page scrolls, and each value drops under its line */
@media (max-width:900px){
  body{display:block;height:auto;overflow:visible}
  .shell{display:flex;flex-direction:column;height:auto}
  .rail{overflow:visible;padding:22px var(--gut);border-right:0}
  /* the note is pasted first; what happens next comes after it */
  .in .rail{order:1}
  .proof{padding:10px var(--gut) 22px}
  .ph,textarea{margin-left:0;width:100%}
  .send{padding-left:0}
  textarea{min-height:240px}
  #note{grid-template-columns:30px minmax(0,1fr);overflow:visible;padding-bottom:0}
  .ln{padding-right:8px}
  .l{padding-inline:14px}
  .mg,.mg:not(:empty){grid-column:2;padding:0 8px 8px;background:var(--sheet)}
  .mg:empty{display:none}
  #note>.mg:nth-child(3){padding-top:0}
  .e{background:var(--ground)}
  footer{padding-block:14px 28px}
}
@media (max-width:640px){
  .tally{margin-left:0;flex-basis:100%}
  .run{column-gap:14px}
  h1{padding-left:14px}
}
</style>

<header class="run">
  <span class="brand">Medical Protocol</span>
  <h1 id="t"></h1>
  <button class="btn" id="pick" type="button" hidden>Saved notes</button>
  <ul class="tally" id="tally" aria-label="Counts"></ul>
  <button class="btn" id="copy" type="button">Copy extraction JSON</button>
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
    <aside class="rail" id="rail" aria-label="To review"></aside>
    <section class="proof" aria-label="The note">
      <h2 class="ph">Note, as written<span id="len"></span></h2>
      <div class="fresh" id="note" tabindex="0"></div>
    </section>
  </div>
</main>

<footer>
    <span>Values copied from the note, each with the words it came from. Extraction only: no ranges, scores or interpretation. Checked with <code>medprotocol extract</code>.</span>
    <span id="when"></span>
</footer>

<script type="application/json" id="data">__DATA__</script>
<script>
(function () {
  var data = JSON.parse(document.getElementById("data").textContent);
  var CLOSE = { edited: 1, approximate: 1, reordered: 1 };
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

  function clear() {
    document.querySelectorAll(".on").forEach(function (e) { e.classList.remove("on"); });
  }
  function light(n, scroll) {
    clear();
    rows[n].forEach(function (r) { r.classList.add("on"); });
    marksOf[n].forEach(function (m) { m.classList.add("on"); });
    var m = marksOf[n][0];
    if (scroll && m) {
      // only where the note scrolls by itself; on a narrow screen the page is left where it is
      var a = m.getBoundingClientRect(), b = note.getBoundingClientRect();
      if (a.top < b.top || a.bottom > b.bottom - 40) note.scrollTo({ top: note.scrollTop + a.top - b.top - note.clientHeight / 3, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }
  // pointing at (or focusing) e lights item n in the note
  function point(e, n) {
    e.addEventListener("mouseenter", function () { light(n, true); });
    e.addEventListener("focusin", function () { light(n, true); });
    e.addEventListener("mouseleave", clear);
    e.addEventListener("focusout", clear);
  }
  note.addEventListener("mouseover", function (e) {
    var m = e.target.closest("mark");
    if (!m) return;
    clear();
    m.dataset.items.split(" ").forEach(function (n) {
      rows[n].forEach(function (r) { r.classList.add("on"); });
      marksOf[n].forEach(function (x) { x.classList.add("on"); });
    });
  });
  note.addEventListener("mouseleave", clear);
  note.addEventListener("click", function (e) {
    var m = e.target.closest("mark");
    var r = m && rows[m.dataset.items.split(" ")[0]];
    if (r && r.length) r[r.length - 1].scrollIntoView({ block: "nearest" });
  });

  // the margin entry of an item: its mark, field and value. The words it came from are lit on its line
  function entry(it, n) {
    var k = kind(it), li = el("li", "e " + k);
    li.tabIndex = 0;
    li.appendChild(mk(k));
    li.appendChild(el("span", "", it.field));
    // the quote is the value, word for word: it is already on the line
    var same = !it.unit && it.quote && it.quote.trim().toLowerCase() === String(it.value).trim().toLowerCase();
    if (!same) {
      // figures are set in mono; words are set as text
      li.appendChild(el("b", /^[-+<>]?\d[\d.,\/]*$/.test(it.value) ? "v" : "v txt", it.value));
      if (it.unit) li.appendChild(el("small", "", it.unit));
    }
    if (it.lab === true) li.appendChild(el("small", "", "lab"));
    // when it was taken: the one thing the check cannot verify, so it is always shown
    if (it.time) li.appendChild(el("small", "", it.time));
    if (k === "close" || k === "bad") li.appendChild(el("span", "why", k === "close" ? "close match" : "not stated"));
    if (it.ambiguous) li.appendChild(el("small", "", "first of several"));
    li.title = status(it); li.appendChild(el("span", "sr", status(it)));
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
    v.appendChild(el("span", "n", it.value));
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
    var meta = [it.episode === "history" ? "History" : "Current illness"];
    if (it.time) meta.push(it.time);
    if (it.ambiguous) meta.push("Appears more than once: first occurrence marked");
    li.appendChild(el("p", "", meta.join(" · ")));
    // on a narrow screen the note is further down the page
    li.addEventListener("click", function () { var m = marksOf[n][0]; if (m) m.scrollIntoView({ block: "nearest" }); });
    point(li, n); rows[n].push(li);
    return li;
  }

  // draws one extraction from scratch: the bar, the rail and the proof
  function render(data) {
    var segs = data.segments;
    items = data.items;
    text = segs.map(function (s) { return s.text; }).join("");
    note.textContent = ""; rail.textContent = ""; tally.textContent = "";

    title.textContent = data.name;
    document.getElementById("when").textContent = data.checkedAt ? "Checked " + data.checkedAt : "";
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

    // the note, only from its segments, one row per line: its number, its words, its margin.
    // Each mark knows its items; an item's entry goes in the margin of the line its quote starts on
    marksOf = items.map(function () { return []; });
    rows = items.map(function () { return []; });
    var no = 0, cur;
    function row() {
      var num = el("div", "ln", String(++no)); num.setAttribute("aria-hidden", "true");
      cur = { l: el("div", "l"), mg: el("ul", "mg") };
      note.appendChild(num); note.appendChild(cur.l); note.appendChild(cur.mg);
    }
    row();
    segs.forEach(function (s) {
      var ks = s.items.map(function (n) { return kind(items[n]); });
      var cls = ks.indexOf("bad") >= 0 ? "bad" : ks.indexOf("close") >= 0 ? "close" : ks[0];
      s.text.split("\n").forEach(function (part, i) {
        if (i) row();
        if (!part) return;
        if (!s.items.length) { cur.l.appendChild(document.createTextNode(part)); return; }
        var m = el("mark", cls, part);
        m.dataset.items = s.items.join(" ");
        s.items.forEach(function (n) {
          if (!marksOf[n].length) cur.mg.appendChild(entry(items[n], n));
          marksOf[n].push(m);
        });
        cur.l.appendChild(m);
      });
    });

    // a note that ends in a line break has no last line to number
    if (no > 1 && !cur.l.firstChild) { note.removeChild(cur.mg); note.removeChild(cur.l); note.removeChild(note.lastChild); no--; }
    len.textContent = no + (no === 1 ? " line" : " lines") + (items.length ? " · each value sits beside its line" : "");

    // the bar: what to distrust first
    [["bad", "missing or not stated"], ["close", count.close === 1 ? "close match" : "close matches"]].forEach(function (g) {
      if (!count[g[0]]) return;
      var li = el("li"); li.appendChild(mk(g[0])); li.appendChild(el("b", "", String(count[g[0]]))); li.appendChild(el("span", "", g[1])); tally.appendChild(li);
    });
    var f = el("li"); f.appendChild(mk("")); f.appendChild(el("b", "", found + "/" + items.length)); f.appendChild(el("span", "", "found word for word")); tally.appendChild(f);

    // the rail: every item that is not found word for word, in note order; one with no words in the note is only here
    if (!items.length) { rail.appendChild(el("p", "empty", "Nothing was extracted from this note.")); return; }
    rail.appendChild(head(flagged ? "Needs review" : "Nothing to review", flagged || null));
    rail.appendChild(el("p", "lead", flagged ? "The quote is missing, inexact, or doesn't state the value. Check each against the note." : "Every quote was found word for word in the note."));
    var ol = el("ol");
    items.forEach(function (it, n) { if (it.status !== "quoted") ol.appendChild(card(it, n)); });
    rail.appendChild(ol);
    // the counts by mark, which is also the legend
    rail.appendChild(head("In this note", items.length));
    var key = el("ul", "key");
    [["", "current illness, found word for word"], ["his", "history, found word for word"], ["close", "close match"], ["bad", "missing, or the quote doesn't state the value"]].forEach(function (g) {
      if (!count[g[0]]) return;
      var li = el("li"); li.appendChild(mk(g[0])); li.appendChild(el("b", "", String(count[g[0]]))); li.appendChild(el("span", "", g[1])); key.appendChild(li);
    });
    rail.appendChild(key);
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
  var when = document.getElementById("when");
  when.parentNode.insertBefore(el("span", "", "This page runs on this computer. The note is sent to the AI model only after you tick the box."), when);
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
    if (!tally.hidden) { corrections(s); return; }
    rail.textContent = ""; when.textContent = "";
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
      len.textContent = "The values appear beside their lines when both steps finish";
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
    var sec = el("div");
    sec.appendChild(head("Corrections", s.findings.length));
    sec.appendChild(el("p", "lead", "The second check re-read the note. Accept each change or keep the original."));
    var ol = el("ol");
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
    tally.hidden = copyBtn.hidden = true;
    document.getElementById("new").hidden = !id;
    title.textContent = "Note extraction"; when.textContent = "";
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
