/* Tinder-style swipe deck. The top card follows the finger and tilts as it goes.
   Let go far enough (or flick fast enough) and it flies off; otherwise it springs back.
   A tap without dragging counts as a tap. */
function SwipeDeck(card, { onTap, onLeave, onNext } = {}){
  const stamp = card.querySelector(".stamp");
  let down = false, moved = false, busy = false;
  let sx = 0, sy = 0, dx = 0, dy = 0, lastX = 0, lastT = 0, vx = 0;

  const pose = (x, y) => `translate(${x}px, ${y}px) rotate(${x / 16}deg)`;
  const limit = () => Math.min(110, card.offsetWidth * .28);

  card.addEventListener("pointerdown", e => {
    if (busy || (e.pointerType === "mouse" && e.button !== 0)) return;
    down = true; moved = false;
    sx = lastX = e.clientX; sy = e.clientY; dx = dy = vx = 0; lastT = e.timeStamp;
    card.style.transition = "none";
    card.classList.remove("enter", "enter-back");
    card.classList.add("dragging");
    if (stamp) stamp.style.transition = "none";
    try{ card.setPointerCapture(e.pointerId); }catch(err){}
  });

  card.addEventListener("pointermove", e => {
    if (!down) return;
    dx = e.clientX - sx;
    dy = (e.clientY - sy) * .4;
    const dt = e.timeStamp - lastT;
    if (dt > 0){ vx = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = e.timeStamp; }
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
    card.style.transform = pose(dx, dy);
    if (stamp) stamp.style.opacity = Math.min(1, Math.abs(dx) / limit());
  });

  function release(){
    if (!down) return;
    down = false;
    card.classList.remove("dragging");
    const flick = Math.abs(vx) > .6 && Math.abs(dx) > 30;
    if (Math.abs(dx) > limit() || flick) fling(dx > 0 ? 1 : -1);
    else settle();
    setTimeout(() => { moved = false; }, 0);
  }
  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);
  card.addEventListener("click", () => { if (!moved && !busy && onTap) onTap(); });

  function settle(){
    card.style.transition = PT.reduceMotion ? "none" : "transform .35s cubic-bezier(.3,1.5,.5,1)";
    card.style.transform = "";
    if (stamp){ stamp.style.transition = "opacity .2s"; stamp.style.opacity = 0; }
  }

  function fling(dir = 1){
    if (busy) return;
    busy = true;
    if (onLeave) onLeave();
    const ms = PT.reduceMotion ? 0 : 280;
    card.style.transition = `transform ${ms}ms ease-in, opacity ${ms}ms`;
    card.style.transform = pose(dir * (innerWidth * .8 + card.offsetWidth), dy - 40);
    card.style.opacity = "0";
    setTimeout(() => {
      card.style.transition = "none"; card.style.transform = ""; card.style.opacity = "";
      if (stamp) stamp.style.opacity = 0;
      busy = false;
      if (onNext) onNext(dir);
    }, ms);
  }

  // Play the arrival animation: from behind the stack, or back in from the side for "rewind".
  function enter(back){
    card.classList.remove("enter", "enter-back");
    void card.offsetWidth;
    card.classList.add(back ? "enter-back" : "enter");
  }

  return { fling, enter, get busy(){ return busy; } };
}
