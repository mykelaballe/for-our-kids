(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast } = PT;
  const S = data.settings, G = data.maze;
  const LEVELS = {
    easy:{ n:5, loops:3 },     // loops knock out a few extra walls so there is more than one way
    medium:{ n:7, loops:2 },
    hard:{ n:9, loops:0 }
  };
  /* Who is walking, where they are going: [walker, goal, walker name, goal name] */
  const PAIRS = [
    ["🐭", "🧀", "mouse", "cheese"], ["🐶", "🦴", "puppy", "bone"], ["🐰", "🥕", "bunny", "carrot"],
    ["🐝", "🌸", "bee", "flower"], ["🐻", "🍯", "bear", "honey"], ["🐵", "🍌", "monkey", "banana"],
    ["🐱", "🐟", "kitty", "fish"]
  ];
  const CELL = 40, NS = "http://www.w3.org/2000/svg";
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // up, right, down, left

  const svg = $("#maze");
  let n = 5, cells = [], cur = 0, goal = 0, trail = [0], steps = 0, done = false, run = 0;
  let pair = PAIRS[0], playerEl, goalEl, trailEl, hintEl, hintTimer = 0;

  const L = () => LEVELS[G.level];
  const center = i => [(i % n + .5) * CELL, (Math.floor(i / n) + .5) * CELL];
  const toPoints = list => list.map(i => center(i).join(",")).join(" ");
  const neighbor = (i, d) => {
    const x = i % n + DIRS[d][0], y = Math.floor(i / n) + DIRS[d][1];
    return x < 0 || y < 0 || x >= n || y >= n ? -1 : y * n + x;
  };

  /* Recursive backtracker: always makes a maze with exactly one route between any two cells. */
  function generate(){
    cells = Array.from({ length:n * n }, () => [false, false, false, false]);
    const seen = new Set([0]), stack = [0];
    while (stack.length){
      const i = stack[stack.length - 1];
      const next = shuffle([0, 1, 2, 3]).find(d => { const j = neighbor(i, d); return j >= 0 && !seen.has(j); });
      if (next === undefined){ stack.pop(); continue; }
      const j = neighbor(i, next);
      cells[i][next] = cells[j][(next + 2) % 4] = true;
      seen.add(j); stack.push(j);
    }
    for (let made = 0, tries = 0; made < L().loops && tries < 200; tries++){
      const i = Math.floor(Math.random() * n * n), d = Math.floor(Math.random() * 4), j = neighbor(i, d);
      if (j < 0 || cells[i][d]) continue;
      cells[i][d] = cells[j][(d + 2) % 4] = true; made++;
    }
  }

  /* Breadth-first search: the shortest way between two cells, as a list of cells. */
  function findPath(from, to){
    const prev = new Map([[from, -1]]), queue = [from];
    for (let q = 0; q < queue.length; q++){
      const i = queue[q];
      if (i === to) break;
      for (let d = 0; d < 4; d++){
        const j = neighbor(i, d);
        if (cells[i][d] && !prev.has(j)){ prev.set(j, i); queue.push(j); }
      }
    }
    const path = [];
    for (let i = to; i !== -1 && prev.has(i); i = prev.get(i)) path.unshift(i);
    return path;
  }

  const el = (name, attrs, parent = svg) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  };

  function draw(){
    const size = n * CELL;
    svg.setAttribute("viewBox", `-6 -6 ${size + 12} ${size + 12}`);
    svg.innerHTML = "";
    const [sx, sy] = center(0), [gx, gy] = center(goal);
    el("circle", { class:"pad start", cx:sx, cy:sy, r:CELL * .46 });
    el("circle", { class:"pad end", cx:gx, cy:gy, r:CELL * .46 });
    let d = "";
    cells.forEach((open, i) => {
      const x = i % n * CELL, y = Math.floor(i / n) * CELL;
      if (!open[0]) d += `M${x} ${y}h${CELL}`;
      if (!open[3]) d += `M${x} ${y}v${CELL}`;
      if (i % n === n - 1) d += `M${x + CELL} ${y}v${CELL}`;
      if (Math.floor(i / n) === n - 1) d += `M${x} ${y + CELL}h${CELL}`;
    });
    el("path", { class:"walls", d });
    trailEl = el("polyline", { class:"trail" });
    hintEl = el("polyline", { class:"hintline" });
    goalEl = el("text", { class:"goal", x:gx, y:gy });
    goalEl.textContent = pair[1];
    playerEl = el("g", { class:"player" });
    el("text", { x:0, y:0 }, playerEl).textContent = pair[0];
    place();
  }

  function place(){
    const [x, y] = center(cur);
    playerEl.style.transform = `translate(${x}px, ${y}px)`;
    trailEl.setAttribute("points", toPoints(trail));
  }

  function updateStats(){
    $("#steps").textContent = steps;
    $("#wins").textContent = G.wins;
  }

  function newGame(){
    run++; speech.cancel(); Sfx.stop();
    clearTimeout(hintTimer);
    n = L().n;
    pair = shuffle(PAIRS.slice())[0];
    generate();
    cur = 0; goal = n * n - 1; trail = [0]; steps = 0; done = false;
    draw();
    $("#result").hidden = true; $("#tools").hidden = false; $("#hint").hidden = false;
    $("#hint").textContent = `Help the ${pair[2]} get to the ${pair[3]}!`;
    updateStats();
  }

  function step(j){
    cur = j; steps++;
    const at = trail.indexOf(j);
    if (at >= 0) trail.length = at + 1; else trail.push(j);   // walking back rubs out the trail
    hintEl.classList.remove("show");
  }

  /* Walk toward a cell. Skips ahead at most two cells so a quick drag keeps up,
     but a finger cutting across a wall does not walk the character through it. */
  function moveTo(target){
    if (done || target === cur) return;
    const path = findPath(cur, target);
    if (path.length < 2 || path.length > 3) return;
    path.slice(1).forEach(step);
    place(); updateStats();
    if (S.sfx) Sfx.play("pop");
    buzz(8);
    if (cur === goal) win();
  }

  /* ---------- finger and keyboard ---------- */
  let dragging = false;
  function cellAt(ev){
    const r = svg.getBoundingClientRect();
    const u = n * CELL + 12, scale = u / r.width;
    const x = (ev.clientX - r.left) * scale - 6, y = (ev.clientY - r.top) * scale - 6;
    const c = Math.max(0, Math.min(n - 1, Math.floor(x / CELL)));
    const rw = Math.max(0, Math.min(n - 1, Math.floor(y / CELL)));
    return rw * n + c;
  }
  function follow(e){
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of list.length ? list : [e]) moveTo(cellAt(ev));
  }
  svg.addEventListener("pointerdown", e => {
    dragging = true;
    try{ svg.setPointerCapture(e.pointerId); }catch(err){}
    follow(e);
  });
  svg.addEventListener("pointermove", e => { if (dragging) follow(e); });
  const stop = () => { dragging = false; };
  svg.addEventListener("pointerup", stop);
  svg.addEventListener("pointercancel", stop);

  const KEYS = { ArrowUp:0, w:0, ArrowRight:1, d:1, ArrowDown:2, s:2, ArrowLeft:3, a:3 };
  document.addEventListener("keydown", e => {
    const d = KEYS[e.key];
    if (d === undefined || e.metaKey || e.ctrlKey || e.altKey || document.querySelector("dialog[open]")) return;
    e.preventDefault();
    if (cells[cur][d]) moveTo(neighbor(cur, d));
  });

  /* ---------- hint and win ---------- */
  function showWay(){
    if (done) return;
    hintEl.setAttribute("points", toPoints(findPath(cur, goal)));
    hintEl.classList.add("show");
    if (S.sfx) Sfx.play("whoosh");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hintEl.classList.remove("show"), 3500);
  }

  async function win(){
    done = true; dragging = false;
    const mine = run;
    G.wins++; G.won[G.level] = (G.won[G.level] || 0) + 1;
    save(); updateStats();
    goalEl.classList.add("cheer");
    $("#hint").hidden = true; $("#tools").hidden = true;
    $("#resultText").textContent = `The ${pair[2]} found the ${pair[3]} in ${steps} steps!`;
    $("#result").hidden = false;
    await wait(400);
    if (mine !== run) return;
    celebrate("You did it!");
    await wait(1400);
    if (mine === run) speech.say(`The ${pair[2]} found the ${pair[3]}! Great job!`);
  }

  /* ---------- controls ---------- */
  function syncChips(){
    document.querySelectorAll("[data-level-pick]").forEach(b => b.setAttribute("aria-pressed", b.dataset.levelPick === G.level));
  }
  document.querySelectorAll("[data-level-pick]").forEach(b => b.addEventListener("click", () => {
    if (G.level === b.dataset.levelPick) return;
    G.level = b.dataset.levelPick; save(); syncChips(); newGame();
  }));
  $("#newBtn").addEventListener("click", newGame);
  $("#againBtn").addEventListener("click", newGame);
  $("#showBtn").addEventListener("click", showWay);

  PT.setupFullscreen($("#fsBtn"));
  PT.settingsSheet($("#settings"), $("#setBtn"), key => {
    if (key === "voice" && !S.voice) speech.cancel();
    if (key === "sfx" && !S.sfx) Sfx.stop();
  });
  PT.twoTap($("#resetBtn"), "Tap again to clear", () => {
    G.wins = 0; G.won = {}; save(); updateStats();
    toast("Mazes won cleared");
  });

  if (!LEVELS[G.level]) G.level = "easy";
  syncChips();
  newGame();
})();
