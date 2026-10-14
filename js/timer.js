/* Play timer. A grown-up picks how long the kids can play. When the time is up a full-screen
   cover blocks the whole page until a grown-up solves a small sum and adds time or stops the timer.
   The end time is saved, so reloading or switching games doesn't get around it. */
(() => {
  const { data, save, speech, toast } = PT;
  const T = data.timer;
  const DURATIONS = [5, 10, 15, 20, 30, 45, 60];
  const bar = document.querySelector(".bar");
  if (!bar) return;

  const left = () => T.endsAt ? T.endsAt - Date.now() : Infinity;
  const fmt = ms => {
    const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
    const pad = n => String(n).padStart(2, "0");
    return h ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
  };
  const stopSound = () => { speech.cancel(); if (typeof Sfx !== "undefined") Sfx.stop(); };

  /* ---------- the button in the top bar, with the time left ---------- */
  const btn = document.createElement("button");
  btn.className = "icon-btn timer-btn";
  btn.innerHTML =
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h12M6 22h12M7 2c0 5 5 6 5 10s-5 5-5 10M17 2c0 5-5 6-5 10s5 5 5 10"/></svg>` +
    `<span class="t" aria-hidden="true"></span>`;
  const anchor = bar.querySelector("[data-theme-toggle]");
  bar.insertBefore(btn, anchor || bar.querySelector(".icon-btn:not(a)"));
  const label = btn.querySelector(".t");

  /* ---------- the sheet (set the timer / grown-up check) and the lock cover ---------- */
  const sheet = document.createElement("dialog");
  sheet.className = "sheet"; sheet.setAttribute("aria-labelledby", "timerTitle");
  sheet.innerHTML = `<div class="sheet-in" id="timerBody"></div>`;
  const body = sheet.firstChild;
  document.body.appendChild(sheet);
  sheet.addEventListener("click", e => { if (e.target === sheet) sheet.close(); });

  const cover = document.createElement("div");
  cover.className = "timelock"; cover.hidden = true;
  cover.setAttribute("role", "alertdialog"); cover.setAttribute("aria-labelledby", "lockTitle");
  cover.innerHTML =
    `<div class="timelock-in"><div class="moon" aria-hidden="true">🌙</div>` +
    `<h2 id="lockTitle">Time's up!</h2>` +
    `<p>Great playing! See you next time.</p>` +
    `<button class="btn quiet" id="lockOpen">Grown-ups</button></div>`;
  document.body.appendChild(cover);
  cover.querySelector("#lockOpen").addEventListener("click", () => openSheet());

  const openDialog = () => { if (sheet.showModal) sheet.showModal(); else sheet.setAttribute("open", ""); };
  const closeDialog = () => { if (sheet.close) sheet.close(); else sheet.removeAttribute("open"); };
  const closers = () => body.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", closeDialog));

  /* ---------- views ---------- */
  function showGate(next){
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    body.innerHTML =
      `<h2 id="timerTitle">Grown-ups only</h2>` +
      `<p class="note">Solve this to continue.</p>` +
      `<label class="gate-q" for="gateIn">What is ${a} × ${b}?</label>` +
      `<input id="gateIn" class="gate-in" type="number" inputmode="numeric" autocomplete="off">` +
      `<p class="gate-err" id="gateErr" aria-live="polite"></p>` +
      `<div class="sheet-actions"><button class="btn quiet" data-close>Cancel</button><button class="btn" id="gateOk">Continue</button></div>`;
    closers();
    const input = body.querySelector("#gateIn");
    const check = () => {
      if (Number(input.value) === a * b && input.value !== "") next();
      else { showGate(next); body.querySelector("#gateErr").textContent = "Not quite. Try a new one."; }
    };
    body.querySelector("#gateOk").addEventListener("click", check);
    input.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
    setTimeout(() => input.focus(), 50);
  }

  function showSet(){
    const active = !!T.endsAt, l = left();
    const status = !active ? "Off. Pick how long they can play."
                 : l > 0 ? `${fmt(l)} left. Pick a time to start over.` : "Time is up. Pick more time, or stop the timer.";
    body.innerHTML =
      `<h2 id="timerTitle">Play timer</h2><p class="note">${status}</p>` +
      `<div class="dur" role="group" aria-label="Play time">` +
      DURATIONS.map(m => `<button class="chip" data-min="${m}">${m} min</button>`).join("") + `</div>` +
      `<div class="sheet-actions">${active ? `<button class="btn quiet" id="tStop">Stop timer</button>` : `<span></span>`}` +
      `<button class="btn" data-close>Done</button></div>`;
    closers();
    body.querySelectorAll("[data-min]").forEach(b => b.addEventListener("click", () => start(Number(b.dataset.min))));
    const stop = body.querySelector("#tStop");
    if (stop) stop.addEventListener("click", () => { clear(); closeDialog(); toast("Timer stopped"); });
  }

  // A grown-up check protects an existing timer. Setting one from scratch needs none.
  function openSheet(){
    if (T.endsAt) showGate(showSet); else showSet();
    openDialog();
  }
  btn.addEventListener("click", openSheet);

  /* ---------- running the timer ---------- */
  let locked = false, warned = false;

  // While locked, games that are still mid-sentence must not talk or play sounds.
  const realSay = speech.say; let realPlay = null;
  function mute(on){
    speech.say = on ? () => Promise.resolve(false) : realSay;
    if (typeof Sfx !== "undefined"){
      if (!realPlay) realPlay = Sfx.play;
      Sfx.play = on ? () => {} : realPlay;
    }
  }

  function start(min){
    T.total = min; T.endsAt = Date.now() + min * 60000; warned = false;
    save(); unlock(); closeDialog(); tick();
    toast(`Timer set: ${min} minutes`);
  }
  function clear(){ T.endsAt = 0; T.total = 0; save(); unlock(); tick(); }

  function lock(){
    if (locked || sheet.open) return;     // never cut off a grown-up who is in the timer sheet
    locked = true;
    mute(true);
    stopSound();
    document.querySelectorAll("dialog[open]").forEach(d => { if (d !== sheet) d.close(); });
    cover.hidden = false;
    // Nothing behind the cover can be clicked, tabbed to or read by a screen reader.
    [...document.body.children].forEach(el => {
      if (el !== cover && el !== sheet && el.tagName !== "SCRIPT") el.inert = true;
    });
    cover.querySelector("#lockOpen").focus();
  }
  function unlock(){
    locked = false; mute(false); cover.hidden = true;
    [...document.body.children].forEach(el => { el.inert = false; });
  }

  function tick(){
    const l = left();
    btn.classList.toggle("on", !!T.endsAt);
    btn.setAttribute("aria-label", T.endsAt ? (l > 0 ? `Play timer, ${fmt(l)} left` : "Play timer, time is up") : "Set a play timer");
    label.textContent = T.endsAt ? fmt(l) : "";
    if (T.endsAt && l > 0 && l <= 60000 && !warned){
      warned = true;
      toast("1 minute left!");
      if (typeof Sfx !== "undefined") Sfx.play("chime");
    }
    if (T.endsAt && l <= 0) lock();
  }

  warned = T.endsAt > 0 && left() <= 60000;
  setInterval(tick, 1000);
  document.addEventListener("visibilitychange", tick);
  tick();
})();
