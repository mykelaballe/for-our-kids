/* Fun Colors: two new ways to play with color.
   Learn  = a finger-painting studio. Tap a paint pot to pick a color and hear its name.
   Game   = balloons float up. Pop the ones that are the color you're asked for. */
(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate } = PT;
  const S = data.settings, B = data.colors;
  let run = 0;
  const stopAll = () => { run++; speech.cancel(); Sfx.stop(); };
  const colorKey = id => "c:" + id;

  function markSeen(id){
    if (!B.seen[colorKey(id)]){
      B.seen[colorKey(id)] = 1;
      if (!B.done && COLORS.every(c => B.seen[colorKey(c[0])])){
        B.done = 1;
        setTimeout(() => celebrate("You know all the colors!"), 2200);
      }
    }
    save(); markPots();
  }

  /* ================= Learn: paint studio ================= */
  const cv = $("#paintCanvas"), g = cv.getContext("2d");
  let brush = COLORS[0], size = 26, drawing = false, last = null, painted = false;

  function paper(w, h){ g.fillStyle = "#FBF7EE"; g.fillRect(0, 0, w, h); }
  function sizeCanvas(){
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    if (cv.width === Math.round(r.width * dpr()) && cv.height === Math.round(r.height * dpr())) return;
    const old = document.createElement("canvas");
    old.width = cv.width; old.height = cv.height;
    if (cv.width) old.getContext("2d").drawImage(cv, 0, 0);
    cv.width = Math.round(r.width * dpr()); cv.height = Math.round(r.height * dpr());
    g.setTransform(dpr(), 0, 0, dpr(), 0, 0);
    paper(r.width, r.height);
    if (old.width) g.drawImage(old, 0, 0, r.width, r.height);
  }
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  addEventListener("resize", sizeCanvas);

  const pt = e => { const r = cv.getBoundingClientRect(); return { x:e.clientX - r.left, y:e.clientY - r.top }; };
  function dot(p){
    g.fillStyle = brush[2]; g.beginPath(); g.arc(p.x, p.y, size / 2, 0, Math.PI * 2); g.fill();
  }
  cv.addEventListener("pointerdown", e => {
    drawing = true; last = pt(e);
    try{ cv.setPointerCapture(e.pointerId); }catch(err){}
    dot(last);
    if (!painted){ painted = true; $("#paintHint").classList.add("gone"); }
  });
  cv.addEventListener("pointermove", e => {
    if (!drawing) return;
    const p = pt(e);
    g.strokeStyle = brush[2]; g.lineWidth = size; g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke();
    last = p;
  });
  const stopDraw = () => { drawing = false; };
  cv.addEventListener("pointerup", stopDraw);
  cv.addEventListener("pointercancel", stopDraw);

  // A splat of the chosen color lands somewhere on the page when you pick a pot.
  function splat(){
    const r = cv.getBoundingClientRect();
    const cx = 60 + Math.random() * Math.max(20, r.width - 120), cy = 60 + Math.random() * Math.max(20, r.height - 120);
    g.fillStyle = brush[2];
    for (let k = 0; k < 9; k++){
      g.beginPath();
      g.arc(cx + (Math.random() - .5) * 70, cy + (Math.random() - .5) * 70, 10 + Math.random() * 28, 0, Math.PI * 2);
      g.fill();
    }
    for (let k = 0; k < 7; k++){
      g.beginPath();
      g.arc(cx + (Math.random() - .5) * 190, cy + (Math.random() - .5) * 190, 3 + Math.random() * 7, 0, Math.PI * 2);
      g.fill();
    }
    painted = true; $("#paintHint").classList.add("gone");
  }

  COLORS.forEach(c => {
    const b = document.createElement("button");
    b.className = "pot"; b.dataset.id = c[0];
    b.innerHTML = `<span class="blob" style="--s:${c[2]}"></span><span class="lbl">${c[1]}</span>`;
    b.setAttribute("aria-label", c[1]);
    b.addEventListener("click", () => pick(c));
    $("#pots").appendChild(b);
  });
  function markPots(){
    document.querySelectorAll("#pots .pot").forEach(b => {
      b.setAttribute("aria-pressed", b.dataset.id === brush[0]);
      b.classList.toggle("seen", !!B.seen[colorKey(b.dataset.id)]);
    });
  }
  async function pick(c){
    stopAll();
    const mine = run;
    brush = c;
    markSeen(c[0]); splat();
    if (S.sfx) Sfx.play("pop");
    buzz(10);
    await speech.say(`${c[1]}.`);
    if (mine === run) speech.say(`${c[1]}, like ${c[5]}.`);
  }
  document.querySelectorAll(".size").forEach(b => b.addEventListener("click", () => {
    size = Number(b.dataset.size);
    document.querySelectorAll(".size").forEach(x => x.setAttribute("aria-pressed", x === b));
  }));
  $("#clearBtn").addEventListener("click", () => {
    const r = cv.getBoundingClientRect(); paper(r.width, r.height);
    painted = false; $("#paintHint").classList.remove("gone");
  });

  PT.modeDefs.learn = {
    enter(){ requestAnimationFrame(() => { sizeCanvas(); markPots(); }); },
    leave(){ stopAll(); drawing = false; }
  };

  /* ================= Game: pop the balloons ================= */
  const sky = $("#sky");
  let balloons = [], raf = 0, lastT = 0, spawnIn = 0, target = null, roundColors = [], popped = 0, prevTarget = -1;
  let paused = false, lastSpoke = 0, rounds = 0;

  function hud(){
    $("#gsw").style.setProperty("--s", target[2]);
    $("#gtext").textContent = `Pop the ${target[1].toLowerCase()} balloons!`;
    $("#pips").textContent = popped ? `${popped} popped` : "";
    $("#pstars").textContent = B.stars;
  }

  function newTarget(){
    let k; do { k = Math.floor(Math.random() * COLORS.length); } while (k === prevTarget);
    prevTarget = k; target = COLORS[k]; popped = 0; paused = false;
    roundColors = [target, ...shuffle(COLORS.filter(c => c !== target)).slice(0, 4)];
    $("#pmsg").textContent = "";
    hud();
    const mine = ++run;
    for (let n = 0; n < 6; n++) spawn(Math.random() * (sky.clientHeight * .8) + 20);
    speech.say(`Pop the ${target[1].toLowerCase()} balloons!`).then(() => { if (mine !== run) return; });
  }

  function spawn(y){
    if (balloons.length >= 10) return;
    const c = Math.random() < .42 ? target : roundColors[Math.floor(Math.random() * roundColors.length)];
    const sz = 62 + Math.random() * 24, w = sky.clientWidth;
    const el = document.createElement("button");
    el.className = "balloon";
    el.style.setProperty("--b", c[2]); el.style.setProperty("--sz", sz + "px");
    el.setAttribute("aria-label", `${c[1]} balloon`);
    el.innerHTML = `<span class="body"></span>`;
    sky.appendChild(el);
    const b = { el, c, x:10 + Math.random() * Math.max(10, w - sz - 20), y:y ?? sky.clientHeight + 30,
                vy:34 + Math.random() * 24, ph:Math.random() * 6, fq:.8 + Math.random() * .8, popped:false };
    el.addEventListener("click", () => hit(b));
    balloons.push(b);
  }

  function frame(t){
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - lastT) / 1000 || 0); lastT = t;
    spawnIn -= dt;
    if (!paused && spawnIn <= 0){ spawn(); spawnIn = .8 + Math.random() * .6; }
    for (const b of balloons){
      b.y -= b.vy * dt; b.ph += b.fq * dt;
      b.el.style.transform = `translate(${b.x + Math.sin(b.ph * 2) * 12}px, ${b.y}px)`;
    }
    balloons = balloons.filter(b => {
      if (b.y < -140 && !b.popped){ b.el.remove(); return false; }
      return !b.gone;
    });
  }

  function remove(b, ms){
    b.popped = true;
    setTimeout(() => { b.gone = true; b.el.remove(); }, ms);
  }

  async function hit(b){
    if (b.popped || paused) return;
    if (b.c !== target){
      b.el.classList.remove("wobble"); void b.el.offsetWidth; b.el.classList.add("wobble");
      if (S.sfx) Sfx.play("oops");
      buzz([20, 30, 20]);
      $("#pmsg").textContent = `That one is ${b.c[1].toLowerCase()}. Find ${target[1].toLowerCase()}!`;
      if (performance.now() - lastSpoke > 2500){ lastSpoke = performance.now(); speech.say(`That's ${b.c[1].toLowerCase()}.`); }
      return;
    }
    b.el.classList.add("popping"); remove(b, 260);
    popped++; hud();
    if (S.sfx) Sfx.play("pop");
    buzz(12);
    $("#pmsg").textContent = "";
    // No limit: keep popping. A star every 5 pops, a cheer every 15.
    if (popped % 5 !== 0){ if (popped < 10) speech.say(String(popped)); return; }
    B.stars++; save(); hud();
    markSeen(target[0]);
    if (S.sfx) Sfx.play("cheer");
    if (popped % 15 === 0) celebrate("Pop pop pop!");
  }

  // Tap the goal to switch to another color whenever you like.
  $(".goal").addEventListener("click", () => { if (sky.clientHeight) newTarget(); });

  PT.modeDefs.game = {
    enter(){
      requestAnimationFrame(() => {
        balloons.forEach(b => b.el.remove()); balloons = [];
        newTarget(); lastT = performance.now();
        cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      });
    },
    leave(){
      run++; cancelAnimationFrame(raf); raf = 0;
      balloons.forEach(b => b.el.remove()); balloons = [];
    }
  };

  document.addEventListener("progress-reset", markPots);
  document.querySelector('.size[data-size="26"]').setAttribute("aria-pressed", "true");
})();
