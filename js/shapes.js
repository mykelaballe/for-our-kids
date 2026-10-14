(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast } = PT;
  const S = data.settings, B = data.shapes;
  let run = 0;

  const stopAll = () => { run++; speech.cancel(); Sfx.stop(); };
  const article = name => /^[aeiou]/i.test(name) ? "an" : "a";

  /* ================= Play ================= */
  // Two kinds of question: see a shape and pick its name,
  // or read a name and pick the matching shape.
  const CHOICE_COLORS = ["#FFB8C6", "#9FD3FF", "#FFE27A", "#B8F08A"];
  let bag = [], q = null, streak = 0, locked = false;

  function draw(){
    if (!bag.length) bag = shuffle(SHAPES.map((_, k) => k));
    let k = bag.pop();
    if (q && k === q.k && bag.length){ bag.unshift(k); k = bag.pop(); }
    return k;
  }

  function newRound(){
    const k = draw();
    const n = S.choices === 4 ? 4 : 3;
    const others = shuffle(SHAPES.map((_, j) => j).filter(j => j !== k)).slice(0, n - 1);
    q = { k, type:Math.random() < .5 ? "name" : "picture", opts:shuffle([k, ...others]) };
    locked = false;

    const [id, name, , bg, fill] = SHAPES[k];
    const prompt = $("#prompt");
    prompt.style.setProperty("--c", bg);
    prompt.innerHTML = "";
    const add = (cls, html) => {
      const s = document.createElement("span");
      s.className = cls; if (html != null) s.innerHTML = html;
      prompt.appendChild(s); return s;
    };
    if (q.type === "name"){
      add("ps", shapeSvg(id, fill));
      add("ph", "What shape is this? Tap to hear it again.");
      prompt.setAttribute("aria-label", "What shape is this?");
    } else {
      add("pw").textContent = name;
      add("ph", "Find this shape. Tap to hear it again.");
      prompt.setAttribute("aria-label", `Find the ${name}.`);
    }

    const box = $("#choices");
    box.className = "choices" + (q.type === "name" ? " list" : n === 4 ? " four" : "");
    box.innerHTML = "";
    q.opts.forEach((j, pos) => {
      const [oid, oname, , , ofill] = SHAPES[j];
      const b = document.createElement("button");
      b.className = "choice chunky" + (q.type === "picture" ? " shape" : "");
      b.style.setProperty("--c", CHOICE_COLORS[pos % CHOICE_COLORS.length]);
      if (q.type === "name") b.textContent = oname; else b.innerHTML = shapeSvg(oid, ofill);
      b.setAttribute("aria-label", oname);
      b.addEventListener("click", () => choose(j, b));
      box.appendChild(b);
    });
    $("#msg").textContent = "";
    ask();
  }

  function ask(){
    const [, name] = SHAPES[q.k];
    speech.say(q.type === "name" ? "What shape is this?" : `Find the ${name}.`);
  }

  function updateScore(){
    $("#stars").textContent = B.stars;
    $("#streak").textContent = streak;
  }

  async function choose(j, btn){
    if (locked) return;
    const [, name, fact] = SHAPES[q.k];
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
    $("#msg").textContent = `Yes! It's ${article(name)} ${name.toLowerCase()}!`;
    if (S.sfx) Sfx.play("cheer");
    buzz(20);
    if (streak % 5 === 0) setTimeout(() => celebrate(`${streak} in a row!`), 400);
    await wait(450);
    if (mine !== run) return;
    await speech.say(`Yes! It's ${article(name)} ${name}.`);
    if (mine !== run) return;
    await wait(600);
    if (mine === run && sw.current === "quiz") newRound();
  }

  $("#prompt").addEventListener("click", () => { if (q && !locked) ask(); });


  /* ================= Quiz tab ================= */
  PT.modeDefs.quiz = {
    enter(){ streak = 0; updateScore(); bag = []; q = null; newRound(); },
    leave(){ stopAll(); }
  };
  const sw = PT.modeSwitcher(B);
  PT.setupFullscreen($("#fsBtn"));
  PT.settingsSheet($("#settings"), $("#setBtn"), key => {
    if (key === "voice" && !S.voice) speech.cancel();
    if (key === "sfx" && !S.sfx) Sfx.stop();
    if (key === "choices" && sw.current === "quiz" && !locked) newRound();
  });
  PT.twoTap($("#resetBtn"), "Tap again to clear", () => {
    B.stars = 0; B.best = 0; B.seen = {}; B.doneLearn = false; streak = 0;
    save(); updateScore();
    document.dispatchEvent(new CustomEvent("progress-reset"));
    toast("Stars and stickers cleared");
  });
  updateScore();
  sw.set(B.mode === "quiz" || B.mode === "game" ? B.mode : "learn");
})();
