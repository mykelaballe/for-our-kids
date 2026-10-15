(() => {
  const { $, data, save, speech, buzz, celebrate, toast } = PT;
  const S = data.settings, D = data.dress;

  /* Friends: [emoji, name, background color] */
  const FRIENDS = [
    ["🐶", "Puppy", "#FFE9A8"], ["🐱", "Kitty", "#FFD3E4"], ["🐰", "Bunny", "#E3D0F7"], ["🐻", "Bear", "#E8D2B8"],
    ["🐼", "Panda", "#CFE3FF"], ["🦁", "Lion", "#FFDDB8"], ["🐵", "Monkey", "#C4EBCF"], ["🐸", "Frog", "#DDEFB5"],
    ["🐷", "Piggy", "#FFD0D8"], ["🦊", "Fox", "#FFF0A8"]
  ];
  /* Things to wear, by slot: [emoji, name, article] */
  const WEAR = {
    hat:[["👑", "crown", "a"], ["🎩", "top hat", "a"], ["🧢", "cap", "a"], ["🎓", "graduation cap", "a"], ["👒", "sun hat", "a"], ["🎀", "ribbon", "a"]],
    eyes:[["👓", "glasses", ""], ["🕶️", "sunglasses", ""], ["🥽", "goggles", ""]],
    neck:[["🧣", "scarf", "a"], ["👔", "tie", "a"], ["📿", "beads", ""], ["🏅", "medal", "a"], ["🌼", "flower", "a"]]
  };
  const SLOTS = Object.keys(WEAR);
  const CARD = ["#FFD0D0", "#FFF0A8", "#C4EBCF", "#CFE3FF", "#E3D0F7", "#FFDDB8"];

  const stage = $("#stage"), tray = $("#tray"), friendsEl = $("#friends");
  let slot = "hat";

  const friend = () => FRIENDS.find(f => f[0] === D.char) || FRIENDS[0];
  const phrase = ([, name, a]) => (a ? `${a} ${name}` : name);

  function renderStage(justWorn){
    const [emoji, , bg] = friend();
    stage.style.setProperty("--c", bg);
    stage.innerHTML = `<span class="who" aria-hidden="true">${emoji}</span>` +
      SLOTS.filter(s => D.outfit[s]).map(s =>
        `<span class="on-${s}${s === justWorn ? " worn" : ""}" aria-hidden="true">${D.outfit[s]}</span>`).join("");
    const bits = SLOTS.map(s => WEAR[s].find(w => w[0] === D.outfit[s])).filter(Boolean).map(phrase);
    $("#hint").textContent = bits.length ? `${friend()[1]} is wearing ${bits.join(", ").replace(/, ([^,]*)$/, " and $1")}!` : `Dress up ${friend()[1]}!`;
    stage.setAttribute("aria-label", $("#hint").textContent);
  }

  function renderTray(){
    tray.innerHTML = "";
    WEAR[slot].forEach(([emoji, name], i) => {
      const b = document.createElement("button");
      b.className = "opt-btn"; b.textContent = emoji;
      b.style.setProperty("--c", CARD[i % CARD.length]);
      b.setAttribute("aria-label", name);
      b.setAttribute("aria-pressed", D.outfit[slot] === emoji);
      b.addEventListener("click", () => wear(slot, emoji, name));
      tray.appendChild(b);
    });
    document.querySelectorAll("[data-slot]").forEach(c => c.setAttribute("aria-pressed", c.dataset.slot === slot));
  }

  function renderFriends(){
    friendsEl.innerHTML = "";
    FRIENDS.forEach(([emoji, name]) => {
      const b = document.createElement("button");
      b.className = "chip"; b.setAttribute("aria-label", name); b.setAttribute("aria-pressed", D.char === emoji);
      b.innerHTML = `<span class="e" aria-hidden="true">${emoji}</span>`;
      b.addEventListener("click", () => {
        D.char = emoji; save(); renderFriends(); renderStage();
        if (S.sfx) Sfx.play("pop");
        speech.say(name);
      });
      friendsEl.appendChild(b);
    });
  }

  function full(){ return SLOTS.every(s => D.outfit[s]); }

  function wear(s, emoji, name){
    const off = D.outfit[s] === emoji;
    D.outfit[s] = off ? "" : emoji;
    if (S.sfx) Sfx.play(off ? "whoosh" : "pop");
    buzz(8);
    if (!off){
      const w = WEAR[s].find(x => x[0] === emoji);
      speech.say(phrase(w).replace(/^a /, "A "));
    }
    if (!off && full()){ D.outfits++; celebrate("Looking great!"); }
    save(); renderStage(off ? "" : s); renderTray();
  }

  /* ---------- controls ---------- */
  document.querySelectorAll("[data-slot]").forEach(c => c.addEventListener("click", () => {
    slot = c.dataset.slot; renderTray();
  }));
  stage.addEventListener("click", () => { speech.say(friend()[1]); if (S.sfx) Sfx.play("pop"); });
  $("#surpriseBtn").addEventListener("click", () => {
    const pick = list => list[Math.floor(Math.random() * list.length)][0];
    SLOTS.forEach(s => { D.outfit[s] = Math.random() < .8 ? pick(WEAR[s]) : ""; });
    if (S.sfx) Sfx.play("cheer");
    if (full()){ D.outfits++; celebrate("Looking great!"); }
    save(); renderStage(); renderTray();
  });
  $("#clearBtn").addEventListener("click", () => {
    SLOTS.forEach(s => { D.outfit[s] = ""; });
    if (S.sfx) Sfx.play("whoosh");
    save(); renderStage(); renderTray();
  });

  PT.setupFullscreen($("#fsBtn"));
  PT.settingsSheet($("#settings"), $("#setBtn"), key => {
    if (key === "voice" && !S.voice) speech.cancel();
    if (key === "sfx" && !S.sfx) Sfx.stop();
  });
  PT.twoTap($("#resetBtn"), "Tap again to clear", () => {
    D.outfits = 0; save();
    toast("Outfits count cleared");
  });

  SLOTS.forEach(s => { if (!WEAR[s].some(w => w[0] === D.outfit[s])) D.outfit[s] = ""; });
  renderFriends(); renderStage(); renderTray();
})();
