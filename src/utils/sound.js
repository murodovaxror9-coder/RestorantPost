let ctx;

export function beep({ freq = 880, duration = 0.15, times = 1, gap = 0.16 } = {}) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    for (let n = 0; n < times; n++) {
      const t0 = ctx.currentTime + n * gap;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    }
  } catch {
    /* audio mavjud emas yoki brauzer tomonidan bloklangan */
  }
}
