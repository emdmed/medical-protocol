// The page `medprotocol extract --artifact <file>` writes: one extraction, the note on the left with
// each quote highlighted, the items on the right. Same paper, faces and peach spot as the website.
// It is a claude.ai Artifact page (the host adds doctype/head/body) and also opens as a local file.
// __TITLE__ and __DATA__ are filled by the CLI. Kept as String.raw with no backticks or `${`.

export const EXTRACT_ARTIFACT_HTML = String.raw`<title>__TITLE__</title>
<meta name="claude:viewport-fit-sides" content="cover">
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
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:400 17px/1.55 var(--text);font-variant-numeric:tabular-nums;caret-color:var(--spot)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--paper)}
::selection{background:var(--t2);color:var(--ink)}
:focus-visible{outline:2px solid var(--spot);outline-offset:3px}
h1,h2{margin:0;font-family:var(--head);text-wrap:balance}
p{margin:0}
.wrap{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
@media (min-width:700px){.wrap{padding-left:max(32px,env(safe-area-inset-left,0px));padding-right:max(32px,env(safe-area-inset-right,0px))}}

/* running head */
.run{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;min-height:var(--runh);padding-block:8px;flex-wrap:wrap;background:var(--paper);border-bottom:1px solid var(--ink);display:flex;align-items:center;gap:20px}
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

/* two panes */
.panes{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(20px,2.5vw,40px);align-items:start;padding-block:20px 32px}
.label{font:700 12px/1.2 var(--head);font-stretch:80%;letter-spacing:.14em;text-transform:uppercase;color:var(--spot-ink)}
.sheet{position:sticky;top:calc(var(--runh) + 16px + env(safe-area-inset-top,0px));display:grid;grid-template-rows:auto minmax(0,1fr);max-height:calc(100vh - var(--runh) - 32px);background:var(--sheet);border:1px solid var(--ink);box-shadow:0 1px 2px rgba(58,46,42,.06),0 14px 28px -14px var(--shadow);min-width:0}
.sheet-head{display:flex;justify-content:space-between;gap:16px;padding:11px 20px;border-bottom:1px solid var(--ink);background:var(--t1);font:500 12px/1.2 var(--mono);color:var(--ink-2)}
.note{margin:0;padding:16px 20px 20px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font:400 15.5px/1.7 var(--text);color:var(--ink)}
.key{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 20px 12px;border-top:1px solid var(--rule);font-size:13.5px;color:var(--ink-2)}
.key span{display:inline-flex;align-items:center;gap:6px}
.key mark{display:inline-block;width:22px;height:12px;padding:0}

/* highlights take their group's colour: current filled, history outlined, needs review dashed or, if the value is not in the quote, outlined in alarm */
.g-rev{--g:var(--rev);--gt:var(--rev-t);--gi:var(--rev-i)}
.g-cur{--g:var(--cur);--gt:var(--cur-t);--gi:var(--cur-i)}
.g-his{--g:var(--his);--gt:var(--his-t);--gi:var(--his-i)}
mark{color:inherit;background:var(--gt);padding:1px 0;border-radius:1px;-webkit-box-decoration-break:clone;box-decoration-break:clone;cursor:default;transition:background-color .2s,box-shadow .2s}
mark.g-his{box-shadow:inset 0 0 0 1.5px var(--g)}
mark.g-rev{border-bottom:2px dashed var(--gi)}
mark.bad{border-bottom:0;box-shadow:inset 0 0 0 1.5px var(--alarm)}
.note mark.on,.key mark.on{background:var(--g);color:#3a2e2a;border-bottom-color:transparent;box-shadow:inset 0 0 0 1.5px var(--ink)}
@media (prefers-reduced-motion:no-preference){
  .note mark{animation:swipe .7s cubic-bezier(.16,1,.3,1) .15s both}
  @keyframes swipe{from{background-color:transparent}}
}

/* the extraction list */
.list{display:grid;gap:18px;min-width:0}
.group{display:grid;gap:0}
.group h2{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:8px 14px 7px;background:var(--gt);border-bottom:2px solid var(--g);color:var(--gi);font:800 19px/1 var(--head);font-stretch:74%}
.group h2 span{font:600 13px/1 var(--mono);color:var(--gi)}
.group ol{margin:0;padding:0;list-style:none}
.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 16px;padding:8px 14px 9px;border-bottom:1px solid var(--rule);cursor:default;transition:background-color .2s}
.row:hover,.row:focus-visible,.row.on{background:var(--gt)}
.row:focus-visible{outline-offset:-2px}
.field{font:700 16.5px/1.25 var(--head);font-stretch:80%;color:var(--ink)}
.val{font:600 14px/1.3 var(--mono);color:var(--ink);text-align:right;overflow-wrap:anywhere}
.val small{font-weight:400;font-size:12.5px;color:var(--ink-2)}
.meta{grid-column:2;grid-row:2;justify-content:flex-end;display:flex;flex-wrap:wrap;gap:2px 12px;font:700 11px/1.6 var(--head);font-stretch:82%;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)}
.meta .st{color:var(--ink-2)}
.meta .st.warn{color:var(--alarm)}
.meta .st.close{color:var(--rev-i)}
.meta .ep{color:var(--gi)}
.meta .ep::before{content:"";display:inline-block;width:8px;height:8px;margin-right:6px;background:var(--g);vertical-align:0}
.quote{grid-column:1;grid-row:2;font-size:14.5px;line-height:1.45;color:var(--ink-2);font-style:italic;min-width:0}
.says{grid-column:1/-1;font-size:13.5px;line-height:1.45;color:var(--ink-2)}
.quote q{quotes:"\201C" "\201D"}
.says b{font:700 11.5px/1 var(--head);font-stretch:82%;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-right:6px}
.empty{padding:14px 0;font-style:italic;color:var(--ink-3)}

footer{border-top:1px solid var(--ink);padding-block:14px 28px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px;font-size:14px;color:var(--ink-3)}
footer code{font:500 12.5px var(--mono)}

@media (max-width:860px){
  .panes{grid-template-columns:1fr}
  .sheet{position:relative;top:auto;max-height:60vh}
}
@media (max-width:640px){
  .run{position:relative}
  .tally{margin-left:0;flex-basis:100%}
  .meta,.quote{grid-column:1/-1;grid-row:auto;justify-content:flex-start}
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
</header>

<main class="wrap">
  <div class="panes">
    <section class="sheet" aria-label="The note">
      <div class="sheet-head"><span>Note, as written</span><span id="len"></span></div>
      <pre class="note" id="note" tabindex="0"></pre>
      <div class="key" aria-hidden="true">
        <span><mark class="g-cur"></mark>Current illness</span>
        <span><mark class="g-his"></mark>History</span>
        <span><mark class="g-rev"></mark>Needs review</span>
        <span><mark class="g-rev bad"></mark>Value not in quote</span>
      </div>
    </section>
    <div class="list" id="list"></div>
  </div>

  <footer>
    <span>Values copied from the note, each with the words it came from. Extraction only: no ranges, scores or interpretation. Checked with <code>medprotocol extract</code>.</span>
    <span id="when"></span>
  </footer>
</main>

<script type="application/json" id="data">__DATA__</script>
<script>
(function () {
  var data = JSON.parse(document.getElementById("data").textContent);
  var items = data.items, segs = data.segments;
  var text = segs.map(function (s) { return s.text; }).join("");
  var CLOSE = { edited: 1, approximate: 1, reordered: 1 };
  var LABEL = {
    quoted: "Found in note",
    edited: "Close match: case or accents differ",
    reordered: "Close match: words in another order",
    mismatched: "Quote doesn't state this value",
    unverified: "Not found in note",
    none: "No quote"
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

  document.getElementById("t").textContent = data.name;
  document.getElementById("when").textContent = data.checkedAt ? "Checked " + data.checkedAt : "";
  var found = items.filter(function (i) { return i.status === "quoted"; }).length;
  document.getElementById("len").textContent = text.split("\n").length + " lines";

  var tally = document.getElementById("tally");

  // copies the items as extracted; status and offsets are computed, never stored
  var copyBtn = document.getElementById("copy");
  var json = JSON.stringify(items.map(function (i) {
    var o = {};
    ["field", "key", "value", "unit", "quote", "episode", "time"].forEach(function (k) { if (i[k] != null) o[k] = i[k]; });
    return o;
  }), null, 2);
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

  // the note, only from its segments; each mark knows the rows it belongs to
  var note = document.getElementById("note");
  var marksOf = items.map(function () { return []; });
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

  var rows = [];
  function row(it, n) {
    var li = el("li", "row g-" + group(it));
    li.tabIndex = 0;
    li.appendChild(el("span", "field", it.field));
    var v = el("span", "val", it.value);
    if (it.unit) { v.appendChild(document.createTextNode(" ")); v.appendChild(el("small", "", it.unit)); }
    li.appendChild(v);
    var meta = el("div", "meta");
    meta.appendChild(el("span", "ep g-" + (it.episode === "history" ? "his" : "cur"), it.episode === "history" ? "History" : "Current illness"));
    if (it.time) meta.appendChild(el("span", "", it.time));
    var st = el("span", "st " + (it.status === "quoted" ? "ok" : CLOSE[it.status] ? "close" : "warn"), status(it));
    meta.appendChild(st);
    if (it.ambiguous) meta.appendChild(el("span", "", "Appears more than once: first occurrence marked"));
    li.appendChild(meta);
    if (it.quote) { var q = el("p", "quote"); q.appendChild(el("q", "", it.quote)); li.appendChild(q); }
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

  var list = document.getElementById("list");
  var groups = [
    ["rev", "Needs review"], ["cur", "Current illness"], ["his", "History"]
  ];
  groups.forEach(function (g) {
    var idx = [];
    items.forEach(function (it, n) { if (group(it) === g[0]) idx.push(n); });
    var li = el("li", "g-" + g[0]); li.appendChild(el("b", "", String(idx.length))); li.appendChild(el("span", "", g[1])); tally.appendChild(li);
    if (g[0] === "his") { var f = el("li", "found"); f.appendChild(el("b", "", found + "/" + items.length)); f.appendChild(el("span", "", "found in note")); tally.appendChild(f); }
    if (!idx.length) return;
    var sec = el("section", "group g-" + g[0]);
    var h = el("h2", "", g[1]); h.appendChild(el("span", "", String(idx.length))); sec.appendChild(h);
    var ol = el("ol");
    idx.forEach(function (n) { ol.appendChild(row(items[n], n)); });
    sec.appendChild(ol);
    list.appendChild(sec);
  });
  if (!items.length) list.appendChild(el("p", "empty", "Nothing was extracted from this note."));
})();
</script>
`;
