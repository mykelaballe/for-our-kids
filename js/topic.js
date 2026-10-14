(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast } = PT;
  const TOPIC = document.body.dataset.topic === "numbers" ? "numbers" : "colors";   // set on <body> by each page
  const S = data.settings, B = data[TOPIC];
  let run = 0;

  /* One list per topic, all shaped the same so Learn and Play can treat them alike. */
  const TOPICS = {
    colors:{
      label:"colors", celebrate:"You know all the colors!",
      items: COLORS.map(([id, name, hex, bg, emoji, like]) => ({
        key:"c:" + id, name, bg, hex, emoji,
        hero:`<span class="swatch" style="--s:${hex}"><span>${emoji}</span></span>`,
        fact:`${name}, like ${like}!`,
        thumb:`<span class="sw" style="--s:${hex}"></span>`
      }))
    },
    numbers:{
      label:"numbers", celebrate:"You can count to ten!",
      items: NUMBERS.map(([n, name, emoji, one, many, bg]) => ({
        key:"n:" + n, name, bg, n, emoji, one, many,
        hero:`<span class="num">${n}</span><span class="dots">${`<span>${emoji}</span>`.repeat(n)}</span>`,
        fact:`${n} ${n === 1 ? one : many}!`,
        thumb:String(n)
      }))
    }
  };
  const topic = () => TOPIC;
  const T = () => TOPICS[topic()];
  const list = () => T().items;
  const stopAll = () => { run++; speech.cancel(); Sfx.stop(); };

  /* ================= Play ================= */
  const CHOICE_COLORS = ["#FFB8C6", "#9FD3FF", "#FFE27A", "#B8F08A"];
  let bag = [], q = null, streak = 0, locked = false;

  function draw(){
    if (!bag.length) bag = shuffle(list().map((_, k) => k));
    let k = bag.pop();
    if (q && k === q.k && bag.length){ bag.unshift(k); k = bag.pop(); }
    return k;
  }

  // Colors:  "name"  see a color, pick its name      "color" read a name, pick the color
  // Numbers: "count" count the things, pick the number   "find" read a number word, pick the number
  function newRound(){
    const t = topic();
    const k = draw();
    const n = S.choices === 4 ? 4 : 3;
    const others = shuffle(list().map((_, j) => j).filter(j => j !== k)).slice(0, n - 1);
    const type = t === "colors" ? (Math.random() < .5 ? "name" : "color") : (Math.random() < .6 ? "count" : "find");
    q = { k, type, opts:shuffle([k, ...others]) };
    locked = false;

    const it = list()[k];
    const prompt = $("#prompt");
    prompt.style.setProperty("--c", it.bg);
    prompt.innerHTML = "";
    const add = (cls, html) => {
      const s = document.createElement("span");
      s.className = cls; if (html != null) s.innerHTML = html;
      prompt.appendChild(s); return s;
    };
    if (type === "name"){
      add("swatch plain").style.setProperty("--s", it.hex);
      add("ph", "What color is this? Tap to hear it again.");
    } else if (type === "color"){
      add("pw").textContent = it.name;
      add("ph", "Find this color. Tap to hear it again.");
    } else if (type === "count"){
      add("cnt", `<span>${it.emoji}</span>`.repeat(it.n)).setAttribute("aria-hidden", "true");
      add("ph", "How many are there? Tap to hear it again.");
    } else {
      add("pw").textContent = it.name;
      add("ph", "Find this number. Tap to hear it again.");
    }
    prompt.setAttribute("aria-label", promptText());

    const box = $("#choices");
    box.className = "choices" + (type === "name" ? " list" : n === 4 ? " four" : "");
    box.innerHTML = "";
    q.opts.forEach((j, pos) => {
      const o = list()[j];
      const b = document.createElement("button");
      b.setAttribute("aria-label", o.name);
      if (type === "name"){
        b.className = "choice chunky";
        b.style.setProperty("--c", CHOICE_COLORS[pos % CHOICE_COLORS.length]);
        b.textContent = o.name;
      } else if (type === "color"){
        b.className = "choice chunky sw";
        b.style.setProperty("--c", o.hex);
      } else {
        b.className = "choice chunky";
        b.style.setProperty("--c", CHOICE_COLORS[pos % CHOICE_COLORS.length]);
        b.textContent = o.n;
      }
      b.addEventListener("click", () => choose(j, b));
      box.appendChild(b);
    });
    $("#msg").textContent = "";
    ask();
  }

  function promptText(){
    const it = list()[q.k];
    return q.type === "name" ? "What color is this?"
         : q.type === "color" ? `Find ${it.name.toLowerCase()}.`
         : q.type === "count" ? "How many are there? Let's count."
         : `Find the number ${it.n}.`;
  }
  async function ask(){
    const mine = run;
    if (q.type === "count"){
      // Count along with the picture so a pre-reader hears the answer being built.
      await speech.say("How many are there? Let's count.");
      const dots = [...document.querySelectorAll("#prompt .cnt span")];
      for (let k = 0; k < dots.length; k++){
        if (mine !== run || locked) return;
        dots[k].classList.remove("on"); void dots[k].offsetWidth; dots[k].classList.add("on");
        if (S.sfx) Sfx.play("pop");
        if (S.voice){ if (!(await speech.say(String(k + 1)))) return; }
        else await wait(420);
      }
      return;
    }
    speech.say(promptText());
  }

  function updateScore(){
    $("#stars").textContent = B.stars;
    $("#streak").textContent = streak;
  }

  async function choose(j, btn){
    if (locked) return;
    const it = list()[q.k];
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
    const line = topic() === "colors" ? `Yes! It's ${it.name.toLowerCase()}!` : `Yes! ${it.n} ${it.n === 1 ? it.one : it.many}!`;
    $("#msg").textContent = line;
    if (S.sfx) Sfx.play("cheer");
    buzz(20);
    if (streak % 5 === 0) setTimeout(() => celebrate(`${streak} in a row!`), 400);
    await wait(450);
    if (mine !== run) return;
    await speech.say(line);
    if (mine !== run) return;
    await wait(600);
    if (mine === run && sw.current === "quiz") newRound();
  }

  $("#prompt").addEventListener("click", () => { if (q && !locked) { stopAll(); ask(); } });


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
    B.stars = 0; B.best = 0; B.seen = {}; B.done = 0; streak = 0;
    save(); updateScore();
    document.dispatchEvent(new CustomEvent("progress-reset"));
    toast("Stars and stickers cleared");
  });
  // Start without speaking: browsers block audio until the first tap.
  updateScore();
  sw.set(B.mode === "quiz" || B.mode === "game" ? B.mode : "learn");
})();
