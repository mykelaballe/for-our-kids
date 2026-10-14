(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast } = PT;
  const S = data.settings, B = data.abc;
  let i = Math.min(Math.max(B.last | 0, 0), LETTERS.length - 1);
  let run = 0;

  const at = k => LETTERS[((k % LETTERS.length) + LETTERS.length) % LETTERS.length];
  const shown = ch => S.letterCase === "lower" ? ch.toLowerCase() : ch;
  const stopAll = () => { run++; speech.cancel(); Sfx.stop(); };

  // "Apple" -> <span class="first">A</span>pple
  function wordWithFirst(el, word){
    el.textContent = "";
    const f = document.createElement("span");
    f.className = "first"; f.textContent = word[0];
    el.append(f, word.slice(1));
  }

  /* ================= Learn: a three-card carousel ================= */
  // Every letter is a card. Cards are placed by their distance from the middle
  // (pos is a float so cards follow your finger while you drag), the middle one
  // is biggest, its neighbours are smaller and tilted, the rest fade away.
  const carousel = $("#carousel");
  const N = LETTERS.length;
  const mod = k => ((k % N) + N) % N;
  let pos = i, step = 150, current = -1, suppressClick = false;

  const cardEls = LETTERS.map(([L, word, emoji, color]) => {
    const b = document.createElement("button");
    b.className = "ccard chunky";
    b.style.setProperty("--c", color);
    b.setAttribute("aria-label", `${L} is for ${word}`);
    b.innerHTML =
      `<span class="cl">${L}<small>${L.toLowerCase()}</small></span>` +
      `<span class="ce" aria-hidden="true">${emoji}</span>` +
      `<span class="cn"><span class="first">${L}</span>${word.slice(1)}</span>` +
      `<span class="cb">${L} is for ${word}!</span>`;
    carousel.appendChild(b);
    return b;
  });

  function layout(p){
    cardEls.forEach((el, k) => {
      const d = mod(k - p + N / 2) - N / 2;          // signed distance from the middle, wrapped
      const a = Math.abs(d), s = Math.sign(d);
      const x = a <= 1 ? a * step : step + (a - 1) * step * .45;
      const scale = a <= 1 ? 1 - .26 * a : Math.max(.45, .74 - (a - 1) * .2);
      const op = a <= 1 ? 1 - .12 * a : Math.max(0, .88 - (a - 1) * 1.3);
      el.style.transform = `translateX(${s * x}px) rotateY(${-s * Math.min(a, 1) * 16}deg) scale(${scale})`;
      el.style.opacity = op;
      el.style.zIndex = 100 - Math.round(a * 10);
      el.style.pointerEvents = a > 1.6 ? "none" : "";
      el.classList.toggle("on", a < .5);
      el.tabIndex = a < 1.6 ? 0 : -1;
      el.setAttribute("aria-hidden", a > 1.6 ? "true" : "false");
    });
  }

  // Size the cards to the screen: the middle one about half the width, and short enough to fit.
  function fit(){
    const w = carousel.clientWidth;
    if (!w) return;
    const cw = Math.max(150, Math.min(300, w * .5, (innerHeight - 400) * .75));
    step = cw * .74;
    carousel.style.setProperty("--cw", cw + "px");
    layout(pos);
  }
  addEventListener("resize", fit);

  function show(){
    pos = i;
    carousel.classList.add("dragging");            // place everything instantly, no slide-in
    fit();
    requestAnimationFrame(() => carousel.classList.remove("dragging"));
    current = -1; settle(false);
  }

  // The middle card changed: update counter, stickers, and optionally speak.
  function settle(speak){
    const idx = mod(Math.round(pos));
    if (idx === current) return;
    current = idx; i = idx; B.last = idx;
    $("#count").textContent = `${idx + 1} / ${N}`;
    markSeen(LETTERS[idx][0]);
    updateShelf();
    if (speak && S.autoplay) perform();
  }

  function goTo(target, speak = true){
    const t = Math.round(target);
    if (mod(t) !== current){ stopAll(); if (S.sfx) Sfx.play("whoosh"); buzz(10); }
    pos = t;
    layout(pos);
    settle(speak);
  }

  function markSeen(L){
    if (B.seen[L]) return;
    B.seen[L] = 1; save();
    if (!B.doneLearn && LETTERS.every(l => B.seen[l[0]])){
      B.doneLearn = true; save();
      setTimeout(() => { if (B.mode === "learn") celebrate("You know A to Z!"); }, 2600);
    }
  }

  async function perform(){
    stopAll();
    const mine = run, el = cardEls[i];
    const [L, word, , , sound] = LETTERS[i];
    el.classList.remove("pop", "speaking"); void el.offsetWidth; el.classList.add("pop");
    const ok = await speech.say(`${L}. ${L} is for ${word}.`);
    if (!ok || mine !== run) return;
    el.classList.remove("speaking"); void el.offsetWidth; el.classList.add("speaking");
    if (sound && S.sfx) Sfx.play(sound);
  }

  /* Drag or flick sideways to spin the carousel; tap a side card to bring it to the middle. */
  let drag = null;
  carousel.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag = { id:e.pointerId, x:e.clientX, p:pos, lastX:e.clientX, lastT:e.timeStamp, v:0, moved:false };
  });
  carousel.addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved){
      if (Math.abs(dx) < 8) return;
      drag.moved = true;
      carousel.classList.add("dragging");
      try{ carousel.setPointerCapture(drag.id); }catch(err){}
    }
    const dt = e.timeStamp - drag.lastT;
    if (dt > 0){ drag.v = (e.clientX - drag.lastX) / dt; drag.lastX = e.clientX; drag.lastT = e.timeStamp; }
    pos = drag.p - dx / step;
    layout(pos);
  });
  function endDrag(){
    if (!drag) return;
    const d = drag; drag = null;
    carousel.classList.remove("dragging");
    if (!d.moved) return;
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    const carry = Math.max(-2, Math.min(2, -d.v * 220 / step));   // a quick flick carries further
    goTo(pos + carry);
  }
  carousel.addEventListener("pointerup", endDrag);
  carousel.addEventListener("pointercancel", endDrag);
  carousel.addEventListener("click", e => {
    if (suppressClick) return;
    const k = cardEls.indexOf(e.target.closest(".ccard"));
    if (k < 0) return;
    const d = mod(k - Math.round(pos) + N / 2) - N / 2;
    if (d === 0) perform(); else goTo(Math.round(pos) + d);
  });

  const nudge = dir => goTo(Math.round(pos) + dir);
  $("#prevBtn").addEventListener("click", () => nudge(-1));
  $("#nextBtn").addEventListener("click", () => nudge(1));

  LETTERS.forEach(([L, , , color], k) => {
    const b = document.createElement("button");
    b.className = "thumb abc chunky";
    b.textContent = L;
    b.setAttribute("aria-label", `Letter ${L}`);
    b.style.setProperty("--c", color);
    b.addEventListener("click", () => {
      const d = mod(k - Math.round(pos) + N / 2) - N / 2;
      if (d !== 0) goTo(Math.round(pos) + d, false);
      perform();
    });
    $("#grid").appendChild(b);
  });
  function updateShelf(){
    [...$("#grid").children].forEach((b, k) => {
      b.setAttribute("aria-current", k === i);
      b.classList.toggle("seen", !!B.seen[LETTERS[k][0]]);
    });
    const n = LETTERS.filter(l => B.seen[l[0]]).length;
    $("#shelfMeta").textContent = `★ ${n} of 26 seen`;
  }

  /* ================= Play ================= */
  // Two kinds of question: see a picture and pick its first letter,
  // or see a letter and pick the picture that starts with it.
  const CHOICE_COLORS = ["#FFB8C6", "#9FD3FF", "#FFE27A", "#B8F08A"];
  let bag = [], q = null, streak = 0, locked = false;

  function draw(){
    if (!bag.length) bag = shuffle(LETTERS.map((_, k) => k));
    let k = bag.pop();
    if (q && k === q.k && bag.length){ bag.unshift(k); k = bag.pop(); }
    return k;
  }

  function newRound(){
    const k = draw();
    const n = S.choices === 4 ? 4 : 3;
    const others = shuffle(LETTERS.map((_, j) => j).filter(j => j !== k)).slice(0, n - 1);
    q = { k, type:Math.random() < .5 ? "letter" : "picture", opts:shuffle([k, ...others]) };
    locked = false;

    const [L, word, emoji, color] = LETTERS[k];
    const prompt = $("#prompt");
    prompt.style.setProperty("--c", color);
    prompt.innerHTML = "";
    const add = (cls, text) => {
      const s = document.createElement("span");
      s.className = cls; if (text != null) s.textContent = text;
      prompt.appendChild(s); return s;
    };
    if (q.type === "letter"){
      add("pe", emoji).setAttribute("aria-hidden", "true");
      const w = add("pw");
      w.id = "qWord";
      const blank = document.createElement("span");
      blank.className = "blank"; blank.textContent = "?";
      w.append(blank, word.slice(1));
      add("ph", "What letter does it start with? Tap to hear it again.");
      prompt.setAttribute("aria-label", `${word}. What letter does it start with?`);
    } else {
      add("pl", shown(L));
      add("ph", "Which picture starts with this letter? Tap to hear it again.");
      prompt.setAttribute("aria-label", `Which picture starts with the letter ${L}?`);
    }

    const box = $("#choices");
    box.className = "choices" + (n === 4 ? " four" : "");
    box.innerHTML = "";
    q.opts.forEach((j, pos) => {
      const [oL, oWord, oEmoji] = LETTERS[j];
      const b = document.createElement("button");
      b.className = "choice chunky" + (q.type === "picture" ? " pic" : "");
      b.style.setProperty("--c", CHOICE_COLORS[pos % CHOICE_COLORS.length]);
      b.textContent = q.type === "letter" ? shown(oL) : oEmoji;
      b.setAttribute("aria-label", q.type === "letter" ? `Letter ${oL}` : oWord);
      b.addEventListener("click", () => choose(j, b));
      box.appendChild(b);
    });
    $("#msg").textContent = "";
    ask();
  }

  function ask(){
    const [L, word] = LETTERS[q.k];
    speech.say(q.type === "letter"
      ? `${word}. What letter does ${word} start with?`
      : `Find the picture that starts with the letter ${L}.`);
  }

  function updateScore(){
    $("#stars").textContent = B.stars;
    $("#streak").textContent = streak;
  }

  async function choose(j, btn){
    if (locked) return;
    const [L, word, emoji, , sound] = LETTERS[q.k];
    if (j !== q.k){
      streak = 0; updateScore();
      btn.classList.add("wrong"); btn.disabled = true;
      $("#msg").textContent = "Try again!";
      if (S.sfx) Sfx.play("oops");
      buzz([25, 40, 25]);
      speech.say("Try again.");
      return;
    }
    locked = true;
    stopAll();
    const mine = run;
    streak++; B.stars++;
    if (streak > B.best) B.best = streak;
    save(); updateScore();
    btn.classList.add("right");
    [...$("#choices").children].forEach(b => { b.disabled = true; });
    const w = $("#qWord");
    if (w) wordWithFirst(w, word);
    if (q.type === "picture"){
      const big = $("#prompt .pl");
      if (big) big.textContent = `${shown(L)} ${emoji}`;
    }
    $("#msg").textContent = `Yes! ${L} is for ${word}!`;
    if (S.sfx) Sfx.play("cheer");
    buzz(20);
    if (streak % 5 === 0) setTimeout(() => celebrate(`${streak} in a row!`), 400);
    await wait(450);
    if (mine !== run) return;
    await speech.say(`Yes! ${L} is for ${word}.`);
    if (mine !== run) return;
    if (sound && S.sfx){ Sfx.play(sound); await wait(1200); }
    else await wait(600);
    if (mine === run && B.mode === "play") newRound();
  }

  $("#prompt").addEventListener("click", () => { if (q && !locked) ask(); });

  /* ================= Modes and settings ================= */
  function setMode(mode){
    stopAll();
    B.mode = mode; save();
    const learn = mode === "learn";
    $("#learn").hidden = !learn;
    $("#play").hidden = learn;
    $("#learnTab").setAttribute("aria-pressed", learn);
    $("#playTab").setAttribute("aria-pressed", !learn);
    if (learn){ show(); if (S.autoplay) perform(); }
    else { streak = 0; updateScore(); newRound(); }
  }
  $("#learnTab").addEventListener("click", () => { if (B.mode !== "learn") setMode("learn"); });
  $("#playTab").addEventListener("click", () => { if (B.mode !== "play") setMode("play"); });

  document.addEventListener("keydown", e => {
    if ($("#settings").open || B.mode !== "learn" || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === "ArrowRight"){ e.preventDefault(); nudge(1); }
    else if (e.key === "ArrowLeft"){ e.preventDefault(); nudge(-1); }
  });

  PT.setupFullscreen($("#fsBtn"));
  PT.settingsSheet($("#settings"), $("#setBtn"), key => {
    if (key === "voice" && !S.voice) speech.cancel();
    if (key === "sfx" && !S.sfx) Sfx.stop();
    if ((key === "choices" || key === "letterCase") && B.mode === "play" && !locked) newRound();
  });
  PT.twoTap($("#resetBtn"), "Tap again to clear", () => {
    B.stars = 0; B.best = 0; B.seen = {}; B.doneLearn = false; streak = 0;
    save(); updateScore(); updateShelf();
    toast("Stars and stickers cleared");
  });

  // Start without speaking: browsers block audio until the first tap.
  const startMode = B.mode === "play" ? "play" : "learn";
  B.mode = startMode;
  $("#learn").hidden = startMode !== "learn";
  $("#play").hidden = startMode !== "play";
  $("#learnTab").setAttribute("aria-pressed", startMode === "learn");
  $("#playTab").setAttribute("aria-pressed", startMode === "play");
  updateScore();
  if (startMode === "learn") show(); else newRound();
})();
