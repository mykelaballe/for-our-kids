(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast } = PT;
  const S = data.settings, G = data.shadow;
  const LEVELS = { easy:{ n:2 }, medium:{ n:3 }, hard:{ n:4 } };

  /* Each theme is a pool of pictures: { name, say?, sound?, bg, face (html) } */
  const POOLS = {
    animals: () => {
      const seen = new Set(), out = [];
      for (const g of ANIMAL_GROUPS) for (const [name, emoji, , sound, bg] of g.animals){
        if (seen.has(emoji)) continue;
        seen.add(emoji); out.push({ name, sound, bg, face:emoji });
      }
      return out;
    },
    shapes: () => SHAPES.map(([id, name, , bg, fill]) => ({ name, bg, face:shapeSvg(id, fill) })),
    letters: () => LETTERS.map(([L, word, emoji, bg]) => ({ name:word, say:`${L} is for ${word}`, bg, face:emoji }))
  };

  const shadowsEl = $("#shadows"), piecesEl = $("#pieces");
  let tiles = [], pieces = [], sel = null, found = 0, total = 0, run = 0, drag = null;

  const mk = (tag, cls, html) => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; return e; };

  function updateStats(){
    $("#found").textContent = `${found} / ${total}`;
    $("#wins").textContent = G.wins;
  }

  function newGame(){
    run++; speech.cancel(); Sfx.stop();
    const picks = shuffle(POOLS[G.theme]()).slice(0, LEVELS[G.level].n);
    total = picks.length; found = 0; sel = null; drag = null;
    for (const t of [shadowsEl, piecesEl]){ t.innerHTML = ""; t.style.setProperty("--cols", total); }
    tiles = picks.map(item => {
      const el = mk("button", "shadow", `<span class="pic" aria-hidden="true">${item.face}</span>`);
      el.style.setProperty("--c", item.bg);
      el.setAttribute("aria-label", "Shadow");
      const t = { item, el, done:false };
      el.addEventListener("click", () => { if (sel && !t.done) attempt(sel, t); });
      shadowsEl.appendChild(el);
      return t;
    });
    pieces = shuffle(picks.map(item => {
      const el = mk("button", "piece", `<span class="pic" aria-hidden="true">${item.face}</span>`);
      el.style.setProperty("--c", item.bg);
      el.setAttribute("aria-label", item.name);
      const p = { item, el, done:false };
      wireDrag(p);
      return p;
    }));
    pieces.forEach(p => piecesEl.appendChild(p.el));
    $("#result").hidden = true; $("#newBtn").hidden = false;
    $("#hint").hidden = false; $("#hint").textContent = "Drag each picture onto its shadow.";
    updateStats();
  }

  /* ---------- dragging (or tap a picture, then tap a shadow) ---------- */
  function wireDrag(p){
    const el = p.el;
    el.addEventListener("pointerdown", e => {
      if (p.done || drag) return;
      try{ el.setPointerCapture(e.pointerId); }catch(err){}
      drag = { p, x:e.clientX, y:e.clientY, moved:false };
      el.classList.add("drag");
    });
    el.addEventListener("pointermove", e => {
      if (!drag || drag.p !== p) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 8) drag.moved = true;
      if (drag.moved) el.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
    });
    const end = e => {
      if (!drag || drag.p !== p) return;
      const { moved } = drag;
      drag = null;
      el.classList.remove("drag");
      el.style.transform = "";   // springs back unless it was matched
      if (e.type === "pointercancel") return;
      if (!moved){ select(p); return; }
      const hit = tiles.find(t => {
        if (t.done) return false;
        const r = t.el.getBoundingClientRect(), m = 10;
        return e.clientX >= r.left - m && e.clientX <= r.right + m && e.clientY >= r.top - m && e.clientY <= r.bottom + m;
      });
      if (hit) attempt(p, hit);
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  function select(p){
    pieces.forEach(q => q.el.classList.remove("sel"));
    sel = sel === p ? null : p;
    if (sel){ sel.el.classList.add("sel"); $("#hint").textContent = "Now tap its shadow!"; }
    else $("#hint").textContent = "Drag each picture onto its shadow.";
  }

  function attempt(p, t){
    if (p.item !== t.item){
      t.el.classList.remove("no"); void t.el.offsetWidth; t.el.classList.add("no");
      if (S.sfx) Sfx.play("whoosh");
      buzz(40);
      $("#hint").textContent = "Not that one. Try again!";
      return;
    }
    matched(p, t);
  }

  async function matched(p, t){
    const mine = run;
    p.done = t.done = true; found++; sel = null;
    p.el.classList.remove("sel"); p.el.classList.add("done"); p.el.tabIndex = -1;
    t.el.classList.add("done"); t.el.setAttribute("aria-label", t.item.name);
    $("#hint").textContent = "Drag each picture onto its shadow.";
    updateStats();
    if (S.sfx) Sfx.play("cheer");
    buzz(20);
    if (found === total){ finish(); return; }
    await wait(450);
    if (mine !== run) return;
    await speech.say(t.item.say || t.item.name);
    if (mine === run && S.sfx && t.item.sound) Sfx.play(t.item.sound);
  }

  async function finish(){
    const mine = run;
    G.wins++; save(); updateStats();
    $("#hint").hidden = true; $("#newBtn").hidden = true;
    $("#resultText").textContent = `You matched all ${total} shadows!`;
    $("#result").hidden = false;
    await wait(500);
    if (mine !== run) return;
    celebrate("You did it!");
    await wait(1400);
    if (mine === run) speech.say("You matched them all! Great job!");
  }

  /* ---------- controls ---------- */
  function syncChips(){
    document.querySelectorAll("[data-theme-pick]").forEach(b => b.setAttribute("aria-pressed", b.dataset.themePick === G.theme));
    document.querySelectorAll("[data-level-pick]").forEach(b => b.setAttribute("aria-pressed", b.dataset.levelPick === G.level));
  }
  document.querySelectorAll("[data-theme-pick]").forEach(b => b.addEventListener("click", () => {
    if (G.theme === b.dataset.themePick) return;
    G.theme = b.dataset.themePick; save(); syncChips(); newGame();
  }));
  document.querySelectorAll("[data-level-pick]").forEach(b => b.addEventListener("click", () => {
    if (G.level === b.dataset.levelPick) return;
    G.level = b.dataset.levelPick; save(); syncChips(); newGame();
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
    toast("Matches won cleared");
  });

  if (!POOLS[G.theme]) G.theme = "animals";
  if (!LEVELS[G.level]) G.level = "easy";
  syncChips();
  newGame();
})();
