/* Fun Shapes: two new ways to meet shapes.
   Learn = a playground. Shapes drift and bounce around; tap one to meet it.
   Game  = a shape sorter. Drag each shape into the hole that fits it (or tap, then tap the hole). */
(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate } = PT;
  const S = data.settings, B = data.shapes;
  let run = 0;
  const stopAll = () => { run++; speech.cancel(); Sfx.stop(); };
  const article = name => /^[aeiou]/i.test(name) ? "an" : "a";
  const byId = Object.fromEntries(SHAPES.map(s => [s[0], s]));

  function markSeen(id){
    if (!B.seen[id]){
      B.seen[id] = 1;
      if (!B.doneLearn && SHAPES.every(s => B.seen[s[0]])){
        B.doneLearn = true;
        setTimeout(() => celebrate("You know all the shapes!"), 2400);
      }
    }
    save(); $("#met").textContent = `★ ${SHAPES.filter(s => B.seen[s[0]]).length} of ${SHAPES.length} met`;
  }

  /* ================= Learn: shape playground ================= */
  const arena = $("#arena");
  let sprites = [], raf = 0, lastT = 0, holdId = null;

  function buildSprites(){
    arena.querySelectorAll(".sprite").forEach(e => e.remove());
    const w = arena.clientWidth, h = arena.clientHeight;
    sprites = SHAPES.map(([id, name, , , fill]) => {
      const size = 72 + Math.random() * 26;
      const el = document.createElement("button");
      el.className = "sprite";
      el.style.width = el.style.height = size + "px";
      el.innerHTML = shapeSvg(id, fill);
      el.setAttribute("aria-label", name);
      const ang = Math.random() * Math.PI * 2, v = 26 + Math.random() * 26;
      const s = { id, el, size, x:Math.random() * (w - size), y:Math.random() * (h - size),
                  vx:Math.cos(ang) * v, vy:Math.sin(ang) * v, rot:Math.random() * 40 - 20, vr:(Math.random() - .5) * 14, held:false };
      el.addEventListener("click", () => meet(s));
      arena.appendChild(el);
      return s;
    });
  }

  function frame(t){
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - lastT) / 1000 || 0); lastT = t;
    const w = arena.clientWidth, h = arena.clientHeight;
    for (const s of sprites){
      if (!s.held){
        s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
        if (s.x < 0){ s.x = 0; s.vx = Math.abs(s.vx); }
        if (s.x > w - s.size){ s.x = w - s.size; s.vx = -Math.abs(s.vx); }
        if (s.y < 0){ s.y = 0; s.vy = Math.abs(s.vy); }
        if (s.y > h - s.size){ s.y = h - s.size; s.vy = -Math.abs(s.vy); }
      }
      s.el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg) scale(${s.held ? 1.7 : 1})`;
    }
  }

  async function meet(s){
    stopAll();
    const mine = run, [id, name, fact] = byId[s.id];
    sprites.forEach(x => { x.held = false; x.el.classList.remove("held"); });
    s.held = true; s.el.classList.add("held");
    markSeen(id);
    $("#meetName").textContent = name; $("#meetFact").textContent = fact;
    if (S.sfx) Sfx.play("pop");
    buzz(10);
    const ok = await speech.say(name);
    if (ok && mine === run) await speech.say(fact);
    if (mine === run){ await wait(S.voice ? 400 : 1800); }
    if (mine === run){ s.held = false; s.el.classList.remove("held"); }
  }

  PT.modeDefs.learn = {
    enter(){
      requestAnimationFrame(() => {
        buildSprites(); markSeen_noop();
        $("#meetName").textContent = "Tap a shape"; $("#meetFact").textContent = "to meet it!";
        lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      });
    },
    leave(){ stopAll(); cancelAnimationFrame(raf); raf = 0; }
  };
  function markSeen_noop(){ $("#met").textContent = `★ ${SHAPES.filter(s => B.seen[s[0]]).length} of ${SHAPES.length} met`; }

  /* ================= Game: shape sorter ================= */
  const holes = $("#holes"), tray = $("#tray");
  let target = 0, placed = 0, picked = null, locked = false;

  const holeSvg = id => shapeSvg(id, "rgba(43,35,64,.12)")
    .replace('stroke="rgba(43,35,64,.3)"', 'stroke="rgba(43,35,64,.45)" stroke-dasharray="7 6"');

  function hud(){ $("#sstars").textContent = B.stars; }

  function newRound(){
    const mine = ++run;
    speech.cancel();
    target = S.choices === 4 ? 4 : 3;
    placed = 0; picked = null; locked = false;
    const set = shuffle(SHAPES.slice()).slice(0, target);
    holes.innerHTML = ""; tray.innerHTML = "";
    shuffle(set.slice()).forEach(([id, name]) => {
      const h = document.createElement("div");
      h.className = "hole"; h.dataset.id = id;
      h.innerHTML = `<span class="hs">${holeSvg(id)}</span><span class="hl">${name}</span>`;
      h.addEventListener("click", () => { if (picked) place(picked, h); });
      holes.appendChild(h);
    });
    shuffle(set.slice()).forEach(([id, name, , , fill]) => {
      const p = document.createElement("button");
      p.className = "piece"; p.dataset.id = id;
      p.innerHTML = shapeSvg(id, fill);
      p.setAttribute("aria-label", `${name}. Drag it to its hole, or tap it and then tap the hole.`);
      wireDrag(p);
      tray.appendChild(p);
    });
    $("#smsg").textContent = "Put each shape in the hole that fits.";
    hud();
    speech.say("Put each shape in the hole that fits.");
  }

  function wireDrag(p){
    let d = null;
    p.addEventListener("pointerdown", e => {
      if (locked || p.dataset.done) return;
      d = { x:e.clientX, y:e.clientY, moved:false };
      p.style.transition = "none";
      try{ p.setPointerCapture(e.pointerId); }catch(err){}
    });
    p.addEventListener("pointermove", e => {
      if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) < 7) return;
      d.moved = true; p.classList.add("drag");
      p.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
    });
    const up = e => {
      if (!d) return;
      const moved = d.moved; d = null;
      p.classList.remove("drag");
      if (!moved){            // a tap: pick it up, then tap a hole
        p.style.transform = "";
        togglePick(p);
        return;
      }
      p.style.pointerEvents = "none";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      p.style.pointerEvents = "";
      const hole = under && under.closest ? under.closest(".hole") : null;
      if (hole) place(p, hole); else sendBack(p);
    };
    p.addEventListener("pointerup", up);
    p.addEventListener("pointercancel", () => { if (d){ d = null; p.classList.remove("drag"); sendBack(p); } });
  }

  function togglePick(p){
    const was = picked === p;
    tray.querySelectorAll(".piece").forEach(x => x.classList.remove("picked"));
    picked = was ? null : p;
    if (picked) p.classList.add("picked");
    if (picked && S.sfx) Sfx.play("pop");
  }

  function sendBack(p){
    p.style.transition = PT.reduceMotion ? "none" : "transform .3s cubic-bezier(.3,1.4,.5,1)";
    p.style.transform = "";
  }

  async function place(p, hole){
    if (locked || hole.classList.contains("filled")) { sendBack(p); return; }
    const id = p.dataset.id;
    if (hole.dataset.id !== id){
      sendBack(p);
      p.classList.remove("shake"); void p.offsetWidth; p.classList.add("shake");
      hole.classList.remove("shake"); void hole.offsetWidth; hole.classList.add("shake");
      if (S.sfx) Sfx.play("oops");
      buzz([20, 30, 20]);
      $("#smsg").textContent = "Not that one. Try another hole!";
      picked = null; p.classList.remove("picked");
      return;
    }
    // a fit!
    const mine = run, [, name, , , fill] = byId[id];
    p.dataset.done = "1"; p.classList.remove("picked"); p.style.visibility = "hidden";
    picked = null;
    hole.classList.add("filled");
    hole.querySelector(".hs").innerHTML = shapeSvg(id, fill);
    markSeen(id); placed++;
    if (S.sfx) Sfx.play("pop");
    buzz(15);
    $("#smsg").textContent = `${name}!`;
    if (placed < target){ speech.say(name); return; }
    // all sorted
    locked = true;
    B.stars++; save(); hud();
    await wait(350);
    if (mine !== run) return;
    celebrate("All sorted!");
    $("#smsg").textContent = "All sorted! Great job!";
    await speech.say("All sorted! Great job!");
    if (mine !== run) return;
    await wait(1200);
    if (mine === run) newRound();
  }

  PT.modeDefs.game = {
    enter(){ newRound(); },
    leave(){ stopAll(); }
  };
  document.addEventListener("progress-reset", markSeen_noop);
})();
