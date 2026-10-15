/* Shared helpers for every Play Time page.
   Plain scripts (no modules) so the pages open straight from disk with a double-click. */
const PT = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const shuffle = arr => {
    for (let k = arr.length - 1; k > 0; k--){
      const j = Math.floor(Math.random() * (k + 1));
      [arr[k], arr[j]] = [arr[j], arr[k]];
    }
    return arr;
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const buzz = pattern => { try{ navigator.vibrate && navigator.vibrate(pattern); }catch(e){} };

  /* ---------- Saved settings and progress (this device only) ---------- */
  const KEY = "playtime.v2";
  const DEFAULTS = {
    settings:{ theme:"system", voice:true, sfx:true, words:true, autoplay:true, choices:3, letterCase:"upper" },
    animals:{ group:"farm", seen:{}, done:{} },
    abc:{ mode:"learn", last:0, stars:0, best:0, seen:{}, doneLearn:false },
    shapes:{ mode:"learn", last:0, stars:0, best:0, seen:{}, doneLearn:false },
    colors:{ mode:"learn", last:0, stars:0, best:0, seen:{}, done:0 },
    numbers:{ mode:"learn", last:0, stars:0, best:0, seen:{}, done:0 },
    timer:{ endsAt:0, total:0 },
    memory:{ level:"easy", theme:"animals", best:{}, wins:0 },
    maze:{ level:"easy", wins:0, won:{} }
  };
  // Fill in anything missing from what was saved, keeping the saved values.
  function merge(def, saved){
    if (def && typeof def === "object" && !Array.isArray(def)){
      const src = saved && typeof saved === "object" ? saved : {};
      if (!Object.keys(def).length) return { ...src };   // open-ended maps like "seen"
      const out = {};
      for (const k of Object.keys(def)) out[k] = merge(def[k], src[k]);
      return out;
    }
    return typeof saved === typeof def ? saved : def;
  }
  let saved = null;
  try{ saved = JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  const data = merge(DEFAULTS, saved);
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){} };

  /* ---------- Speech: picks the friendliest English voice available ---------- */
  const speech = (() => {
    const ok = "speechSynthesis" in window;
    const PREFERRED = ["Samantha", "Karen", "Moira", "Tessa", "Google US English", "Google UK English Female",
                       "Microsoft Aria", "Microsoft Jenny", "Microsoft Zira"];
    let voice = null, token = 0;
    function choose(){
      const all = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
      voice = PREFERRED.map(n => all.find(v => v.name.includes(n))).find(Boolean)
           || all.find(v => v.default) || all[0] || null;
    }
    if (ok){
      choose();
      if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", choose);
    }
    function cancel(){ token++; if (ok) speechSynthesis.cancel(); }
    // Resolves true when finished, false if something newer interrupted it.
    function say(text){
      cancel();
      const mine = token;
      if (!ok || !data.settings.voice || !text) return Promise.resolve(true);
      return new Promise(resolve => {
        const u = new SpeechSynthesisUtterance(text);
        if (voice){ u.voice = voice; u.lang = voice.lang; } else u.lang = "en-US";
        u.rate = 0.82; u.pitch = 1.15;
        let done = false;
        const finish = () => { if (!done){ done = true; resolve(mine === token); } };
        u.onend = finish; u.onerror = finish;
        setTimeout(finish, 1500 + text.length * 110);   // some browsers never fire onend
        speechSynthesis.speak(u);
      });
    }
    return { say, cancel };
  })();

  /* ---------- Screen: full screen button, keep the screen awake, unlock audio ---------- */
  function setupFullscreen(btn){
    if (!btn) return;
    const el = document.documentElement;
    const enter = el.requestFullscreen || el.webkitRequestFullscreen;
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (!enter){ btn.hidden = true; return; }
    btn.addEventListener("click", () => {
      const on = document.fullscreenElement || document.webkitFullscreenElement;
      try{ on ? exit.call(document) : enter.call(el); }catch(e){}
    });
  }
  let wakeLock = null;
  async function keepAwake(){
    if (wakeLock || !("wakeLock" in navigator)) return;
    try{
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    }catch(e){}
  }
  document.addEventListener("pointerdown", () => {
    keepAwake();
    if (typeof Sfx !== "undefined") Sfx.unlock();
  }, { passive:true });

  /* ---------- Grown-ups settings sheet ---------- */
  function settingsSheet(dialog, openBtn, onChange){
    if (!dialog || !openBtn) return;
    openBtn.addEventListener("click", () => {
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
    });
    const close = () => { if (dialog.close) dialog.close(); else dialog.removeAttribute("open"); };
    dialog.addEventListener("click", e => { if (e.target === dialog) close(); });   // tap outside
    dialog.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", close));
    dialog.querySelectorAll("input[data-setting]").forEach(input => {
      const key = input.dataset.setting;
      if (input.type === "checkbox") input.checked = !!data.settings[key];
      else input.checked = String(data.settings[key]) === input.value;
      input.addEventListener("change", () => {
        if (input.type === "checkbox") data.settings[key] = input.checked;
        else if (input.checked){
          data.settings[key] = typeof DEFAULTS.settings[key] === "number" ? Number(input.value) : input.value;
        }
        save();
        if (key === "theme") applyTheme();
        if (onChange) onChange(key);
      });
    });
  }

  // A button that needs a second tap within 3 seconds, for things that can't be undone.
  function twoTap(btn, armedLabel, action){
    const label = btn.textContent;
    let timer = null;
    btn.addEventListener("click", () => {
      if (!btn.classList.contains("armed")){
        btn.classList.add("armed"); btn.textContent = armedLabel;
        timer = setTimeout(() => { btn.classList.remove("armed"); btn.textContent = label; }, 3000);
        return;
      }
      clearTimeout(timer);
      btn.classList.remove("armed"); btn.textContent = label;
      action();
    });
  }

  /* ---------- Celebrations ---------- */
  function toast(text){
    document.querySelectorAll(".badge").forEach(b => b.remove());
    const b = document.createElement("div");
    b.className = "badge"; b.setAttribute("role", "status"); b.textContent = text;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 2500);
  }
  function confetti(){
    if (reduceMotion) return;
    const c = document.createElement("canvas");
    c.className = "confetti"; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    const colors = ["#F2994A", "#F2C94C", "#6FCF97", "#56CCF2", "#BB6BD9", "#EB5757", "#FF8FB1"];
    const bits = Array.from({ length:150 }, () => ({
      x:W / 2 + (Math.random() - .5) * 120, y:H * .42,
      vx:(Math.random() - .5) * 16, vy:-Math.random() * 15 - 5,
      s:7 + Math.random() * 8, r:Math.random() * 6, vr:(Math.random() - .5) * .35,
      c:colors[Math.floor(Math.random() * colors.length)]
    }));
    const start = performance.now(), LIFE = 2300;
    (function frame(now){
      const t = now - start;
      g.clearRect(0, 0, W, H);
      g.globalAlpha = Math.max(0, 1 - t / LIFE);
      for (const p of bits){
        p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r);
        g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        g.restore();
      }
      if (t < LIFE) requestAnimationFrame(frame); else c.remove();
    })(start);
  }
  function celebrate(text){
    if (text) toast(text);
    confetti();
    if (typeof Sfx !== "undefined" && data.settings.sfx) Sfx.play("tada");
    buzz([30, 60, 30]);
  }

  /* ---------- Light and dark mode ----------
     "system" follows the device. The toggle button picks light or dark and remembers it. */
  const root = document.documentElement;
  const darkQuery = matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => root.dataset.theme === "dark" || (root.dataset.theme !== "light" && darkQuery.matches);
  function applyTheme(){
    const t = data.settings.theme;
    if (t === "light" || t === "dark") root.dataset.theme = t; else delete root.dataset.theme;
    const dark = isDark();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#1C1828" : "#FFF8EC";
    document.querySelectorAll("[data-theme-toggle]").forEach(b => {
      b.classList.toggle("is-dark", dark);
      b.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    });
    document.querySelectorAll('input[data-setting="theme"]').forEach(i => { i.checked = i.value === t; });
  }
  document.querySelectorAll("[data-theme-toggle]").forEach(b => b.addEventListener("click", () => {
    data.settings.theme = isDark() ? "light" : "dark";
    save(); applyTheme();
  }));
  if (darkQuery.addEventListener) darkQuery.addEventListener("change", applyTheme);
  applyTheme();

  /* ---------- Modes: each game page offers a few ways to play, shown as tabs ----------
     A page registers modeDefs.<name> = { enter(), leave() } for each mode. The matching
     section is <div id="mode-<name>"> and the matching tab is <button data-mode="<name>">. */
  const modeDefs = {};
  function modeSwitcher(store){
    const names = Object.keys(modeDefs);
    let cur = null;
    function set(name){
      if (!modeDefs[name]) name = names[0];
      if (cur && modeDefs[cur].leave) modeDefs[cur].leave();
      speech.cancel(); if (typeof Sfx !== "undefined") Sfx.stop();
      cur = name; store.mode = name; save();
      names.forEach(n => {
        const sec = document.getElementById("mode-" + n);
        if (sec) sec.hidden = n !== name;
        const chip = document.querySelector(`[data-mode="${n}"]`);
        if (chip) chip.setAttribute("aria-pressed", n === name);
      });
      if (modeDefs[name].enter) modeDefs[name].enter();
    }
    document.querySelectorAll("[data-mode]").forEach(c =>
      c.addEventListener("click", () => { if (c.dataset.mode !== cur) set(c.dataset.mode); }));
    return { set, get current(){ return cur; } };
  }

  return { $, wait, shuffle, modeDefs, modeSwitcher, reduceMotion, buzz, data, save, speech,
           setupFullscreen, settingsSheet, twoTap, toast, celebrate };
})();
