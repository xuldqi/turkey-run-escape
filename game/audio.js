// Gobble Run — sound: every effect is synthesized live with WebAudio.
// No audio files, no network. If WebAudio is unavailable the factory
// returns a silent stand-in so the game never breaks.
globalThis.TurkeyAudio = (() => {
  function createAudio() {
    let ctx = null;
    let master = null;
    let muted = false;

    function ensure() {
      if (ctx) {
        if (ctx.state === "suspended") ctx.resume();
        return true;
      }
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
      } catch (err) {
        ctx = null;
        return false;
      }
      return true;
    }

    function tone(freqA, freqB, dur, type, vol, delay = 0) {
      if (muted || !ensure()) return;
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqA, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqB), t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain).connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    function noise(dur, vol, freq, delay = 0) {
      if (muted || !ensure()) return;
      const t0 = ctx.currentTime + delay;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 0.8;
      const gain = ctx.createGain();
      gain.gain.value = vol;
      src.connect(filter).connect(gain).connect(master);
      src.start(t0);
    }

    return {
      unlock() {
        ensure();
      },
      get muted() {
        return muted;
      },
      toggleMuted() {
        muted = !muted;
        return muted;
      },
      // A startled triple gobble: three fast wobbling blips.
      gobble() {
        for (let i = 0; i < 3; i++) {
          tone(620 - i * 60, 240, 0.11, "square", 0.16, i * 0.12);
          tone(310 - i * 30, 160, 0.11, "sawtooth", 0.07, i * 0.12);
        }
      },
      flap() {
        noise(0.14, 0.20, 900);
        noise(0.10, 0.12, 1400, 0.05);
      },
      step() {
        noise(0.03, 0.05, 500);
      },
      corn() {
        tone(660, 990, 0.09, "sine", 0.22);
      },
      golden() {
        tone(660, 660, 0.07, "triangle", 0.2);
        tone(880, 880, 0.07, "triangle", 0.2, 0.07);
        tone(1320, 1320, 0.12, "triangle", 0.22, 0.14);
      },
      nearMiss() {
        tone(1180, 1560, 0.08, "sine", 0.10);
      },
      hidden() {
        noise(0.25, 0.14, 600);
        tone(392, 392, 0.09, "triangle", 0.12, 0.02);
        tone(523, 523, 0.12, "triangle", 0.12, 0.11);
      },
      thud() {
        tone(160, 45, 0.22, "sine", 0.5);
        noise(0.18, 0.30, 300);
      },
      alarm() {
        tone(880, 880, 0.10, "square", 0.12);
        tone(880, 880, 0.10, "square", 0.12, 0.16);
      },
      caught() {
        tone(520, 520, 0.16, "sawtooth", 0.2);
        tone(440, 440, 0.16, "sawtooth", 0.2, 0.16);
        tone(349, 349, 0.16, "sawtooth", 0.2, 0.32);
        tone(233, 110, 0.5, "sawtooth", 0.22, 0.48);
      },
      escaped() {
        const notes = [523, 659, 784, 1046, 784, 1046, 1318];
        notes.forEach((f, i) => tone(f, f, 0.16, "triangle", 0.22, i * 0.11));
        noise(0.4, 0.06, 2400, 0.2);
      },
    };
  }

  return { createAudio };
})();
