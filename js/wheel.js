(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast } = PT;
  const S = data.settings, W = data.wheel;
  const NS = "http://www.w3.org/2000/svg", SLICES = 8, SEG = 360 / SLICES, R = 100;

  /* Each theme is a pool of things to land on:
     { name, say?, sound?, bg (prize color), fill? (slice color), text? | svg? (slice picture), face (prize picture) } */
  const POOLS = {
    animals: () => {
      const seen = new Set(), out = [];
      for (const g of ANIMAL_GROUPS) for (const [name, emoji, , sound, bg] of g.animals){
        if (seen.has(emoji)) continue;
        seen.add(emoji); out.push({ name, sound, bg, text:emoji, face:emoji });
      }
      return out;
    },
    letters: () => LETTERS.map(([L, word, emoji, bg]) => ({ name:word, say:`${L} is for ${word}`, bg, text:emoji, face:emoji })),
    shapes: () => SHAPES.map(([id, name, , bg, fill]) => ({ name, bg, svg:shapeSvg(id, fill), face:shapeSvg(id, fill) })),
    colors: () => COLORS.map(([, name, hex, bg]) => ({ name, bg, fill:hex, face:`<span class="sw" style="--s:${hex}"></span>` })),
    numbers: () => NUMBERS.map(([num, name, , , , bg]) => ({ name, say:`${num}. ${name}`, bg, digit:String(num), face:String(num) }))
  };

  const wheel = $("#wheel"), btn = $("#spinBtn");
  let items = [], angle = 0, spinning = false, run = 0, rot;

  const pt = (deg, r) => {
    const a = deg * Math.PI / 180;
    return `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`;
  };
  const el = (name, attrs, parent) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  };

  function build(){
    items = shuffle(POOLS[W.theme]()).slice(0, SLICES);
    wheel.innerHTML = "";
    el("circle", { class:"rim", r:R + 6 }, wheel);
    rot = el("g", {}, wheel);
    items.forEach((it, i) => {
      const a0 = i * SEG, mid = a0 + SEG / 2;
      const s = el("path", { class:"slice", d:`M0 0L${pt(a0, R)}A${R} ${R} 0 0 1 ${pt(a0 + SEG, R)}Z` }, rot);
      s.style.fill = it.fill || it.bg;
      const g = el("g", { transform:`rotate(${mid}) translate(0 ${-R * .64})` }, rot);
      if (it.svg){
        g.insertAdjacentHTML("beforeend", it.svg);
        const sv = g.lastElementChild;
        ["x", "y"].forEach(k => sv.setAttribute(k, -17));
        sv.setAttribute("width", 34); sv.setAttribute("height", 34);
      } else if (it.text || it.digit){
        const t = el("text", { class:"lab" + (it.digit ? " num" : "") }, g);
        t.textContent = it.text || it.digit;
      }
    });
    el("circle", { class:"hub", r:16 }, wheel);
    el("path", { class:"pointer", d:"M-10 -118 L10 -118 L0 -96 Z" }, wheel);
    angle = 0; setAngle(0);
  }

  const setAngle = a => rot.setAttribute("transform", `rotate(${a.toFixed(2)})`);
  const sliceAt = a => Math.floor((((-a % 360) + 360) % 360) / SEG) % SLICES;

  function newWheel(){
    run++; speech.cancel(); Sfx.stop(); spinning = false; btn.disabled = false;
    build();
    $("#prize").hidden = true;
    $("#hint").hidden = false; $("#hint").textContent = "Spin the wheel!";
    $("#spins").textContent = W.spins;
  }

  async function spin(){
    if (spinning) return;
    spinning = true; btn.disabled = true;
    speech.cancel(); Sfx.stop();
    const mine = run;
    $("#prize").hidden = true; $("#hint").hidden = false; $("#hint").textContent = "Round and round...";

    const win = Math.floor(Math.random() * SLICES);
    const jitter = (Math.random() - .5) * SEG * .6;
    const target = ((-(win + .5) * SEG + jitter) % 360 + 360) % 360;
    const start = angle, turns = 4 + Math.floor(Math.random() * 3);
    const delta = ((target - start) % 360 + 360) % 360 + turns * 360;
    const dur = PT.reduceMotion ? 700 : 4200;

    const t0 = performance.now();
    let last = sliceAt(start);
    await new Promise(done => {
      (function frame(now){
        if (mine !== run) return done();
        const t = Math.min(1, (now - t0) / dur);
        angle = start + delta * (1 - Math.pow(1 - t, 4));
        setAngle(angle);
        const at = sliceAt(angle);
        if (at !== last){ last = at; if (S.sfx) Sfx.play("pop"); buzz(5); }
        if (t < 1) requestAnimationFrame(frame); else done();
      })(t0);
    });
    if (mine !== run) return;
    angle %= 360; setAngle(angle);
    land(items[win]);
  }

  async function land(it){
    const mine = run;
    W.spins++; save();
    $("#spins").textContent = W.spins;
    $("#prizeFace").innerHTML = it.face;
    $("#prizeName").textContent = it.name;
    $("#prize").style.setProperty("--c", it.bg);
    $("#prize").hidden = false;
    $("#hint").textContent = "Tap spin to go again!";
    if (S.sfx) Sfx.play("cheer");
    buzz(20);
    await wait(500);
    if (mine !== run) return;
    await speech.say(it.say || it.name);
    if (mine === run && S.sfx && it.sound) Sfx.play(it.sound);
    if (mine === run){ spinning = false; btn.disabled = false; }
  }

  /* ---------- controls ---------- */
  function syncChips(){
    document.querySelectorAll("[data-theme-pick]").forEach(b => b.setAttribute("aria-pressed", b.dataset.themePick === W.theme));
  }
  document.querySelectorAll("[data-theme-pick]").forEach(b => b.addEventListener("click", () => {
    if (W.theme === b.dataset.themePick) return;
    W.theme = b.dataset.themePick; save(); syncChips(); newWheel();
  }));
  btn.addEventListener("click", spin);
  wheel.addEventListener("click", spin);

  PT.setupFullscreen($("#fsBtn"));
  PT.settingsSheet($("#settings"), $("#setBtn"), key => {
    if (key === "voice" && !S.voice) speech.cancel();
    if (key === "sfx" && !S.sfx) Sfx.stop();
  });
  PT.twoTap($("#resetBtn"), "Tap again to clear", () => {
    W.spins = 0; save(); $("#spins").textContent = 0;
    toast("Spin count cleared");
  });

  if (!POOLS[W.theme]) W.theme = "animals";
  syncChips();
  newWheel();
})();
