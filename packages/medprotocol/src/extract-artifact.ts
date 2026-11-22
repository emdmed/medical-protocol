// The page `medprotocol extract --artifact <file>` writes: one extraction, the note on the left with
// each quote highlighted, the items on the right. Same paper, faces and peach spot as the website.
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..100,500..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Martian+Mono:wght@400;500;600&display=swap">
<style>
/* the note as a sheet on the desk at left, the extraction as a handbook list at right */
:root{
  --paper:#fdf6ee; --sheet:#fff; --ink:#3a2e2a; --ink-2:#5e4f48; --ink-3:#7f6d64; --rule:#e8d6c8;
  --spot:#f2a48f; --spot-ink:#a24f3c; --alarm:#c0432c;
  --t1:#fcebe3; --t2:#f8d5c8; --t3:#f2b8a6;
  --shadow:rgba(58,46,42,.28);
  --rev:#f2a48f; --rev-t:#fde4da; --rev-i:#a24f3c;
  --cur:#9fd3b4; --cur-t:#e2f3e8; --cur-i:#2f6b48;
  --his:#c2b4ec; --his-t:#ede8fa; --his-i:#5b479c;
  --head:"Archivo","Arial Narrow",sans-serif;
  --text:"Source Serif 4",Georgia,serif;
  --mono:"Martian Mono",ui-monospace,Menlo,monospace;
  --runh:52px;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:#2b221e; --sheet:#3a2e2a; --ink:#f5ebe3; --ink-2:#dfcdc1; --ink-3:#b9a69b; --rule:#54453e;
  --spot:#f2a48f; --spot-ink:#f2b8a6; --alarm:#f0846c;
  --t1:#3f322c; --t2:#6b4a3f; --t3:#8a5a4a; --shadow:rgba(0,0,0,.6);
  --rev:#f2a48f; --rev-t:#5a3a31; --rev-i:#f6c0b0;
  --cur:#8fc9a6; --cur-t:#2e4a3a; --cur-i:#b4e2c6;
  --his:#b3a4e6; --his-t:#3d3658; --his-i:#d3c9f5; color-scheme:dark}}
:root[data-theme="dark"]{
  --paper:#2b221e; --sheet:#3a2e2a; --ink:#f5ebe3; --ink-2:#dfcdc1; --ink-3:#b9a69b; --rule:#54453e;
  --spot:#f2a48f; --spot-ink:#f2b8a6; --alarm:#f0846c;
  --t1:#3f322c; --t2:#6b4a3f; --t3:#8a5a4a; --shadow:rgba(0,0,0,.6);
  --rev:#f2a48f; --rev-t:#5a3a31; --rev-i:#f6c0b0;
  --cur:#8fc9a6; --cur-t:#2e4a3a; --cur-i:#b4e2c6;
  --his:#b3a4e6; --his-t:#3d3658; --his-i:#d3c9f5; color-scheme:dark}
*{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:var(--ink-3) transparent}
body{display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:100dvh;overflow:hidden;margin:0;background:var(--paper);color:var(--ink);font:400 17px/1.55 var(--text);font-variant-numeric:tabular-nums;caret-color:var(--spot)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--paper)}
::selection{background:var(--t2);color:var(--ink)}
:focus-visible{outline:2px solid var(--spot);outline-offset:3px}
h1,h2{margin:0;font-family:var(--head);text-wrap:balance}
p{margin:0}
.wrap{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
@media (min-width:700px){.wrap{padding-left:max(32px,env(safe-area-inset-left,0px));padding-right:max(32px,env(safe-area-inset-right,0px))}}

/* running head */
.run{position:relative;margin-top:env(safe-area-inset-top,0px);min-height:var(--runh);padding-block:8px;flex-wrap:wrap;background:var(--paper);border-bottom:1px solid var(--ink);display:flex;align-items:center;gap:20px}
.brand{display:flex;align-items:center;gap:10px;font:700 14px/1 var(--head);font-stretch:80%;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
.brand svg{width:20px;height:20px;flex:none}
h1{font:800 22px/1 var(--head);font-stretch:70%;letter-spacing:-.005em;overflow-wrap:anywhere;min-width:0;padding-left:20px;border-left:1px solid var(--rule)}

.tally{margin:0 0 0 auto;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px}
.tally li{display:flex;align-items:baseline;gap:7px;padding:5px 10px 4px;background:var(--gt);border:1px solid var(--g);font:700 11.5px/1 var(--head);font-stretch:82%;letter-spacing:.09em;text-transform:uppercase;color:var(--gi)}
.tally b{font:600 13px/1 var(--mono);letter-spacing:0}
.tally .found{background:transparent;border-color:var(--rule);color:var(--ink-2)}
.copy{all:unset;cursor:pointer;padding:6px 12px 5px;border:1px solid var(--ink);font:700 11.5px/1 var(--head);font-stretch:82%;letter-spacing:.1em;text-transform:uppercase;color:var(--ink);white-space:nowrap;transition:background-color .2s,color .2s}
.copy:hover{background:var(--ink);color:var(--paper)}
.copy:focus-visible{outline:2px solid var(--spot);outline-offset:2px}

/* two panes: the page stays put, the note and the list each scroll */
main{min-height:0}
.panes{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);grid-template-rows:minmax(0,1fr);gap:clamp(20px,2.5vw,40px);height:100%;padding-block:20px}
.sheet{position:relative;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:var(--sheet);border:1px solid var(--ink);box-shadow:0 1px 2px rgba(58,46,42,.06),0 14px 28px -14px var(--shadow);min-width:0;min-height:0}
.sheet-head{display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:38px;padding:5px 20px;border-bottom:1px solid var(--ink);background:var(--t1);font:500 12px/1.2 var(--mono);color:var(--ink-2)}
.note{margin:0;padding:16px 20px 20px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font:400 15.5px/1.8 var(--text);color:var(--ink-2)}
.key{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 20px 12px;border-top:1px solid var(--ink);font-size:13.5px;color:var(--ink-2)}
.key span{display:inline-flex;align-items:center;gap:6px}
.key mark{display:inline-block;width:24px;height:14px;padding:0}

/* highlights say how far to trust them: a filled span with a solid rule is a quote found word for word (double rule for history),
   a dashed rule is a close match, an alarm frame with a wavy rule is a quote that is missing or does not state the value */
.g-rev{--g:var(--rev);--gt:var(--rev-t);--gi:var(--rev-i)}
.g-cur{--g:var(--cur);--gt:var(--cur-t);--gi:var(--cur-i)}
.g-his{--g:var(--his);--gt:var(--his-t);--gi:var(--his-i)}
mark{color:var(--ink);background:var(--gt);padding:1px 3px;border-bottom:2px solid var(--g);border-radius:2px;-webkit-box-decoration-break:clone;box-decoration-break:clone;cursor:pointer;transition:background-color .2s,box-shadow .2s}
mark.g-his{border-bottom:3px double var(--g)}
mark.g-rev{background:transparent;border-bottom:2px dashed var(--gi)}
mark.bad{border-bottom:0;box-shadow:inset 0 0 0 1.5px var(--alarm);text-decoration:underline wavy var(--alarm);text-underline-offset:3px}
.note mark.on{background:var(--g);color:#3a2e2a;border-bottom-color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink)}
@media (prefers-reduced-motion:no-preference){
  .note.fresh mark{animation:swipe .7s cubic-bezier(.16,1,.3,1) .15s both}
  @keyframes swipe{from{background-color:transparent}}
}

/* the extraction list: one framed block per group, its band stays in view while its rows scroll */
.list{display:grid;gap:24px;align-content:start;min-width:0;min-height:0;overflow-y:auto;padding-right:10px;scrollbar-gutter:stable}
.group{background:var(--sheet);border:1px solid var(--g)}
/* one line, the same height as the note's head */
.gh{position:sticky;top:0;z-index:1;display:flex;flex-wrap:wrap;align-items:center;gap:2px 14px;min-height:38px;padding:5px 14px;background:var(--g);color:#3a2e2a}
.gh h2{font:800 17px/1 var(--head);font-stretch:74%}
.gh b{order:1;margin-left:auto;font:600 13px/1 var(--mono)}
.gh p{font-size:13px;line-height:1.3}
.group ol{margin:0;padding:0;list-style:none}
.row{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:3px 12px;padding:10px 14px 11px;border-bottom:1px solid var(--rule);scroll-margin-top:46px;cursor:default;transition:background-color .2s}
.row:last-child{border-bottom:0}
.row:hover,.row:focus-visible,.row.on{background:var(--gt)}
.row:focus-visible{outline-offset:-2px}
/* trust mark: filled tick = found word for word, dashed = close match, alarm = missing or wrong */
.tr{grid-row:1/3;display:grid;place-items:center;width:22px;height:22px;margin-top:1px}
.tr svg{width:14px;height:14px;fill:none;stroke-width:2.2;stroke-linecap:square}
.tr.ok{background:var(--g);stroke:#3a2e2a}
.tr.close{border:1.5px dashed var(--gi);stroke:var(--gi)}
.tr.warn{background:var(--alarm);stroke:var(--paper)}
.field{font:700 16.5px/1.25 var(--head);font-stretch:80%;color:var(--ink)}
.val{font:600 14px/1.3 var(--mono);color:var(--ink);text-align:right;overflow-wrap:anywhere}
.val small{font-weight:400;font-size:12.5px;color:var(--ink-2)}
.row.warn .val,.row.warn .val small{color:var(--alarm)}
.meta{grid-column:3;grid-row:2;justify-content:flex-end;align-items:center;display:flex;flex-wrap:wrap;gap:2px 12px;font:700 11px/1.6 var(--head);font-stretch:82%;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)}
.meta .st{color:var(--ink-2)}
.meta .st.warn{padding:0 6px;background:var(--alarm);color:var(--paper)}
.meta .st.close{padding:0 5px;border:1px dashed var(--gi);color:var(--gi)}
.meta .ep{color:var(--ink-2)}
.quote{grid-column:2;grid-row:2;font-size:14.5px;line-height:1.45;color:var(--ink-2);font-style:italic;min-width:0}
.says{grid-column:2/-1;font-size:13.5px;line-height:1.45;color:var(--ink-2)}
.quote q,.says q{quotes:"\201C" "\201D"}
.says b{font:700 11.5px/1 var(--head);font-stretch:82%;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-right:6px}
/* lab results are listed apart inside their group */
.sub{display:flex;justify-content:space-between;align-items:baseline;margin:0;padding:7px 14px 6px;background:var(--gt);border-block:1px solid var(--g);font:700 11.5px/1 var(--head);font-stretch:82%;letter-spacing:.1em;text-transform:uppercase;color:var(--gi)}
.sub b{font:600 12px/1 var(--mono);letter-spacing:0}
.empty{padding:14px 0;font-style:italic;color:var(--ink-3)}
/* an item row. A verified one shows only its mark, field and value; the mark alone says it was found.
   The words it came from are lit in the note when the row is pointed at. A row with more to say (a quote
   that is not the value, a time) has a caret and folds that out under it */
.list{container-type:inline-size}
.item{grid-template-columns:22px minmax(0,1fr);gap:2px 12px}
.item>*{grid-column:2;grid-row:auto}
.item .tr{grid-column:1;grid-row:1/3}
.item .val{text-align:left}
.item .meta{justify-content:flex-start}
/* words are set as text; mono is kept for measurements */
.val.txt{font:600 15px/1.4 var(--text)}
/* the quote is the value, word for word: shown once */
.quote.same{font-style:normal;font-size:15.5px;color:var(--ink)}
.item.ok{grid-template-columns:22px minmax(0,1fr) minmax(0,1.3fr) 12px;align-items:baseline;align-content:start;padding-block:8px 9px}
.item.fold{cursor:pointer}
.item.ok>*{grid-row:1}
.item.ok>.tr{grid-row:1;align-self:start}
.item.ok>.val,.item.ok>.quote{grid-column:3}
.item.ok>.caret{grid-column:4;align-self:center;display:grid}
.caret svg{width:12px;height:12px;fill:none;stroke:var(--ink-3);stroke-width:1.8;stroke-linecap:square;transition:transform .2s cubic-bezier(.16,1,.3,1)}
.open .caret svg{transform:rotate(.5turn)}
.more{display:none}
.item.open>.more{display:block;grid-column:2/-1;grid-row:2;padding-top:3px}
@container (min-width:640px){
  /* a row to review stays open: value and quote side by side, then its status, then the note's words */
  .item:not(.ok){grid-template-columns:22px minmax(0,1fr) minmax(0,1fr) minmax(0,1.6fr);gap:4px 14px;align-items:baseline}
  .item:not(.ok)>*{grid-row:1}
  .item:not(.ok)>.tr{align-self:start}
  .item:not(.ok)>.val{grid-column:3}
  .item:not(.ok)>.quote{grid-column:4}
  .item:not(.ok)>.quote.same{grid-column:3/5}
  .item:not(.ok)>.meta{grid-column:2/-1;grid-row:2}
  .item:not(.ok)>.says{grid-column:2/-1;grid-row:3}
}
@container (min-width:860px){
  /* verified rows are short: two across, read left to right */
  .ok-rows{display:grid;grid-template-columns:1fr 1fr}
  .ok-rows .item:nth-child(odd){border-right:1px solid var(--rule)}
  .ok-rows .item:nth-last-child(2):nth-child(odd){border-bottom:0}
}

/* live mode only (extract --serve): the intake form, the working and failed boxes */
[hidden]{display:none!important}
.conn{flex-basis:100%;font-size:14px;color:var(--alarm)}
/* the intake form sits in the same two panes: the sheet the note is pasted on stays where the note will be read */
.side{display:grid;gap:20px;align-content:start;min-width:0;min-height:0;overflow-y:auto;padding-right:10px;scrollbar-gutter:stable}
.side>*{max-width:600px}
textarea.note{display:block;width:100%;min-height:240px;border:0;resize:none;background:transparent;color:var(--ink)}
textarea.note::placeholder{color:var(--ink-3);font-style:italic}
/* the ring goes round the sheet, not inside it */
textarea.note:focus-visible{outline:0}
.sheet:has(textarea:focus-visible){outline:2px solid var(--spot);outline-offset:3px}
.agree{display:flex;align-items:flex-start;gap:12px;font-size:15.5px;line-height:1.45;color:var(--ink-2);cursor:pointer}
/* a square in a frame, like the trust marks */
.agree input{appearance:none;flex:none;width:18px;height:18px;margin:3px 0 0;border:1.5px solid var(--ink);background:var(--sheet);cursor:pointer;transition:background-color .15s}
.agree input:checked{background:var(--ink);box-shadow:inset 0 0 0 3px var(--sheet)}
.go{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-size:14.5px;color:var(--ink-2)}
/* the one filled button of a view */
.copy.main{padding:9px 18px 8px;background:var(--ink);color:var(--paper);font-size:13px}
.copy.main:hover{background:var(--spot-ink);border-color:var(--spot-ink)}
/* waiting: a square whose filled quarter steps round; in a button it stands before the label */
.spin,.copy[aria-busy="true"]::before{content:"";display:inline-block;flex:none;width:16px;height:16px;border:2px solid var(--ink);background:conic-gradient(var(--spot-ink) 25%,transparent 0)}
.copy[aria-busy="true"]::before{width:10px;height:10px;margin-right:8px;border:1.5px solid currentColor;vertical-align:-1px;background:conic-gradient(currentColor 25%,transparent 0)}
.busy .sheet-head{position:relative}
.busy .sheet-head::after{content:"";position:absolute;left:0;bottom:-2px;width:28%;height:3px;background:var(--spot-ink)}
/* no values on the page yet, so no legend */
.bare .key{display:none}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
/* the steps: done is a tick, now is the spinner, next is its number */
.tr.num{border:1.5px solid var(--ink-3);font:600 11px/1 var(--mono);color:var(--ink-2)}
.g-fix .tr.ok{background:var(--cur)}
.step.next .field{color:var(--ink-3)}
.step:not([aria-current]):hover,.ghost .row:hover{background:transparent}
/* where the values will be */
.ghost{--g:var(--rule)}
.ghost .gh{background:var(--t1);color:var(--ink-2)}
.ghost .tr{border:1.5px solid var(--rule)}
.sk{height:11px;margin-block:5px;background:var(--t2)}
.sk.a{width:38%}
.sk.b{width:64px;justify-self:end}
.sk.c{grid-column:2;width:72%;background:var(--t1)}
.ghost li:nth-child(2) .a{width:54%}
.ghost li:nth-child(2) .c{width:46%}
.ghost li:nth-child(3) .a{width:30%}
.ghost li:nth-child(4) .c{width:60%}
@media (prefers-reduced-motion:no-preference){
  .spin,.copy[aria-busy="true"]::before{animation:turn 1s steps(4) infinite}
  @keyframes turn{to{transform:rotate(1turn)}}
  .busy .sheet-head::after{animation:read 1.5s cubic-bezier(.65,0,.35,1) infinite alternate}
  @keyframes read{to{transform:translateX(257.2%)}}
  .ghost li{animation:wait 1.2s ease-in-out infinite alternate}
  .ghost li:nth-child(2){animation-delay:.15s}
  .ghost li:nth-child(3){animation-delay:.3s}
  .ghost li:nth-child(4){animation-delay:.45s}
  @keyframes wait{to{opacity:.4}}
}
.copy:disabled,.copy:disabled:hover{background:transparent;border-color:var(--ink-3);color:var(--ink-3);cursor:default}
.row[aria-current]{background:var(--gt)}
.box{display:grid;justify-items:start;gap:14px;padding:14px}
pre.says{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:400 12.5px/1.5 var(--mono)}
/* the corrections block: what the second check would change, with the doctor's answer on each */
.g-fix{--g:var(--ink);--gt:var(--t1);--gi:var(--ink-2)}
.g-fix .gh{color:var(--paper)}
.fix{grid-template-columns:minmax(0,1fr)}
.fix>*{grid-column:1}
.fix .go{margin-top:4px}
.copy[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.tally[hidden]~#new{margin-left:auto}

footer{border-top:1px solid var(--ink);padding-block:8px 10px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 24px;font-size:13px;line-height:1.4;color:var(--ink-3)}
footer code{font:500 12px var(--mono)}

/* narrow screens: one column, and the page scrolls again */
@media (max-width:860px){
  body{display:block;height:auto;overflow:visible}
  .panes{grid-template-columns:1fr;grid-template-rows:none;height:auto}
  .sheet{max-height:60vh}
  .list,.side{overflow:visible;padding-right:0}
  /* working or failed: what is going on comes before the note */
  .bare .list{order:-1}
  footer{padding-block:14px 28px}
}
@media (max-width:640px){
  .tally{margin-left:0;flex-basis:100%}
}
@media (max-width:480px){
  h1{padding-left:0;border-left:0;flex-basis:100%}
  .sheet-head,.key{padding-inline:14px}
  .note{padding:16px 14px 20px;font-size:16px}
}
</style>

<header class="run wrap">
  <span class="brand"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8.5 6 L2.5 16 L8.5 26 M23.5 6 L29.5 16 L23.5 26" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="square"/><rect x="9.5" y="13.75" width="13" height="4.5" fill="#e8907a"/><rect x="13.75" y="9.5" width="4.5" height="13" fill="#e8907a"/></svg>Medical Protocol</span>
  <h1 id="t"></h1>
  <ul class="tally" id="tally" aria-label="Counts"></ul>
  <button class="copy" id="copy" type="button">Copy extraction JSON</button>
  <a class="copy" id="new" href="#" hidden>New note</a>
  <p class="conn" id="conn" role="alert" hidden>Lost the connection to the local server. Start it again with medprotocol extract --serve.</p>
</header>

<main class="wrap">
  <form class="panes" id="intake" hidden>
    <div class="sheet">
      <div class="sheet-head"><label for="paste">Paste the note here</label><span id="plen"></span></div>
      <textarea class="note" id="paste" required placeholder="A made-up or de-identified note. Nothing is sent until you press Extract."></textarea>
    </div>
    <div class="side">
      <section class="group g-fix" id="plan">
        <header class="gh"><h2>What happens next</h2><p>It usually takes a minute or two.</p></header>
      </section>
      <label class="agree"><input type="checkbox" id="agree" required><span>This note is sent to the AI model, which runs on external servers. I confirm it is made up or de-identified: no names, record numbers, addresses or dates.</span></label>
      <p class="go"><button class="copy main" id="go" type="submit" aria-describedby="why" disabled>Extract</button><span id="why"></span></p>
    </div>
  </form>
  <div class="panes" id="panes">
    <section class="sheet" aria-label="The note">
      <div class="sheet-head"><span>Note, as written</span><span id="len"></span></div>
      <pre class="note fresh" id="note" tabindex="0"></pre>
      <div class="key" aria-hidden="true">
        <span><mark class="g-cur"></mark>Found word for word</span>
        <span><mark class="g-his"></mark>Found, history</span>
        <span><mark class="g-rev"></mark>Close match</span>
        <span><mark class="g-rev bad"></mark>Quote doesn't state the value</span>
      </div>
    </section>
    <div class="list" id="list"></div>
  </div>
</main>

<footer class="wrap">
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
  var ICON = {
    ok: '<svg viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5"/></svg>',
    close: '<svg viewBox="0 0 16 16"><path d="M3 6.5q2.5-3 5 0t5 0M3 11.5q2.5-3 5 0t5 0"/></svg>',
    warn: '<svg viewBox="0 0 16 16"><path d="M8 2.5V9M8 12.5v1"/></svg>'
  };
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function group(it) { return it.status !== "quoted" ? "rev" : it.episode === "history" ? "his" : "cur"; }
  function status(it) {
    if (it.status === "approximate") return "Close match: " + it.distance + (it.distance === 1 ? " character" : " characters") + " off";
    return LABEL[it.status] || it.status;
  }

  var title = document.getElementById("t");
  var tally = document.getElementById("tally");
  var copyBtn = document.getElementById("copy");
  var note = document.getElementById("note");
  var list = document.getElementById("list");
  // what the last render drew; the listeners below work on these
  var items = [], text = "", json = "[]", marksOf = [], rows = [];

  function copied(ok) {
    copyBtn.textContent = ok ? "Copied" : "Copy failed";
    setTimeout(function () { copyBtn.textContent = "Copy extraction JSON"; }, 1800);
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

  function row(it, n) {
    var tr = it.status === "quoted" ? "ok" : CLOSE[it.status] ? "close" : "warn";
    var li = el("li", "row item g-" + group(it) + " " + tr);
    li.tabIndex = 0;
    var ic = el("span", "tr " + tr); ic.setAttribute("aria-hidden", "true"); ic.innerHTML = ICON[tr]; li.appendChild(ic);
    li.appendChild(el("span", "field", it.field));
    var same = !it.unit && it.quote && it.quote.trim().toLowerCase() === String(it.value).trim().toLowerCase();
    var v = el("span", /\d/.test(it.value) ? "val" : "val txt", it.value);
    if (it.unit) { v.appendChild(document.createTextNode(" ")); v.appendChild(el("small", "", it.unit)); }
    if (!same) li.appendChild(v);
    var ok = tr === "ok", more = ok ? el("div", "more") : li;
    var meta = el("div", "meta");
    // verified rows sit under their episode's band; only the review group mixes episodes
    if (!ok) meta.appendChild(el("span", "ep", it.episode === "history" ? "History" : "Current illness"));
    if (it.time) meta.appendChild(el("span", "", it.time));
    if (!ok) meta.appendChild(el("span", "st " + tr, status(it)));
    if (it.ambiguous) meta.appendChild(el("span", "", "Appears more than once: first occurrence marked"));
    var q = it.quote && el("p", same ? "quote same" : "quote");
    if (q) q.appendChild(el("q", "", it.quote));
    if (ok) {
      // the mark is the status: named on hover and to a screen reader
      ic.title = status(it); li.appendChild(el("span", "sr", status(it)));
      if (q) (same ? li : more).appendChild(q);
      if (meta.firstChild) more.appendChild(meta);
      // nothing more to say: no caret, nothing to open
      if (more.firstChild) {
        var c = el("span", "caret"); c.setAttribute("aria-hidden", "true"); c.innerHTML = '<svg viewBox="0 0 12 12"><path d="M2 4.5 6 8.5 10 4.5"/></svg>';
        li.appendChild(c); li.appendChild(more); li.classList.add("fold");
        var flip = function () { li.classList.toggle("open"); };
        li.addEventListener("click", flip);
        li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
      }
    } else {
      li.appendChild(meta);
      if (q) li.appendChild(q);
    }
    if (CLOSE[it.status] && it.start != null) {
      var s = el("p", "says"); s.appendChild(el("b", "", "Note says")); s.appendChild(document.createTextNode(text.slice(it.start, it.end))); li.appendChild(s);
    }
    li.addEventListener("mouseenter", function () { light(n, true); });
    li.addEventListener("focus", function () { light(n, true); });
    li.addEventListener("mouseleave", clear);
    li.addEventListener("blur", clear);
    rows[n] = li;
    return li;
  }
  function clear() {
    document.querySelectorAll(".on").forEach(function (e) { e.classList.remove("on"); });
  }
  function light(n, scroll) {
    clear();
    rows[n] && rows[n].classList.add("on");
    marksOf[n].forEach(function (m) { m.classList.add("on"); });
    var m = marksOf[n][0];
    if (scroll && m) {
      var top = m.offsetTop - note.offsetTop;
      if (top < note.scrollTop || top > note.scrollTop + note.clientHeight - 40) note.scrollTo({ top: top - note.clientHeight / 3, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }
  note.addEventListener("mouseover", function (e) {
    var m = e.target.closest("mark");
    if (!m) return;
    clear();
    m.dataset.items.split(" ").forEach(function (n) {
      rows[n] && rows[n].classList.add("on");
      marksOf[n].forEach(function (x) { x.classList.add("on"); });
    });
  });
  note.addEventListener("mouseleave", clear);
  note.addEventListener("click", function (e) {
    var m = e.target.closest("mark");
    var r = m && rows[m.dataset.items.split(" ")[0]];
    if (r) r.scrollIntoView({ block: "nearest" });
  });

  var groups = [
    ["rev", "Needs review", "The quote is missing, inexact, or doesn't state the value. Check each against the note."],
    ["cur", "Current illness", "Each quote was found word for word in the note."],
    ["his", "History", "Each quote was found word for word in the note."]
  ];

  // draws one extraction from scratch: the head, the note and the list
  function render(data) {
    var segs = data.segments;
    items = data.items;
    text = segs.map(function (s) { return s.text; }).join("");
    note.textContent = ""; list.textContent = ""; tally.textContent = "";

    title.textContent = data.name;
    document.getElementById("when").textContent = data.checkedAt ? "Checked " + data.checkedAt : "";
    var found = items.filter(function (i) { return i.status === "quoted"; }).length;
    var lines = text.split("\n").length;
    document.getElementById("len").textContent = lines + (lines === 1 ? " line" : " lines");

    // copies the items as extracted; status and offsets are computed, never stored
    json = JSON.stringify(items.map(function (i) {
      var o = {};
      ["field", "key", "value", "unit", "quote", "episode", "lab", "time"].forEach(function (k) { if (i[k] != null) o[k] = i[k]; });
      return o;
    }), null, 2);

    // the note, only from its segments; each mark knows the rows it belongs to
    marksOf = items.map(function () { return []; });
    segs.forEach(function (s) {
      if (!s.items.length) { note.appendChild(document.createTextNode(s.text)); return; }
      var its = s.items.map(function (n) { return items[n]; });
      var cls = "g-" + group(its[0]);
      if (its.some(function (i) { return i.status === "mismatched"; })) cls = "g-rev bad";
      else if (its.some(function (i) { return i.status !== "quoted"; })) cls = "g-rev";
      var m = el("mark", cls, s.text);
      m.dataset.items = s.items.join(" ");
      s.items.forEach(function (n) { marksOf[n].push(m); });
      note.appendChild(m);
    });

    rows = [];
    groups.forEach(function (g) {
      var idx = [];
      items.forEach(function (it, n) { if (group(it) === g[0]) idx.push(n); });
      var li = el("li", "g-" + g[0]); li.appendChild(el("b", "", String(idx.length))); li.appendChild(el("span", "", g[1])); tally.appendChild(li);
      if (g[0] === "his") { var f = el("li", "found"); f.appendChild(el("b", "", found + "/" + items.length)); f.appendChild(el("span", "", "found in note")); tally.appendChild(f); }
      if (!idx.length) return;
      var sec = el("section", "group g-" + g[0]);
      var h = el("header", "gh"); h.appendChild(el("h2", "", g[1])); h.appendChild(el("b", "", String(idx.length))); h.appendChild(el("p", "", g[2])); sec.appendChild(h);
      // verified groups list lab results apart, after the rest; the review group stays in note order
      var labs = g[0] === "rev" ? [] : idx.filter(function (n) { return items[n].lab === true; });
      [idx.filter(function (n) { return labs.indexOf(n) < 0; }), labs].forEach(function (part, lab) {
        if (!part.length) return;
        if (lab) { var sh = el("h3", "sub", "Labs"); sh.appendChild(el("b", "", String(part.length))); sec.appendChild(sh); }
        var ol = el("ol", g[0] === "rev" ? "" : "ok-rows");
        part.forEach(function (n) { ol.appendChild(row(items[n], n)); });
        sec.appendChild(ol);
      });
      list.appendChild(sec);
    });
    if (!items.length) list.appendChild(el("p", "empty", "Nothing was extracted from this note."));
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
      var li = el("li", "row step" + (at >= 0 && n > at ? " next" : ""));
      var ic = el("span", done ? "tr ok" : now ? "tr" : "tr num", done || now ? null : String(n + 1));
      ic.setAttribute("aria-hidden", "true");
      if (done) ic.innerHTML = ICON.ok;
      if (now) { ic.appendChild(el("span", "spin")); li.setAttribute("aria-current", "step"); }
      li.appendChild(ic); li.appendChild(el("span", "field", s[0])); li.appendChild(el("p", "says", s[1]));
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

  // the shape of the list to come
  function ghost() {
    var sec = el("section", "group ghost"), h = el("header", "gh"), ol = el("ol");
    h.appendChild(el("h2", "", "Values from the note")); h.appendChild(el("p", "", "They appear here when both steps finish."));
    ol.setAttribute("aria-hidden", "true");
    for (var n = 0; n < 4; n++) {
      var li = el("li", "row");
      ["tr", "sk a", "sk b", "sk c"].forEach(function (c) { li.appendChild(el("span", c)); });
      ol.appendChild(li);
    }
    sec.appendChild(h); sec.appendChild(ol);
    return sec;
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
    panes.classList.toggle("bare", tally.hidden);
    if (!tally.hidden) { corrections(s); return; }
    list.textContent = ""; when.textContent = "";
    var sec = el("section", "group g-" + (busy ? "fix" : "rev")), h = el("header", "gh"), box = el("div", "box");
    sec.appendChild(h);
    if (busy) {
      var at = s.state === "verifying" ? 1 : 0, clock = el("b"), from = started(s.id);
      var show = function () {
        var t = Math.max(0, Math.floor((Date.now() - from) / 1000));
        clock.textContent = Math.floor(t / 60) + ":" + ("0" + t % 60).slice(-2);
      };
      h.appendChild(el("h2", "", "Working on your note")); h.appendChild(clock);
      h.appendChild(el("p", "", "It usually takes a minute or two. This page updates by itself."));
      show(); tick = setInterval(show, 1000);
      sec.appendChild(stepList(at));
      statusLine.textContent = at ? "Step 2 of 3: the second check is re-reading the note." : "Step 1 of 3: pulling out the values.";
      sec.appendChild(statusLine);
      list.appendChild(sec); list.appendChild(ghost());
      return;
    } else {
      try { sessionStorage.removeItem("t" + s.id); } catch (e) {}
      h.appendChild(el("h2", "", "The extraction did not finish"));
      h.appendChild(el("p", "", "Your note is still here. Run it again, or start a new note."));
      statusLine.textContent = "The extraction did not finish.";
      box.appendChild(statusLine);
      if (s.error && s.error.indexOf("'claude' command was not found") >= 0) box.appendChild(el("p", "says", "This page needs the Claude Code command line tool. You can also run the extraction from the chat with /medical-protocol:extract."));
      else if (s.error) box.appendChild(el("pre", "says", s.error));
      var again = el("button", "copy main", "Try again"); again.type = "button";
      // the doctor already confirmed this note
      again.addEventListener("click", function () {
        again.disabled = true; again.setAttribute("aria-busy", "true");
        // drawn again even when the run fails the same way, so the button comes back
        last = null;
        send(s.note).then(load, function () { again.disabled = false; again.removeAttribute("aria-busy"); conn.hidden = false; });
      });
      box.appendChild(again);
    }
    sec.appendChild(box);
    list.appendChild(sec);
  }

  // one line of a finding: the label, then the item and its quote
  function says(label, it) {
    var p = el("p", "says");
    p.appendChild(el("b", "", label));
    if (!it) return p;
    p.appendChild(document.createTextNode(it.field + ": " + it.value + (it.unit ? " " + it.unit : "") + " "));
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
          // the redraw empties both panes: keep where the doctor was reading and the pressed button
          var a = list.scrollTop, b = note.scrollTop;
          // the highlights are already on the page: don't swipe them in again
          note.classList.remove("fresh");
          last = body; draw(JSON.parse(body));
          list.scrollTop = a; note.scrollTop = b;
          var btn = list.querySelector('[data-f="' + n + '"][data-d="' + decision + '"]');
          if (btn) btn.focus();
        });
      }, function () { wait(false); conn.hidden = false; });
  }

  // review and done: the findings of the second check above the groups, each with its two answers
  function corrections(s) {
    if (!s.findings.length) return;
    var open = s.findings.filter(function (f) { return (f.correction || f.index != null) && !f.decision; }).length;
    if (open) { var t = el("li", "found"); t.appendChild(el("b", "", String(open))); t.appendChild(el("span", "", "to decide")); tally.appendChild(t); }
    var sec = el("section", "group g-fix");
    var h = el("header", "gh"); h.appendChild(el("h2", "", "Corrections")); h.appendChild(el("b", "", String(s.findings.length)));
    h.appendChild(el("p", "", "The second check re-read the note. Accept each change or keep the original.")); sec.appendChild(h);
    var ol = el("ol");
    s.findings.forEach(function (f, n) {
      var li = el("li", "row fix");
      li.appendChild(el("p", "field", f.problem));
      ol.appendChild(li);
      // a remark changes no item: a plain line
      if (!f.correction && f.index == null) return;
      var add = f.index == null;
      if (f.before) li.appendChild(says("Was", f.before));
      li.appendChild(add ? says("Add this item", f.correction) : f.correction ? says("Now", f.correction) : says("Remove this item"));
      var go = el("div", "go"); go.setAttribute("role", "group"); go.setAttribute("aria-label", "Your answer");
      [["accepted", add ? "Add" : "Accept"], ["rejected", add ? "Don't add" : "Keep the original"]].forEach(function (d) {
        var b = el("button", "copy", d[1]); b.type = "button";
        b.dataset.f = n; b.dataset.d = d[0];
        b.setAttribute("aria-pressed", String(f.decision === d[0]));
        b.addEventListener("click", function () { if (f.decision !== d[0]) decide(s, n, d[0], b); });
        go.appendChild(b);
      });
      li.appendChild(go);
      // the item this finding leaves on the page, found by its content; a removed item has no quote to light
      var shown = f.decision === "rejected" ? f.before : f.correction, at = -1;
      if (shown) items.some(function (it, i) { return it.field === shown.field && it.value === shown.value && it.quote === shown.quote && (at = i, true); });
      if (at < 0) return;
      li.addEventListener("mouseenter", function () { light(at, true); });
      li.addEventListener("focusin", function () { light(at, true); });
      li.addEventListener("mouseleave", clear);
      li.addEventListener("focusout", clear);
    });
    sec.appendChild(ol);
    list.insertBefore(sec, list.firstChild);
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
    panes.classList.toggle("busy", !!id); panes.classList.add("bare");
    if (id) { note.classList.add("fresh"); note.textContent = ""; list.textContent = ""; load(); }
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
