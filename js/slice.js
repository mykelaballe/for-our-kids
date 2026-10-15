(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast, reduceMotion } = PT;
  const S = data.settings, G = data.slice;
  /* goal: fruits to slice. gravity: how fast they fall. live: fruits in the air at once. */
  const LEVELS = {
    easy:{ goal:8, gravity:.7, live:2 },
    medium:{ goal:12, gravity:.95, live:3 },
    hard:{ goal:16, gravity:1.25, live:4 }
  };
  const FRUITS = PRODUCE.slice(0, 10);   // the fruits, not the vegetables
  const FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  const cvs = $("#field"), ctx = cvs.getContext("2d");
  let W = 0, H = 0, R = 30;
  let fruits = [], halves = [], drops = [], trail = [];
  let sliced = 0, startedAt = 0, finished = false, run = 0, lastT = 0, lastSay = 0, raf = 0, nextSpawn = 0;

  const L = () => LEVELS[G.level];
  const rand = (a, b) => a + Math.random() * (b - a);

  function resize(){
    const r = cvs.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; R = Math.max(24, W * .085);
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function updateStats(){
    $("#count").textContent = `${sliced} / ${L().goal}`;
    const b = G.best[G.level];
    $("#best").textContent = b ? `${b}s` : "-";
  }

  function spawn(){
    const item = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const g = H * 1.15 * L().gravity;                  // pixels per second squared
    const apex = H * rand(.5, .78);                     // how high it climbs
    const x = rand(W * .18, W * .82);
    fruits.push({
      item, x, y:H + R, g,
      vy:-Math.sqrt(2 * g * apex),
      vx:(W / 2 - x) * rand(.1, .5) + rand(-W * .06, W * .06),
      a:rand(-.5, .5), va:rand(-1.8, 1.8)
    });
  }

  function newGame(){
    run++; speech.cancel(); Sfx.stop();
    cancelAnimationFrame(raf);
    resize();
    fruits = []; halves = []; drops = []; trail = [];
    sliced = 0; finished = false; nextSpawn = 0;
    startedAt = performance.now(); lastT = startedAt;
    $("#result").hidden = true; $("#newBtn").hidden = false; $("#hint").hidden = false;
    $("#time").textContent = "0.0";
    updateStats();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- slicing ---------- */
  const near = (ax, ay, bx, by, cx, cy) => {   // distance from point c to segment a-b
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / len)) : 0;
    return Math.hypot(cx - (ax + t * dx), cy - (ay + t * dy));
  };

  function cut(ax, ay, bx, by){
    for (const f of fruits){
      if (f.cut || near(ax, ay, bx, by, f.x, f.y) > R * 1.05) continue;
      f.cut = true;
      sliced++;
      const ang = Math.atan2(by - ay, bx - ax) + Math.PI / 2;   // halves fly apart across the cut
      for (const side of [-1, 1]){
        halves.push({ item:f.item, side, x:f.x, y:f.y, a:f.a, va:f.va + side * 2.5,
          vx:f.vx * .4 + Math.cos(ang) * side * 90, vy:f.vy * .3 + Math.sin(ang) * side * 90 - 60, g:f.g, life:1.3 });
      }
      const n = reduceMotion ? 6 : 16;
      for (let k = 0; k < n; k++){
        const d = rand(0, Math.PI * 2), sp = rand(60, 220);
        drops.push({ x:f.x, y:f.y, vx:Math.cos(d) * sp, vy:Math.sin(d) * sp - 60, r:rand(3, 7), c:f.item[2], life:rand(.5, 1) });
      }
      if (S.sfx) Sfx.play("pop");
      buzz(12);
      const now = performance.now();
      if (now - lastSay > 900){ lastSay = now; speech.say(f.item[0]); }
      updateStats();
      if (sliced >= L().goal) finish();
    }
  }

  /* ---------- finger or mouse ---------- */
  let down = false, last = null;
  const pos = e => { const r = cvs.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function move(e){
    if (finished) return;
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of list.length ? list : [e]){
      const [x, y] = pos(ev), now = performance.now();
      trail.push({ x, y, t:now });
      cut(last ? last[0] : x, last ? last[1] : y, x, y);
      last = [x, y];
    }
  }
  cvs.addEventListener("pointerdown", e => {
    down = true; last = null;
    try{ cvs.setPointerCapture(e.pointerId); }catch(err){}
    move(e);
  });
  cvs.addEventListener("pointermove", e => { if (down) move(e); });
  const up = () => { down = false; last = null; };
  cvs.addEventListener("pointerup", up);
  cvs.addEventListener("pointercancel", up);

  /* ---------- the loop ---------- */
  function frame(now){
    const mine = run;
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;

    if (!finished){
      $("#time").textContent = ((now - startedAt) / 1000).toFixed(1);
      if (fruits.length < L().live && now >= nextSpawn){ spawn(); nextSpawn = now + rand(350, 900); }
    }
    for (const f of fruits){ f.vy += f.g * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.a += f.va * dt; }
    fruits = fruits.filter(f => !f.cut && !(f.vy > 0 && f.y > H + R * 1.5));
    for (const h of halves){ h.vy += h.g * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.a += h.va * dt; h.life -= dt; }
    halves = halves.filter(h => h.life > 0 && h.y < H + R * 2);
    for (const d of drops){ d.vy += H * 1.4 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; }
    drops = drops.filter(d => d.life > 0);
    trail = trail.filter(p => now - p.t < (reduceMotion ? 90 : 220));

    draw(now);
    if (mine === run) raf = requestAnimationFrame(frame);
  }

  function emoji(item, x, y, a, clip){
    ctx.save();
    ctx.translate(x, y); ctx.rotate(a);
    if (clip){ ctx.beginPath(); ctx.rect(clip < 0 ? -R * 1.6 : 0, -R * 1.6, R * 1.6, R * 3.2); ctx.clip(); }
    ctx.font = `${R * 2}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(item[1], 0, R * .08);
    ctx.restore();
  }

  function draw(now){
    ctx.clearRect(0, 0, W, H);
    for (const f of fruits) emoji(f.item, f.x, f.y, f.a);
    for (const h of halves){
      ctx.globalAlpha = Math.min(1, h.life * 1.5);
      emoji(h.item, h.x, h.y, h.a, h.side);
    }
    for (const d of drops){
      ctx.globalAlpha = Math.min(1, d.life * 2);
      ctx.fillStyle = d.c;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // the swipe: a fading white streak
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let i = 1; i < trail.length; i++){
      const p = trail[i], q = trail[i - 1], age = 1 - (now - p.t) / 220;
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, age)})`;
      ctx.lineWidth = Math.max(2, R * .32 * age);
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
  }

  async function finish(){
    finished = true; down = false;
    const mine = run;
    const secs = Math.round((performance.now() - startedAt) / 100) / 10;
    const prev = G.best[G.level];
    const record = !prev || secs < prev;
    G.wins++;
    if (record) G.best[G.level] = secs;
    save(); updateStats();
    $("#hint").hidden = true; $("#newBtn").hidden = true;
    $("#resultText").textContent = record && prev
      ? `New best! ${L().goal} fruits in ${secs} seconds.`
      : `You sliced ${L().goal} fruits in ${secs} seconds!`;
    $("#result").hidden = false;
    await wait(600);
    if (mine !== run) return;
    celebrate(record && prev ? "New best!" : "You did it!");
    await wait(1400);
    if (mine === run) speech.say("Yum! Great slicing!");
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
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => { lastT = performance.now(); });

  PT.setupFullscreen($("#fsBtn"));
  PT.settingsSheet($("#settings"), $("#setBtn"), key => {
    if (key === "voice" && !S.voice) speech.cancel();
    if (key === "sfx" && !S.sfx) Sfx.stop();
  });
  PT.twoTap($("#resetBtn"), "Tap again to clear", () => {
    G.best = {}; G.wins = 0; save(); updateStats();
    toast("Best times cleared");
  });

  if (!LEVELS[G.level]) G.level = "easy";
  syncChips();
  newGame();
})();
