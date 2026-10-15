(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast } = PT;
  const S = data.settings, G = data.dots;
  const NS = "http://www.w3.org/2000/svg";

  /* Each picture is a closed outline on a 0 to 100 grid: the dots in the order they are joined. */
  const PICTURES = {
    easy:[
      { name:"kite", a:"a", emoji:"🪁", c:"#FFC9A3", pts:[[50,10],[80,45],[50,90],[20,45]] },
      { name:"house", a:"a", emoji:"🏠", c:"#FFE27A", pts:[[50,12],[88,46],[88,88],[12,88],[12,46]] },
      { name:"gem", a:"a", emoji:"💎", c:"#A8E4F2", pts:[[28,14],[72,14],[92,40],[50,90],[8,40]] }
    ],
    medium:[
      { name:"crown", a:"a", emoji:"👑", c:"#FFE27A", pts:[[10,82],[10,30],[30,54],[50,14],[70,54],[90,30],[90,82]] },
      { name:"heart", a:"a", emoji:"❤️", c:"#FFB8C6", pts:[[50,30],[70,12],[92,28],[88,56],[50,90],[12,56],[8,28],[30,12]] },
      { name:"cat", a:"a", emoji:"🐱", c:"#FFDDB8", pts:[[12,12],[36,30],[64,30],[88,12],[92,56],[76,86],[50,92],[24,86],[8,56]] },
      { name:"star", a:"a", emoji:"⭐", c:"#FFF0A8", pts:[[50,6],[62,36],[94,38],[69,58],[78,90],[50,72],[22,90],[31,58],[6,38],[38,36]] }
    ],
    hard:[
      { name:"tree", a:"a", emoji:"🌳", c:"#C6E59B", pts:[[50,6],[78,38],[64,38],[88,66],[58,66],[58,92],[42,92],[42,66],[12,66],[36,38],[22,38]] },
      { name:"castle", a:"a", emoji:"🏰", c:"#D9C6EF", pts:[[10,90],[10,30],[24,30],[24,46],[38,46],[38,30],[62,30],[62,46],[76,46],[76,30],[90,30],[90,90]] },
      { name:"fish", a:"a", emoji:"🐟", c:"#9FD3FF", pts:[[92,50],[70,26],[45,22],[26,38],[8,22],[16,50],[8,78],[26,62],[45,78],[70,74]] }
    ]
  };

  const svg = $("#dots");
  let pic, dots = [], next = 0, done = false, run = 0, last = "", linesEl, fillEl, revealEl;

  const el = (name, attrs, parent = svg) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  };
  const pts = list => list.map(p => p.join(",")).join(" ");

  function updateStats(){
    $("#joined").textContent = `${next} / ${pic.pts.length}`;
    $("#wins").textContent = G.wins;
  }

  function markNext(){
    dots.forEach((d, i) => {
      d.classList.toggle("done", i < next);
      d.classList.toggle("next", i === next);
    });
    $("#hint").textContent = next === 0 ? "Tap number 1 to start!" : `Now tap number ${next + 1}.`;
  }

  function newGame(){
    run++; speech.cancel(); Sfx.stop();
    const pool = PICTURES[G.level].filter(p => p.name !== last);
    pic = shuffle(pool.slice())[0]; last = pic.name;
    next = 0; done = false;
    svg.innerHTML = "";
    fillEl = el("polygon", { class:"fill", points:pts(pic.pts) });
    fillEl.style.setProperty("--c", pic.c);
    linesEl = el("polyline", { class:"line", points:"" });
    const cx = pic.pts.reduce((s, p) => s + p[0], 0) / pic.pts.length;
    const cy = pic.pts.reduce((s, p) => s + p[1], 0) / pic.pts.length;
    revealEl = el("text", { class:"reveal", x:cx, y:cy });
    revealEl.textContent = pic.emoji;
    dots = pic.pts.map(([x, y], i) => {
      const g = el("g", { class:"dot", tabindex:0, role:"button", "aria-label":`Dot ${i + 1}` });
      el("circle", { class:"hit", cx:x, cy:y, r:9 }, g);
      el("circle", { class:"ring", cx:x, cy:y, r:5.4 }, g);
      el("text", { class:"num", x, y: y + .4 }, g).textContent = i + 1;
      g.addEventListener("click", () => tap(i));
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); tap(i); } });
      return g;
    });
    $("#result").hidden = true; $("#newBtn").hidden = false; $("#hint").hidden = false;
    markNext(); updateStats();
  }

  function tap(i){
    if (done) return;
    if (i !== next){
      if (i > next){
        const d = dots[i];
        d.classList.remove("no"); void d.getBoundingClientRect(); d.classList.add("no");
        if (S.sfx) Sfx.play("whoosh");
        buzz(30);
      }
      return;
    }
    next++;
    if (S.voice) speech.say(String(i + 1));
    if (S.sfx) Sfx.play("pop");
    buzz(8);
    linesEl.setAttribute("points", pts(pic.pts.slice(0, next)));
    markNext(); updateStats();
    if (next === pic.pts.length) finish();
  }

  async function finish(){
    done = true;
    const mine = run;
    linesEl.setAttribute("points", pts([...pic.pts, pic.pts[0]]));   // close the outline
    dots.forEach(d => d.classList.remove("next"));
    G.wins++; save(); updateStats();
    $("#hint").hidden = true; $("#newBtn").hidden = true;
    await wait(350);
    if (mine !== run) return;
    fillEl.classList.add("show"); revealEl.classList.add("show");
    $("#resultText").textContent = `It's ${pic.a} ${pic.name}!`;
    $("#result").hidden = false;
    celebrate("You did it!");
    await wait(1200);
    if (mine === run) speech.say(`It's ${pic.a} ${pic.name}! Great job!`);
  }

  /* ---------- controls ---------- */
  function syncChips(){
    document.querySelectorAll("[data-level-pick]").forEach(b => b.setAttribute("aria-pressed", b.dataset.levelPick === G.level));
  }
  document.querySelectorAll("[data-level-pick]").forEach(b => b.addEventListener("click", () => {
    if (G.level === b.dataset.levelPick) return;
    G.level = b.dataset.levelPick; last = ""; save(); syncChips(); newGame();
  }));
  $("#newBtn").addEventListener("click", newGame);
  $("#againBtn").addEventListener("click", newGame);

  PT.setupFullscreen($("#fsBtn"));
  PT.settingsSheet($("#settings"), $("#setBtn"), key => {
    if (key === "voice" && !S.voice) speech.cancel();
    if (key === "sfx" && !S.sfx) Sfx.stop();
  });
  PT.twoTap($("#resetBtn"), "Tap again to clear", () => {
    G.wins = 0; save(); updateStats();
    toast("Pictures finished cleared");
  });

  if (!PICTURES[G.level]) G.level = "easy";
  syncChips();
  newGame();
})();
