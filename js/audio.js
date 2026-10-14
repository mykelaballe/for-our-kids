/* Animal and game sounds, made in the browser with the Web Audio API.
   No audio files, so everything works offline. Sfx.play("moo") plays a sound by its key.

   Voices use a buzzy source shaped by two moving "formant" filters, the same trick
   that makes vowels in speech. That gives a cow an "mmm-ooo" and a cat an "ee-ah-oo". */
const Sfx = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, master = null, room = null, current = null, dest = null, noiseBuf = null;

  const VOWEL = {
    mm:[250, 700], oo:[320, 800], oh:[480, 860], uh:[620, 1100], ah:[760, 1250],
    ae:[680, 1650], eh:[540, 1850], ee:[290, 2250]
  };

  function unlock(){
    if (!AC) return null;
    if (!ctx){
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = .9;
      master.connect(comp); comp.connect(ctx.destination);
      // A small room, so the synthetic voices sound less flat.
      room = ctx.createConvolver(); room.buffer = impulse(1.3);
      const wet = ctx.createGain(); wet.gain.value = .2;
      room.connect(wet); wet.connect(master);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function impulse(sec){
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++){
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return b;
  }
  function noise(){
    if (!noiseBuf){
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  /* ---------- building blocks ---------- */
  // Move a parameter through a list of values spread evenly over d seconds.
  function glide(param, pts, t0, d){
    param.setValueAtTime(pts[0], t0);
    for (let k = 1; k < pts.length; k++) param.linearRampToValueAtTime(pts[k], t0 + d * k / (pts.length - 1));
  }
  function wobble(param, rate, depth, t0, d){
    const l = ctx.createOscillator(), lg = ctx.createGain();
    l.frequency.value = rate; lg.gain.value = depth;
    l.connect(lg); lg.connect(param); l.start(t0); l.stop(t0 + d + .1);
  }
  function filter(node, type, freq, q){
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    node.connect(f); return f;
  }
  // Volume envelope (attack, hold, release) with optional tremolo, then out.
  function shape(node, t0, d, o){
    const peak = o.g ?? .3, a = Math.min(o.a ?? .02, d / 2), r = Math.min(o.r ?? .08, d - a);
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.setValueAtTime(peak, t0 + d - r);
    g.gain.linearRampToValueAtTime(.0001, t0 + d);
    if (o.am) wobble(g.gain, o.am[0], peak * o.am[1], t0, d);
    node.connect(g); g.connect(dest);
  }
  const at = o => ctx.currentTime + .02 + (o.t || 0);

  // Plain pitched tone. f = list of pitches to glide through.
  function tone(o){
    const t0 = at(o), d = o.d || .3;
    const s = ctx.createOscillator(); s.type = o.type || "sine";
    glide(s.frequency, o.f, t0, d);
    if (o.vib) wobble(s.frequency, o.vib[0], o.vib[1], t0, d);
    let n = s;
    if (o.lp) n = filter(n, "lowpass", o.lp, o.q);
    if (o.bp) n = filter(n, "bandpass", o.bp, o.q);
    shape(n, t0, d, o);
    s.start(t0); s.stop(t0 + d + .1);
  }
  // Voice-like sound: buzzy source through two formant filters that move between vowels.
  function vox(o){
    const t0 = at(o), d = o.d || .4;
    const s = ctx.createOscillator(); s.type = o.type || "sawtooth";
    glide(s.frequency, o.f, t0, d);
    if (o.vib) wobble(s.frequency, o.vib[0], o.vib[1], t0, d);
    const vs = (o.v || ["ah"]).map(v => typeof v === "string" ? VOWEL[v] : v);
    const mix = ctx.createGain();
    [[0, 1], [1, .55]].forEach(([k, level]) => {
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.Q.value = o.q || 5;
      glide(bp.frequency, vs.map(v => v[k]), t0, d);
      const g = ctx.createGain(); g.gain.value = level * 2.4;
      s.connect(bp); bp.connect(g); g.connect(mix);
    });
    const body = filter(s, "lowpass", vs[0][0] * 1.3);
    const bg = ctx.createGain(); bg.gain.value = .22;
    body.connect(bg); bg.connect(mix);
    shape(mix, t0, d, o);
    s.start(t0); s.stop(t0 + d + .1);
  }
  // Noise: breath, hiss, crunch, clicks. bp may be a list to sweep.
  function hush(o){
    const t0 = at(o), d = o.d || .3;
    const s = ctx.createBufferSource(); s.buffer = noise(); s.loop = true;
    let n = s;
    if (o.lp) n = filter(n, "lowpass", o.lp, o.q);
    if (o.hp) n = filter(n, "highpass", o.hp, o.q);
    if (o.bp){
      const list = Array.isArray(o.bp) ? o.bp : [o.bp];
      n = filter(n, "bandpass", list[0], o.q || 1);
      glide(n.frequency, list, t0, d);
    }
    shape(n, t0, d, o);
    s.start(t0, Math.random()); s.stop(t0 + d + .1);
  }
  const rep = (n, gap, fn) => { for (let i = 0; i < n; i++) fn(i * gap, i); };
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- the sounds ---------- */
  const P = {
    // farm
    moo(){
      vox({ d:1.4, f:[118, 128, 112, 100], v:["mm", "oo", "oo", "oh"], g:.55, a:.15, r:.45, vib:[4.5, 3], q:6 });
      hush({ d:1.2, lp:500, g:.05, a:.3, r:.4 });
    },
    oink(){
      rep(2, .3, t => {
        vox({ t, d:.22, f:[190, 150, 120], v:["uh", "oh"], g:.55, am:[42, .5], q:4 });
        hush({ t, d:.18, bp:700, q:2, g:.12 });
      });
    },
    baa(){ vox({ d:1, f:[340, 330, 300], v:["eh", "ae", "ah"], g:.5, am:[26, .55], vib:[6, 5], a:.05, r:.3 }); },
    goat(){ vox({ d:.9, f:[290, 280, 250], v:["mm", "ae", "ah"], g:.5, am:[22, .6], a:.06, r:.3 }); },
    neigh(){
      vox({ d:1.2, f:[700, 1250, 1050, 520], v:["ee", "eh", "ah"], g:.4, vib:[13, 60], a:.04, r:.4, q:4 });
      hush({ t:1.1, d:.35, bp:900, q:1, g:.2, a:.02, r:.2 });
    },
    cluck(){ rep(4, .14, (t, i) => vox({ t, d:.09, f:[i === 3 ? 620 : 460, 300], v:["uh", "oh"], g:.4, q:6 })); },
    rooster(){
      vox({ t:0,   d:.16, f:[520, 600], v:["ah"], g:.4 });
      vox({ t:.2,  d:.16, f:[620, 760], v:["ah", "oo"], g:.4 });
      vox({ t:.4,  d:.18, f:[760, 720], v:["oo", "ah"], g:.4 });
      vox({ t:.62, d:.9,  f:[820, 900, 700, 460], v:["oo", "oo", "oh"], g:.4, vib:[9, 18], r:.4 });
    },
    quack(){ rep(2, .32, t => vox({ t, d:.22, f:[420, 360, 300], v:["ae", "ah"], q:9, g:.5, am:[70, .3] })); },
    gobble(){ vox({ d:1, f:[420, 400, 330], v:["uh", "oh", "uh"], g:.45, vib:[24, 90], am:[12, .5] }); },
    sniff(){ rep(3, .16, t => hush({ t, d:.1, bp:3000, q:1, g:.35 })); },

    // pets
    woof(){
      rep(2, .36, t => {
        vox({ t, d:.18, f:[280, 220, 140], v:["oo", "ah", "uh"], g:.6, q:4 });
        hush({ t, d:.1, bp:1500, q:.8, g:.18 });
      });
    },
    meow(){ vox({ d:.9, f:[520, 760, 700, 470], v:["ee", "ae", "ah", "oo"], g:.45, vib:[6, 12], a:.06, r:.3 }); },
    squeak(){ rep(3, .13, t => tone({ t, d:.08, f:[1900, 2700], g:.28 })); },
    nibble(){ rep(6, .1, t => hush({ t, d:.05, bp:rnd(2500, 4000), q:3, g:.3 })); },
    squawk(){ rep(2, .45, t => vox({ t, d:.36, f:[900, 1350, 850], v:["ae", "ah"], q:6, g:.4, vib:[22, 70] })); },
    blub(){ rep(3, .2, t => tone({ t, d:.12, f:[rnd(260, 340), rnd(600, 760)], g:.42 })); },
    munch(){ rep(4, .17, t => hush({ t, d:.09, lp:rnd(700, 1100), g:.55 })); },
    ribbit(){ rep(2, .24, t => vox({ t, d:.16, f:[150, 120], v:["ee", "uh"], type:"square", g:.4, am:[48, .6] })); },

    // wild
    roar(){
      vox({ d:1.5, f:[120, 140, 90, 65], v:["ah", "ah", "oh"], g:.65, am:[18, .4], a:.12, r:.5, q:3 });
      hush({ d:1.4, lp:700, g:.25, a:.12, r:.5 });
    },
    growl(){ vox({ d:1.1, f:[95, 100, 80], v:["uh", "oh"], g:.6, am:[28, .6], a:.1, r:.3, q:3 }); },
    bear(){ vox({ d:1.3, f:[80, 90, 65], v:["oh", "uh", "oh"], g:.65, am:[22, .6], a:.15, r:.4, q:3 }); },
    trumpet(){
      vox({ d:1.1, f:[420, 820, 760, 520], v:["ae", "eh", "ae"], g:.5, vib:[7, 12], a:.05, r:.3, q:3 });
      tone({ d:1.1, f:[840, 1640, 1520, 1040], type:"sawtooth", lp:2600, g:.08, a:.05, r:.3 });
    },
    monkey(){
      rep(4, .2, (t, i) => vox({ t, d:.17, f:i < 2 ? [450, 650] : [760, 520], v:i < 2 ? ["oo"] : ["ah"], g:.45 }));
    },
    hiss(){ hush({ d:1.2, hp:4200, g:.32, a:.25, r:.35 }); },
    howl(){
      vox({ d:1.9, f:[330, 700, 650, 430], v:["ah", "oo", "oo"], type:"triangle", g:.5, vib:[5, 9], a:.2, r:.6 });
    },
    hoot(){
      rep(2, .5, t => {
        tone({ t, d:.34, f:[440, 380], g:.45, a:.06, r:.18 });
        hush({ t, d:.08, bp:1200, g:.06 });
      });
    },
    yip(){ rep(3, .17, t => vox({ t, d:.12, f:[800, 1200], v:["ee", "ah"], g:.45 })); },
    snort(){
      rep(2, .36, t => {
        hush({ t, d:.24, bp:[1200, 600], q:1, g:.5 });
        tone({ t, d:.2, f:[120, 85], type:"sawtooth", lp:400, g:.25 });
      });
    },
    grunt(){ rep(2, .38, t => vox({ t, d:.28, f:[95, 75], v:["uh", "oh"], g:.6, q:3 })); },
    boing(){ tone({ d:.8, f:[170, 540, 220], g:.45, vib:[18, 60], a:.01, r:.3 }); },
    grumble(){ vox({ d:1.1, f:[140, 150, 100], v:["uh", "oh", "uh"], g:.5, am:[10, .5], a:.1, r:.3 }); },
    gorilla(){
      rep(3, .32, t => vox({ t, d:.24, f:[230, 180], v:["oo", "oh"], g:.55 }));
      rep(5, .11, t => tone({ t:t + 1.05, d:.09, f:[110, 55], g:.55, a:.005, r:.07 }));
    },
    snore(){
      hush({ d:1.3, lp:450, g:.45, am:[.9, .8], a:.3, r:.5 });
      vox({ d:1.1, f:[85, 75], v:["oh"], g:.15, a:.3, r:.4 });
    },
    chitter(){ rep(8, .07, t => vox({ t, d:.05, f:[1500, 1200], v:["ee"], type:"square", g:.25 })); },

    // sea
    whale(){
      tone({ d:2.2, f:[190, 430, 380, 150], g:.45, vib:[3, 10], a:.3, r:.7 });
      tone({ d:2.2, f:[380, 860, 760, 300], g:.08, a:.3, r:.7 });
    },
    dolphin(){
      rep(5, .1, t => tone({ t, d:.08, f:[2200, 4300], g:.22 }));
      rep(6, .05, t => hush({ t:t + .6, d:.02, bp:5000, q:4, g:.4 }));
    },
    click(){ rep(6, .1, t => hush({ t, d:.04, bp:2800, q:3, g:.55 })); },
    arf(){ rep(3, .24, t => vox({ t, d:.15, f:[520, 330], v:["ah", "uh"], g:.5 })); },
    honk(){ rep(2, .4, t => vox({ t, d:.3, f:[420, 380], v:["ae", "ah"], q:8, g:.5, am:[30, .25] })); },
    chomp(){
      rep(3, .27, t => {
        hush({ t, d:.12, lp:1200, g:.55 });
        tone({ t, d:.12, f:[140, 55], g:.45, a:.005 });
      });
    },

    // magical
    chime(t0 = 0){
      [880, 1175, 1568, 1976, 2349].forEach((f, i) => tone({ t:t0 + i * .11, d:.6, f:[f], g:.2, a:.01, r:.5 }));
    },
    unicorn(){ P.neigh(); P.chime(1.0); },
    dragon(){ P.roar(); hush({ t:.25, d:1.2, bp:[600, 2500, 900], q:.7, g:.25, a:.2, r:.4 }); },
    sing(){
      [523, 659, 587, 784].forEach((f, i) =>
        vox({ t:i * .3, d:.28, f:[f], v:["ah"], type:"triangle", g:.45, vib:[6, 6], a:.04, r:.12 }));
    },
    poof(){ hush({ d:.45, bp:[400, 2000], q:.6, g:.5, a:.01, r:.35 }); P.chime(.35); },
    ghost(){
      vox({ d:1.3, f:[300, 520, 280], v:["oo"], type:"triangle", g:.45, vib:[6, 18], a:.2, r:.4 });
      vox({ t:1.4, d:.4, f:[220, 180], v:["oo"], g:.45, a:.04 });
    },
    beep(){ [900, 700, 1100, 800].forEach((f, i) => tone({ t:i * .16, d:.12, f:[f, f * 1.05], type:"square", lp:2500, g:.2 })); },

    // bugs and birds
    buzz(){ tone({ d:1.1, f:[210, 230, 200, 220], type:"sawtooth", bp:650, q:3, g:.4, am:[48, .5], a:.1, r:.3 }); },
    flutter(){ hush({ d:.9, bp:1100, q:.7, g:.32, am:[16, .9], a:.1, r:.3 }); },
    slime(){ hush({ d:1.4, lp:420, g:.35, am:[3, .6], a:.25, r:.4 }); },
    tweet(){ rep(3, .17, t => tone({ t, d:.11, f:[2600, 3600], g:.25, vib:[30, 60] })); },
    cheep(){ rep(4, .13, t => tone({ t, d:.07, f:[3300, 3900], g:.24 })); },

    // game sounds
    pop(){ tone({ d:.1, f:[500, 900], g:.35, a:.005, r:.07 }); },
    whoosh(){ hush({ d:.3, bp:[500, 2600], q:.8, g:.22, a:.08, r:.15 }); },
    cheer(){ [523, 659, 784, 1047].forEach((f, i) => tone({ t:i * .09, d:.32, f:[f], type:"triangle", g:.3, a:.01, r:.22 })); },
    tada(){
      [523, 659, 784].forEach((f, i) => tone({ t:i * .1, d:.2, f:[f], type:"triangle", g:.3, a:.01 }));
      [1047, 1319, 1568].forEach(f => tone({ t:.32, d:.8, f:[f], type:"triangle", g:.18, a:.01, r:.6, vib:[6, 4] }));
    },
    oops(){ tone({ d:.38, f:[320, 180], type:"triangle", lp:900, g:.32, r:.2 }); }
  };

  function stop(){
    if (!current || !ctx) return;
    const old = current; current = null;
    old.gain.setTargetAtTime(0, ctx.currentTime, .03);
    setTimeout(() => old.disconnect(), 300);
  }
  // Each sound gets its own output, so the next one can fade out the last.
  function play(key){
    if (!P[key] || !unlock()) return;
    stop();
    current = ctx.createGain();
    current.connect(master); current.connect(room);
    dest = current;
    P[key]();
  }

  return { play, stop, unlock, has:key => !!P[key] };
})();
