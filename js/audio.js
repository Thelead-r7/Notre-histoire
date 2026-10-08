(function(){
  let ctx = null;
  let master = null;
  let musicOn = false;
  let reverb = null;

  const CHORDS = [
    null,
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [196.00, 246.94, 293.66],
    [164.81, 207.65, 246.94],
    [220.00, 277.18, 329.63],
    [261.63, 329.63, 392.00],
    [174.61, 220.00, 293.66],
    [146.83, 174.61, 220.00],
    [196.00, 246.94, 329.63],
    [261.63, 329.63, 392.00],
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [196.00, 246.94, 293.66],
    [164.81, 196.00, 246.94],
    [261.63, 329.63, 392.00],
    [146.83, 174.61, 220.00],
    [261.63, 329.63, 392.00, 523.25]
  ];

  function ensureCtx(){
    if(ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 2.6;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for(let c = 0; c < 2; c++){
      const d = buf.getChannelData(c);
      for(let i = 0; i < len; i++){
        d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, 2.4);
      }
    }
    conv.buffer = buf;
    const wet = ctx.createGain();
    wet.gain.value = 0.45;
    conv.connect(wet);
    wet.connect(master);
    reverb = conv;
  }

  function playNote(freq, when, dur, vol, harmonic){
    const f1 = ctx.createOscillator();
    const f2 = ctx.createOscillator();
    const f3 = ctx.createOscillator();
    const g = ctx.createGain();

    f1.type = 'sine';     f1.frequency.value = freq;
    f2.type = 'triangle'; f2.frequency.value = freq * 2.01;
    f3.type = 'sine';     f3.frequency.value = freq * 3.005;

    const g2 = ctx.createGain(); g2.gain.value = harmonic ? 0.32 : 0.18;
    const g3 = ctx.createGain(); g3.gain.value = harmonic ? 0.12 : 0.06;

    f1.connect(g);
    f2.connect(g2); g2.connect(g);
    f3.connect(g3); g3.connect(g);

    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    g.connect(master);
    g.connect(reverb);

    f1.start(when); f1.stop(when + dur + 0.1);
    f2.start(when); f2.stop(when + dur + 0.1);
    f3.start(when); f3.stop(when + dur + 0.1);
  }

  function playChord(index){
    if(!ctx || !musicOn) return;
    const chord = CHORDS[index];
    if(!chord) return;
    const now = ctx.currentTime + 0.08;
    const isFinal = index === CHORDS.length - 1;

    chord.forEach((f, i) => {
      playNote(f, now + i * 0.35, isFinal ? 6.5 : 5.5, 0.14, false);
    });

    const high = chord[0] * 2;
    playNote(high, now + 1.4, 4.2, 0.05, true);

    if(index === 15){
      setTimeout(() => bell(), 900);
    }
  }

  function bell(){
    if(!ctx || !musicOn) return;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.09, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
      osc.connect(g);
      g.connect(master);
      g.connect(reverb);
      osc.start(now); osc.stop(now + 3.6);
    });
  }

  function heartbeat(){
    if(!ctx || !musicOn) return;
    const now = ctx.currentTime;
    [0, 0.28].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(70, now + offset);
      osc.frequency.exponentialRampToValueAtTime(38, now + offset + 0.14);
      g.gain.setValueAtTime(0, now + offset);
      g.gain.linearRampToValueAtTime(i === 0 ? 0.22 : 0.16, now + offset + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);
      osc.connect(g);
      g.connect(master);
      osc.start(now + offset); osc.stop(now + offset + 0.4);
    });
  }

  function pageSound(){
    if(!ctx || !musicOn) return;
    const now = ctx.currentTime;
    const dur = 0.5;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i = 0; i < d.length; i++){
      const env = Math.pow(1 - i/d.length, 1.6);
      d[i] = (Math.random()*2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + dur);
    filter.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.11;
    src.connect(filter); filter.connect(g); g.connect(ctx.destination);
    src.start(now); src.stop(now + dur);
  }

  function setMusicOn(on){
    ensureCtx();
    if(ctx.state === 'suspended') ctx.resume();
    musicOn = on;
    const target = on ? 0.7 : 0;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.6);
  }

  window.Audio7 = {
    on: () => setMusicOn(true),
    off: () => setMusicOn(false),
    isOn: () => musicOn,
    playChord, pageSound, heartbeat, bell
  };
})();
