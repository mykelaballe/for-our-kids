/* Counting Fun: two new ways to practice counting.
   Learn = a number train. Scroll it sideways, tap a wagon to count what it carries.
   Game  = feed a hungry hippo exactly the number of cookies it asks for. */
(() => {
  const { $, data, save, speech, wait, buzz, celebrate } = PT;
  const S = data.settings, B = data.numbers;
  let run = 0;
  const stopAll = () => { run++; speech.cancel(); Sfx.stop(); };
  const key = n => "n:" + n;

  function markSeen(n){
    if (!B.seen[key(n)]){
      B.seen[key(n)] = 1;
      if (!B.done && NUMBERS.every(x => B.seen[key(x[0])])){
        B.done = 1;
        setTimeout(() => celebrate("You can count to ten!"), 2200);
      }
    }
    save(); markWagons();
  }

  /* ================= Learn: number train ================= */
  const train = $("#train");
  const WAGON_COLORS = ["#FFB8C6", "#FFE27A", "#9FD3FF", "#B8F08A", "#FFC9A3", "#D9C6EF", "#9FE0C9", "#FFD59A", "#A8E4F2", "#F7D0DF"];
  train.innerHTML = `<div class="engine" aria-hidden="true"><span class="e-face">🚂</span></div>`;
  NUMBERS.forEach(([n, name, emoji], k) => {
    const w = document.createElement("button");
    w.className = "wagon chunky"; w.dataset.n = n;
    w.style.setProperty("--c", WAGON_COLORS[k % WAGON_COLORS.length]);
    w.setAttribute("aria-label", `Wagon ${n}, ${name}`);
    w.innerHTML =
      `<span class="wn">${n}</span><span class="wname">${name}</span>` +
      `<span class="wdots" aria-hidden="true">${`<span>${emoji}</span>`.repeat(n)}</span>` +
      `<span class="wheel l"></span><span class="wheel r"></span>`;
    w.addEventListener("click", () => countWagon(w));
    train.appendChild(w);
  });
  const wagons = () => [...train.querySelectorAll(".wagon")];
  function markWagons(){
    wagons().forEach(w => w.classList.toggle("seen", !!B.seen[key(w.dataset.n)]));
  }
  const center = el => el.scrollIntoView({ behavior:PT.reduceMotion ? "auto" : "smooth", inline:"center", block:"nearest" });

  async function countWagon(w){
    stopAll();
    const mine = run, n = Number(w.dataset.n), [, name, , one, many] = NUMBERS[n - 1];
    wagons().forEach(x => x.classList.remove("hi"));
    w.classList.add("hi"); center(w);
    markSeen(n);
    await speech.say(name);
    if (mine !== run) return;
    const dots = [...w.querySelectorAll(".wdots span")];
    for (let k = 0; k < dots.length; k++){
      if (mine !== run) return;
      dots[k].classList.remove("on"); void dots[k].offsetWidth; dots[k].classList.add("on");
      if (S.sfx) Sfx.play("pop");
      if (S.voice){ if (!(await speech.say(String(k + 1))) || mine !== run) return; }
      else await wait(420);
    }
    await wait(200);
    if (mine === run) speech.say(`${n} ${n === 1 ? one : many}!`);
  }

  // "All aboard": the train rolls past each wagon in turn, saying every number.
  async function ride(){
    stopAll();
    const mine = run, btn = $("#rideBtn");
    btn.disabled = true;
    if (S.sfx) Sfx.play("whoosh");
    await speech.say("All aboard! Choo choo!");
    for (const w of wagons()){
      if (mine !== run) break;
      wagons().forEach(x => x.classList.remove("hi"));
      w.classList.add("hi"); center(w); markSeen(Number(w.dataset.n));
      if (S.sfx) Sfx.play("pop");
      const spoke = await speech.say(NUMBERS[Number(w.dataset.n) - 1][1]);
      if (!spoke || mine !== run) break;
      await wait(S.voice ? 250 : 700);
    }
    btn.disabled = false;
    if (mine === run){
      wagons().forEach(x => x.classList.remove("hi"));
      celebrate("One to ten!");
    }
  }
  $("#rideBtn").addEventListener("click", ride);

  PT.modeDefs.learn = {
    enter(){ markWagons(); train.scrollLeft = 0; },
    leave(){ stopAll(); $("#rideBtn").disabled = false; wagons().forEach(x => x.classList.remove("hi")); }
  };

  /* ================= Game: feed the hippo ================= */
  const plate = $("#plate"), hippo = $("#hippo");
  let want = 0, fed = 0, prevWant = 0, locked = false;

  function hud(){
    $("#fstars").textContent = B.stars;
    $("#eaten").innerHTML = Array.from({ length:want }, (_, k) => `<span class="cookie-pip${k < fed ? " on" : ""}"></span>`).join("");
  }

  function newRound(){
    const mine = ++run;
    speech.cancel();
    do { want = 1 + Math.floor(Math.random() * 10); } while (want === prevWant);
    prevWant = want; fed = 0; locked = false;
    const [, name, , one, many] = NUMBERS[want - 1];
    $("#askNum").textContent = want;
    $("#askTxt").textContent = `${name} ${want === 1 ? "cookie" : "cookies"} please!`;
    $("#fmsg").textContent = "Tap the cookies to feed the hippo.";
    plate.innerHTML = "";
    for (let k = 0; k < 10; k++){
      const c = document.createElement("button");
      c.className = "cookie"; c.textContent = "🍪";
      c.setAttribute("aria-label", "Cookie");
      c.addEventListener("click", () => feed(c));
      plate.appendChild(c);
    }
    hud();
    speech.say(`I'm hungry! ${name} ${want === 1 ? "cookie" : "cookies"} please!`);
  }

  async function feed(c){
    if (locked || c.dataset.used || fed >= want) return;
    c.dataset.used = "1"; fed++; hud();
    const r = c.getBoundingClientRect(), h = hippo.getBoundingClientRect();
    const dx = h.left + h.width / 2 - (r.left + r.width / 2), dy = h.top + h.height * .62 - (r.top + r.height / 2);
    const a = c.animate(
      [{ transform:"none", opacity:1 }, { transform:`translate(${dx}px, ${dy}px) scale(.3) rotate(200deg)`, opacity:.15 }],
      { duration:PT.reduceMotion ? 1 : 420, easing:"ease-in", fill:"forwards" });
    a.onfinish = () => { c.style.visibility = "hidden"; };
    if (S.sfx) Sfx.play("pop");
    buzz(10);
    const mine = run;
    hippo.classList.remove("nom"); void hippo.offsetWidth; hippo.classList.add("nom");
    await speech.say(String(fed));
    if (mine !== run || fed < want) return;
    // fed exactly the right number
    locked = true;
    B.stars++; save(); markSeen(want); hud();
    const [, , , one, many] = NUMBERS[want - 1];
    $("#fmsg").textContent = `Yum! ${want} ${want === 1 ? "cookie" : "cookies"}!`;
    if (S.sfx) Sfx.play("cheer");
    hippo.classList.remove("happy"); void hippo.offsetWidth; hippo.classList.add("happy");
    await speech.say(`Yum! ${want} ${want === 1 ? "cookie" : "cookies"}. Thank you!`);
    if (mine !== run) return;
    await wait(900);
    if (mine === run) newRound();
  }

  PT.modeDefs.game = {
    enter(){ newRound(); },
    leave(){ stopAll(); }
  };

  document.addEventListener("progress-reset", () => { markWagons(); $("#fstars").textContent = B.stars; });
})();
