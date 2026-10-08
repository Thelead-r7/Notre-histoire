/* =========================================================
   BALLADE — ambiance "All of Me" / "Halo"
   Piano arpégé · nappes de cordes · basse · montée en intensité
   Composition originale, aucun sample, aucun copyright.
   ========================================================= */
(function(){

  let ctx = null;
  let master = null;
  let reverb = null;
  let musicOn = false;

  // ---------- Grille harmonique ----------
  // Chaque page = un accord avec un niveau d'intensité (0=doux, 1=plein)
  // Progression typique ballade : I - V - vi - IV, avec variations
  // [fondamentale, tierce, quinte, intensité, note mélodie]
  const CHORDS = [
    null,                                    // 0  couverture
    [130.81, 164.81, 196.00, 0.3, 392.00],   // I     C   doux
    [98.00,  123.47, 146.83, 0.4, 392.00],   // II    G/B tendu
    [110.00, 130.81, 164.81, 0.5, 440.00],   // III   Am  nostalgie
    [87.31,  110.00, 130.81, 0.5, 349.23],   // IV    F   chaleur
    [130.81, 164.81, 196.00, 0.6, 392.00],   // V     C   retour
    [110.00, 130.81, 164.81, 0.7, 440.00],   // VI    Am  "je t'aime"
    [87.31,  110.00, 130.81, 0.7, 523.25],   // VII   F   envol
    [98.00,  123.47, 146.83, 0.6, 440.00],   // VIII  G   manque
    [130.81, 164.81, 196.00, 0.8, 523.25],   // IX    C   attente
    [130.81, 164.81, 196.00, 0.9, 659.25],   // X     C   LA phrase (clarté)
    [110.00, 130.81, 164.81, 1.0, 523.25],   // XI    Am  cœur qui bat
    [87.31,  110.00, 130.81, 0.8, 440.00],   // XII   F
    [98.00,  123.47, 146.83, 0.8, 440.00],   // XIII  G
    [110.00, 130.81, 164.81, 0.7, 523.25],   // XIV   Am
    [130.81, 164.81, 196.00, 1.0, 659.25],   // XV    C   AK7 RR7 (apogée)
    [87.31,  110.00, 130.81, 0.6, 440.00],   // XVI   F   au-delà
    [130.81, 164.81, 196.00, 0.5, 523.25]    // FIN   C   résolution
  ];

  // Note de mélodie pour chaque page (au-dessus des accords)
  // Crée un fil conducteur mélodique entendable
  const MELODY = [
    null,
    [392.00],                      // I    G
    [392.00, 440.00],              // II   G A
    [440.00, 392.00],              // III  A G
    [349.23, 392.00],              // IV   F G
    [392.00, 440.00, 523.25],      // V    G A C
    [523.25, 493.88, 440.00],      // VI   C B A  ← je t'aime
    [523.25, 587.33, 659.25],      // VII  C D E  ← envol
    [440.00, 493.88],              // VIII A B
    [523.25, 587.33],              // IX   C D
    [659.25, 783.99, 659.25],      // X    E G E  ← LA phrase
    [523.25, 587.33, 659.25, 783.99], // XI grandes montées
    [659.25, 587.33, 523.25],      // XII  E D C
    [587.33, 523.25, 493.88],      // XIII D C B
    [523.25, 587.33, 659.25],      // XIV  C D E
    [659.25, 783.99, 1046.50, 783.99], // XV apogée AK7RR7
    [523.25, 440.00],              // XVI  C A
    [523.25, 659.25, 783.99]       // FIN  C E G
  ];

  function ensureCtx(){
    if(ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Réverbération riche (grande salle de concert)
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 3.5;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for(let c = 0; c < 2; c++){
      const d = buf.getChannelData(c);
      for(let i = 0; i < len; i++){
        d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, 2.0);
      }
    }
    conv.buffer = buf;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    const dry = ctx.createGain();
    dry.gain.value = 0.7;
    conv.connect(wet); wet.connect(master);
    master.connect(dry); dry.connect(ctx.destination);
    reverb = conv;
  }

  // ---------- Piano (attaque claire, décroissance douce) ----------
  function piano(freq, when, dur, vol){
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const o3 = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    o1.type = 'triangle'; o1.frequency.value = freq;
    o2.type = 'sine';     o2.frequency.value = freq * 2.005;
    o3.type = 'sine';     o3.frequency.value = freq * 3.01;

    const g2 = ctx.createGain(); g2.gain.value = 0.28;
    const g3 = ctx.createGain(); g3.gain.value = 0.10;

    o1.connect(filter);
    o2.connect(g2); g2.connect(filter);
    o3.connect(g3); g3.connect(filter);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4200, when);
    filter.frequency.exponentialRampToValueAtTime(900, when + dur);
    filter.Q.value = 0.6;

    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.012);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, when + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    filter.connect(g);
    g.connect(master);
    g.connect(reverb);

    o1.start(when); o1.stop(when + dur + 0.05);
    o2.start(when); o2.stop(when + dur + 0.05);
    o3.start(when); o3.stop(when + dur + 0.05);
  }

  // ---------- Nappe de cordes (fond continu) ----------
  function strings(freq, when, dur, vol){
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const o3 = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    o1.type = 'sawtooth'; o1.frequency.value = freq;
    o2.type = 'sawtooth'; o2.frequency.value = freq * 1.005;
    o3.type = 'sawtooth'; o3.frequency.value = freq * 0.996;

    // Vibrato lent
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 4.5;
    lfoGain.gain.value = 1.5;
    lfo.connect(lfoGain);
    lfoGain.connect(o1.frequency);
    lfoGain.connect(o2.frequency);
    lfoGain.connect(o3.frequency);

    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    filter.Q.value = 0.4;

    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 1.2);
    g.gain.setValueAtTime(vol, when + dur - 1.2);
    g.gain.linearRampToValueAtTime(0, when + dur);

    o1.connect(filter); o2.connect(filter); o3.connect(filter);
    filter.connect(g);
    g.connect(master);
    g.connect(reverb);

    lfo.start(when); lfo.stop(when + dur);
    o1.start(when); o1.stop(when + dur + 0.1);
    o2.start(when); o2.stop(when + dur + 0.1);
    o3.start(when); o3.stop(when + dur + 0.1);
  }

  // ---------- Basse chaude ----------
  function bass(freq, when, dur, vol){
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;

    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    o.connect(g);
    g.connect(master);
    o.start(when); o.stop(when + dur + 0.05);
  }

  // ---------- Voix mélodique (lead piano au-dessus) ----------
  function lead(freq, when, dur, vol){
    piano(freq, when, dur, vol);
    piano(freq * 2, when, dur * 0.8, vol * 0.35);
  }

  // ---------- Jouer une page complète ----------
  function playChord(index){
    if(!ctx || !musicOn) return;
    const data = CHORDS[index];
    if(!data) return;

    const [root, third, fifth, intensity, _mel] = data;
    const melodyNotes = MELODY[index] || [];
    const now = ctx.currentTime + 0.1;
    const barDur = 5.0;

    // 1) Nappe de cordes (accord tenu)
    strings(root, now, barDur, 0.05 * intensity);
    strings(third, now, barDur, 0.045 * intensity);
    strings(fifth, now, barDur, 0.045 * intensity);

    // 2) Basse (ronde)
    bass(root / 2, now, barDur, 0.22 * intensity);

    // 3) Piano — arpège en croches
    // Pattern : fond - tierce - quinte - tierce - fond(octave) - quinte - tierce - quinte
    const arp = [root, third, fifth, third, root * 2, fifth, third, fifth];
    const step = barDur / arp.length;
    arp.forEach((f, i) => {
      const t = now + i * step;
      const v = 0.10 + intensity * 0.06;
      piano(f, t, step * 3.2, v);
    });

    // 4) Mélodie au-dessus (le fil conducteur)
    melodyNotes.forEach((f, i) => {
      const t = now + 1.2 + i * 1.3;
      const v = 0.09 + intensity * 0.05;
      lead(f, t, 2.4, v);
    });

    // 5) Sur AK7 RR7 (page 15), accord final suspendu + cloche
    if(index === 15){
      setTimeout(() => bell(), 2400);
    }

    // 6) Sur la phrase du cœur (page 10), un souffle
    if(index === 10){
      setTimeout(() => sigh(), 1800);
    }
  }

  // ---------- Cloche dorée (AK7 RR7) ----------
  function bell(){
    if(!ctx || !musicOn) return;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const start = now + i * 0.08;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.06, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 4.0);
      o.connect(g);
      g.connect(master);
      g.connect(reverb);
      o.start(start); o.stop(start + 4.1);
    });
  }

  // ---------- Soupir (page "le cœur") ----------
  function sigh(){
    if(!ctx || !musicOn) return;
    const now = ctx.currentTime;
    const dur = 1.8;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i = 0; i < d.length; i++){
      const env = Math.sin(Math.PI * i / d.length);
      d[i] = (Math.random()*2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.value = 0.04;
    src.connect(filter); filter.connect(g); g.connect(reverb);
    src.start(now); src.stop(now + dur);
  }

  // ---------- Battement de cœur ----------
  function heartbeat(){
    if(!ctx || !musicOn) return;
    const now = ctx.currentTime;
    [0, 0.3].forEach((offset, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(75, now + offset);
      o.frequency.exponentialRampToValueAtTime(38, now + offset + 0.15);
      g.gain.setValueAtTime(0, now + offset);
      g.gain.linearRampToValueAtTime(i === 0 ? 0.24 : 0.17, now + offset + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.38);
      o.connect(g); g.connect(master);
      o.start(now + offset); o.stop(now + offset + 0.42);
    });
  }

  // ---------- Son de page tournée ----------
  function pageSound(){
    if(!ctx || !musicOn) return;
    const now = ctx.currentTime;
    const dur = 0.55;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i = 0; i < d.length; i++){
      const env = Math.pow(1 - i/d.length, 1.7);
      d[i] = (Math.random()*2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + dur);
    filter.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = 0.09;
    src.connect(filter); filter.connect(g); g.connect(ctx.destination);
    src.start(now); src.stop(now + dur);
  }

  function setMusicOn(on){
    ensureCtx();
    if(ctx.state === 'suspended') ctx.resume();
    musicOn = on;
    const target = on ? 0.75 : 0;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(target, ctx.currentTime + 2);
  }

  window.Audio7 = {
    on: () => setMusicOn(true),
    off: () => setMusicOn(false),
    isOn: () => musicOn,
    playChord, pageSound, heartbeat, bell
  };
})();
