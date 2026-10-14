(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast } = PT;
  const S = data.settings, A = data.animals;
  const card = $("#card");

  let group = ANIMAL_GROUPS.find(g => g.id === A.group) || ANIMAL_GROUPS[0];
  let order = [], i = 0, run = 0;

  const at = k => group.animals[order[((k % order.length) + order.length) % order.length]];
  const cur = () => at(i);

  /* ---------- group chips ---------- */
  function renderChips(){
    const box = $("#groups");
    box.innerHTML = "";
    for (const g of ANIMAL_GROUPS){
      const b = document.createElement("button");
      b.className = "chip";
      b.setAttribute("aria-pressed", g === group);
      b.innerHTML = `<span class="e" aria-hidden="true">${g.icon}</span>`;
      b.append(g.label);
      b.addEventListener("click", () => {
        if (g === group) return;
        setGroup(g);
        if (S.autoplay) perform();
      });
      box.appendChild(b);
      if (g === group) requestAnimationFrame(() => b.scrollIntoView({ block:"nearest", inline:"nearest" }));
    }
  }

  function setGroup(g){
    group = g; A.group = g.id; save();
    order = g.animals.map((_, k) => k); i = 0;
    renderChips(); renderShelf(); show();
  }

  /* ---------- shelf ---------- */
  function renderShelf(){
    $("#shelfTitle").textContent = group.shelf;
    const grid = $("#grid");
    grid.innerHTML = "";
    order.forEach((idx, pos) => {
      const [name, emoji, , , color] = group.animals[idx];
      const b = document.createElement("button");
      b.className = "thumb chunky";
      b.textContent = emoji;
      b.setAttribute("aria-label", name);
      b.style.setProperty("--c", color);
      b.addEventListener("click", () => {
        if (pos === i) return perform();
        stopAll(); i = pos; show(); perform();
      });
      grid.appendChild(b);
    });
    updateShelf();
  }
  function updateShelf(){
    [...$("#grid").children].forEach((b, pos) => {
      b.setAttribute("aria-current", pos === i);
      b.classList.toggle("seen", !!A.seen[at(pos)[0]]);
    });
    const met = group.animals.filter(a => A.seen[a[0]]).length;
    $("#shelfMeta").textContent = `★ ${met} of ${group.animals.length} met`;
  }

  /* ---------- the card ---------- */
  function show(back){
    const [name, emoji, words, , color] = cur();
    card.style.setProperty("--c", color);
    $("#emoji").textContent = emoji;
    $("#name").textContent = name;
    $("#bubble").textContent = words;
    card.setAttribute("aria-label", `${name}. ${words} Tap to hear it.`);
    $("#peek1").style.setProperty("--pc", at(i + 1)[4]);
    $("#peek2").style.setProperty("--pc", at(i + 2)[4]);
    $("#count").textContent = `${i + 1} / ${order.length}`;
    document.body.classList.toggle("no-words", !S.words);
    deck.enter(back);
    markSeen(name);
    updateShelf();
  }

  function markSeen(name){
    if (A.seen[name]) return;
    A.seen[name] = 1; save();
    if (!A.done[group.id] && group.animals.every(a => A.seen[a[0]])){
      A.done[group.id] = 1; save();
      const g = group;
      setTimeout(() => { if (g === group) celebrate(g.cheer); }, 2600);
    }
  }

  function stopAll(){ run++; speech.cancel(); Sfx.stop(); }

  // Say the name, then the bubble pops and the animal makes its sound.
  async function perform(){
    stopAll();
    const mine = run;
    const [name, , words, sound] = cur();
    card.classList.remove("pop", "speaking"); void card.offsetWidth; card.classList.add("pop");
    if (S.voice){
      const ok = await speech.say(name);
      if (!ok || mine !== run) return;
    } else {
      await wait(200);
      if (mine !== run) return;
    }
    card.classList.remove("speaking"); void card.offsetWidth; card.classList.add("speaking");
    if (S.sfx) Sfx.play(sound);
    else if (S.voice && S.words) speech.say(words);
  }

  const deck = SwipeDeck(card, {
    onTap: perform,
    onLeave(){
      stopAll();
      if (S.sfx) Sfx.play("whoosh");
      buzz(12);
    },
    onNext(){
      i = (i + 1) % order.length;
      show();
      if (S.autoplay) perform();
    }
  });

  /* ---------- controls ---------- */
  function rewind(){
    if (deck.busy) return;
    stopAll();
    i = (i - 1 + order.length) % order.length;
    show(true);
    if (S.autoplay) perform();
  }
  $("#backBtn").addEventListener("click", rewind);
  $("#shuffleBtn").addEventListener("click", () => {
    stopAll();
    shuffle(order); i = 0;
    renderShelf(); show();
    toast("Shuffled!");
  });
  document.addEventListener("keydown", e => {
    if ($("#settings").open || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === "ArrowRight"){ e.preventDefault(); deck.fling(1); }
    else if (e.key === "ArrowLeft"){ e.preventDefault(); rewind(); }
  });

  PT.setupFullscreen($("#fsBtn"));
  PT.settingsSheet($("#settings"), $("#setBtn"), key => {
    if (key === "words") document.body.classList.toggle("no-words", !S.words);
    if (key === "voice" && !S.voice) speech.cancel();
    if (key === "sfx" && !S.sfx) Sfx.stop();
  });
  PT.twoTap($("#resetBtn"), "Tap again to clear", () => {
    A.seen = {}; A.done = {}; save();
    updateShelf();
    toast("Stickers cleared");
  });

  setGroup(group);
})();
