(() => {
  const { $, data, save, speech, wait, shuffle, buzz, celebrate, toast } = PT;
  const S = data.settings, M = data.memory;
  const LEVELS = {
    easy:{ pairs:3, cols:3, label:"Easy" },
    medium:{ pairs:6, cols:4, label:"Medium" },
    hard:{ pairs:8, cols:4, label:"Hard" }
  };

  /* Each theme is a pool of things to pair up: { key, name, face (html), bg, sound } */
  const POOLS = {
    animals: () => {
      const seen = new Set(), out = [];
      for (const g of ANIMAL_GROUPS) for (const [name, emoji, , sound, bg] of g.animals){
        if (seen.has(emoji)) continue;
        seen.add(emoji); out.push({ key:"a:" + name, name, face:emoji, bg, sound });
      }
      return out;
    },
    letters: () => LETTERS.map(([L, word, emoji, bg]) => ({ key:"l:" + L, name:word, say:`${L} is for ${word}`, face:emoji, bg })),
    shapes: () => SHAPES.map(([id, name, , bg, fill]) => ({ key:"s:" + id, name, face:shapeSvg(id, fill), bg })),
    sofia: () => [1, 2, 3, 4].map(k => ({ key:"sofia-" + k, name:"Sofia", bg:"#FFE9A8", photo:true,
      face:`<img src="img/sofia/sofia-${k}.jpg" alt="" draggable="false">` })),
    princesses: () => PRINCESSES.map(([name, file, bg]) => ({ key:"p:" + name, name, bg, photo:true,
      face:`<img src="img/princesses/${file}.jpg" alt="" draggable="false">` })),
    colors: () => COLORS.map(([id, name, hex, bg]) => ({ key:"c:" + id, name, face:`<span class="sw" style="--s:${hex}"></span>`, bg }))
  };

  const board = $("#board");
  let total = 0;   // pairs in this game (a small picture set can have fewer than the level asks for)
  let cards = [], first = null, lock = false, moves = 0, found = 0, run = 0;

  const bestKey = () => `${M.theme}-${M.level}`;
  const L = () => LEVELS[M.level];

  function updateStats(){
    $("#moves").textContent = moves;
    $("#pairs").textContent = `${found} / ${total}`;
    const b = M.best[bestKey()];
    $("#best").textContent = b ? `${b}` : "-";
  }

  function newGame(){
    run++; speech.cancel(); Sfx.stop();
    const picks = shuffle(POOLS[M.theme]()).slice(0, L().pairs);
    total = picks.length;
    const cols = total <= 3 ? 3 : 4;
    cards = shuffle([...picks, ...picks].map((p, k) => ({ ...p, id:k })));
    first = null; lock = false; moves = 0; found = 0;
    board.style.setProperty("--cols", cols);
    board.style.setProperty("--rows", Math.ceil(cards.length / cols));
    board.innerHTML = "";
    cards.forEach((c, k) => {
      const b = document.createElement("button");
      b.className = "mcard";
      b.setAttribute("aria-label", `Card ${k + 1}, face down`);
      b.innerHTML = `<span class="in"><span class="back" aria-hidden="true">?</span><span class="face" aria-hidden="true">${c.face}</span></span>`;
      b.querySelector(".face").style.setProperty("--c", c.bg);
      if (c.photo) b.querySelector(".face").classList.add("photo");
      b.addEventListener("click", () => flip(k, b));
      c.el = b;
      board.appendChild(b);
    });
    $("#result").hidden = true; $("#newBtn").hidden = false;
    $("#hint").hidden = false; $("#hint").textContent = "Flip two cards. Do they match?";
    updateStats();
  }

  function setUp(card, up){
    card.el.classList.toggle("up", up);
    card.el.setAttribute("aria-label", up ? card.name : `Card ${cards.indexOf(card) + 1}, face down`);
  }

  async function flip(k, el){
    const c = cards[k];
    if (lock || c.done || c === first) return;
    setUp(c, true);
    if (S.sfx) Sfx.play("pop");
    buzz(8);
    if (!first){ first = c; return; }

    const a = first, b = c;
    first = null; moves++; updateStats();
    if (a.key === b.key) return matched(a, b);

    lock = true;
    const mine = run;
    await wait(950);
    if (mine !== run) return;
    setUp(a, false); setUp(b, false);
    if (S.sfx) Sfx.play("whoosh");
    lock = false;
  }

  async function matched(a, b){
    const mine = run;
    a.done = b.done = true; found++;
    a.el.classList.add("done"); b.el.classList.add("done");
    updateStats();
    if (S.sfx) Sfx.play("cheer");
    buzz(20);
    const win = found === total;
    if (win){ finish(); return; }
    await wait(500);
    if (mine !== run) return;
    await speech.say(a.say || a.name);
    if (mine !== run || !S.sfx || !a.sound) return;
    Sfx.play(a.sound);
  }

  async function finish(){
    const mine = run;
    M.wins++;
    const prev = M.best[bestKey()];
    const record = !prev || moves < prev;
    if (record) M.best[bestKey()] = moves;
    save(); updateStats();
    $("#hint").hidden = true; $("#newBtn").hidden = true;
    $("#resultText").textContent = record && prev
      ? `New best! All ${total} pairs in ${moves} moves.`
      : `You found all ${total} pairs in ${moves} moves!`;
    $("#result").hidden = false;
    await wait(500);
    if (mine !== run) return;
    celebrate(record && prev ? "New best!" : "You did it!");
    await wait(1400);
    if (mine === run) speech.say("You found them all! Great job!");
  }

  /* ---------- controls ---------- */
  function syncChips(){
    document.querySelectorAll("[data-theme-pick]").forEach(b => b.setAttribute("aria-pressed", b.dataset.themePick === M.theme));
    document.querySelectorAll("[data-level-pick]").forEach(b => b.setAttribute("aria-pressed", b.dataset.levelPick === M.level));
  }
  document.querySelectorAll("[data-theme-pick]").forEach(b => b.addEventListener("click", () => {
    if (M.theme === b.dataset.themePick) return;
    M.theme = b.dataset.themePick; save(); syncChips(); newGame();
  }));
  document.querySelectorAll("[data-level-pick]").forEach(b => b.addEventListener("click", () => {
    if (M.level === b.dataset.levelPick) return;
    M.level = b.dataset.levelPick; save(); syncChips(); newGame();
  }));
  $("#newBtn").addEventListener("click", newGame);
  $("#againBtn").addEventListener("click", newGame);

  PT.setupFullscreen($("#fsBtn"));
  PT.settingsSheet($("#settings"), $("#setBtn"), key => {
    if (key === "voice" && !S.voice) speech.cancel();
    if (key === "sfx" && !S.sfx) Sfx.stop();
  });
  PT.twoTap($("#resetBtn"), "Tap again to clear", () => {
    M.best = {}; M.wins = 0; save(); updateStats();
    toast("Best scores cleared");
  });

  if (!POOLS[M.theme]) M.theme = "animals";
  if (!LEVELS[M.level]) M.level = "easy";
  syncChips();
  newGame();
})();
