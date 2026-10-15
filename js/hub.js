(() => {
  const { $, data } = PT;
  const met = Object.keys(data.animals.seen).length;
  $("#animalStat").textContent = met ? `★ ${Math.min(met, ANIMAL_TOTAL)} of ${ANIMAL_TOTAL} met` : `${ANIMAL_TOTAL} animals`;
  $("#animalDesc").textContent =
    `${ANIMAL_TOTAL} animals in ${ANIMAL_GROUPS.length} groups. Swipe through them and tap one to hear its name and sound.`;
  const stars = data.abc.stars;
  $("#abcStat").textContent = stars ? `⭐ ${stars} star${stars === 1 ? "" : "s"}` : "A to Z";
  const sh = Object.keys(data.shapes.seen).length, shStars = data.shapes.stars;
  $("#shapeStat").textContent = shStars ? `⭐ ${shStars} star${shStars === 1 ? "" : "s"}` : sh ? `★ ${sh} of ${SHAPES.length} seen` : `${SHAPES.length} shapes`;
  const stat = (g, total, idle, unit) => {
    const stars = g.stars, seen = Object.keys(g.seen).length;
    return stars ? `⭐ ${stars} star${stars === 1 ? "" : "s"}` : seen ? `★ ${Math.min(seen, total)} of ${total} seen` : idle;
  };
  $("#colorStat").textContent = stat(data.colors, COLORS.length, `${COLORS.length} colors`);
  $("#numberStat").textContent = stat(data.numbers, NUMBERS.length, "1 to 10");
  const outfits = data.dress.outfits;
  $("#dressStat").textContent = outfits ? `👑 ${outfits} outfit${outfits === 1 ? "" : "s"}` : "Pick an outfit";
  const sliceWins = data.slice.wins;
  $("#sliceStat").textContent = sliceWins ? `🏆 ${sliceWins} win${sliceWins === 1 ? "" : "s"}` : "Swipe to slice";
  const dotWins = data.dots.wins;
  $("#dotsStat").textContent = dotWins ? `🏆 ${dotWins} picture${dotWins === 1 ? "" : "s"}` : "1, 2, 3...";
  const shadowWins = data.shadow.wins;
  $("#shadowStat").textContent = shadowWins ? `🏆 ${shadowWins} win${shadowWins === 1 ? "" : "s"}` : "Who is it?";
  const spins = data.wheel.spins;
  $("#wheelStat").textContent = spins ? `🎡 ${spins} spin${spins === 1 ? "" : "s"}` : "Spin and see";
  const mazeWins = data.maze.wins;
  $("#mazeStat").textContent = mazeWins ? `🏆 ${mazeWins} win${mazeWins === 1 ? "" : "s"}` : "Find the way";
  const wins = data.memory.wins;
  $("#memoryStat").textContent = wins ? `🏆 ${wins} win${wins === 1 ? "" : "s"}` : "Find the pairs";
  PT.setupFullscreen($("#fsBtn"));
})();
