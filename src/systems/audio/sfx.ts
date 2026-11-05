import { noise, noteFreq, tone, type Ctx } from './synth';

/** Efeitos sonoros curtos: cada um agenda seus osciladores/ruídos a partir de `t` (segundos do contexto) */
type Effect = (ctx: Ctx, dest: AudioNode, t: number) => void;

/** Sequência de notas com um intervalo fixo entre elas */
function run(ctx: Ctx, dest: AudioNode, t: number, notes: readonly string[], gap: number, o: { type?: OscillatorType; vol?: number; dur?: number }): void {
  notes.forEach((n, i) => tone(ctx, dest, { freq: noteFreq(n), start: t + i * gap, dur: o.dur ?? gap * 1.6, type: o.type ?? 'square', vol: o.vol ?? 0.14 }));
}

export const SFX = {
  // movimentos
  jump: (ctx, dest, t) => tone(ctx, dest, { freq: 280, slideTo: 620, start: t, dur: 0.14, type: 'square', vol: 0.13 }),
  au: (ctx, dest, t) => {
    tone(ctx, dest, { freq: 380, slideTo: 860, start: t, dur: 0.2, type: 'square', vol: 0.13 });
    tone(ctx, dest, { freq: 570, slideTo: 1290, start: t + 0.04, dur: 0.18, type: 'triangle', vol: 0.1 });
  },
  swing: (ctx, dest, t) => {
    noise(ctx, dest, { start: t, dur: 0.24, freq: 500, freqTo: 2800, type: 'bandpass', q: 1.4, vol: 0.2, attack: 0.04 });
    tone(ctx, dest, { freq: 160, slideTo: 90, start: t, dur: 0.12, type: 'triangle', vol: 0.1 });
  },
  hit: (ctx, dest, t) => {
    noise(ctx, dest, { start: t, dur: 0.1, freq: 2200, type: 'highpass', vol: 0.22 });
    tone(ctx, dest, { freq: 200, slideTo: 55, start: t, dur: 0.16, type: 'square', vol: 0.18 });
    tone(ctx, dest, { freq: 1500, slideTo: 700, start: t, dur: 0.06, type: 'triangle', vol: 0.1 });
  },
  stomp: (ctx, dest, t) => {
    tone(ctx, dest, { freq: 420, slideTo: 140, start: t, dur: 0.13, type: 'square', vol: 0.16 });
    noise(ctx, dest, { start: t, dur: 0.05, freq: 900, vol: 0.14 });
  },
  hurt: (ctx, dest, t) => {
    tone(ctx, dest, { freq: 330, slideTo: 80, start: t, dur: 0.34, type: 'sawtooth', vol: 0.16 });
    noise(ctx, dest, { start: t, dur: 0.14, freq: 700, vol: 0.15 });
  },
  lose: (ctx, dest, t) => run(ctx, dest, t, ['E4', 'D4', 'B3', 'A3'], 0.13, { type: 'triangle', vol: 0.2, dur: 0.2 }),
  gameover: (ctx, dest, t) => run(ctx, dest, t, ['A4', 'F4', 'D4', 'A3', 'F3'], 0.2, { type: 'triangle', vol: 0.22, dur: 0.34 }),

  // coletáveis: um timbre para cada um
  collectSankofa: (ctx, dest, t) => {
    // sino dourado: duas notas com harmônicos
    for (const [i, n] of ['A5', 'E6'].entries()) {
      const f = noteFreq(n);
      tone(ctx, dest, { freq: f, start: t + i * 0.08, dur: 0.5, type: 'sine', vol: 0.15, release: 0.45 });
      tone(ctx, dest, { freq: f * 2.76, start: t + i * 0.08, dur: 0.22, type: 'sine', vol: 0.05, release: 0.2 });
    }
  },
  collectAlforria: (ctx, dest, t) => {
    // papel se abrindo e um sininho
    noise(ctx, dest, { start: t, dur: 0.1, freq: 5000, type: 'highpass', vol: 0.12 });
    tone(ctx, dest, { freq: noteFreq('C6'), start: t + 0.07, dur: 0.4, type: 'triangle', vol: 0.15, release: 0.34 });
    tone(ctx, dest, { freq: noteFreq('G6'), start: t + 0.15, dur: 0.35, type: 'sine', vol: 0.1, release: 0.3 });
  },
  collectPapel: (ctx, dest, t) => {
    // riscos de lápis e uma notinha clara
    for (let i = 0; i < 3; i++) noise(ctx, dest, { start: t + i * 0.035, dur: 0.03, freq: 3800 + i * 500, type: 'bandpass', q: 2, vol: 0.1 });
    tone(ctx, dest, { freq: noteFreq('E6'), start: t + 0.11, dur: 0.3, type: 'sine', vol: 0.14, release: 0.25 });
    tone(ctx, dest, { freq: noteFreq('B6'), start: t + 0.18, dur: 0.28, type: 'sine', vol: 0.08, release: 0.24 });
  },
  free: (ctx, dest, t) => {
    // correntes caindo e uma subida alegre
    for (const dt of [0, 0.05, 0.11]) tone(ctx, dest, { freq: 2400 + dt * 6000, start: t + dt, dur: 0.05, type: 'square', vol: 0.05, release: 0.04 });
    run(ctx, dest, t + 0.12, ['C5', 'E5', 'G5', 'C6', 'E6'], 0.07, { type: 'square', vol: 0.12, dur: 0.16 });
  },
  checkpoint: (ctx, dest, t) => run(ctx, dest, t, ['C5', 'E5', 'G5'], 0.08, { type: 'square', vol: 0.12, dur: 0.14 }),
  portal: (ctx, dest, t) => {
    run(ctx, dest, t, ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], 0.07, { type: 'sine', vol: 0.13, dur: 0.4 });
    noise(ctx, dest, { start: t, dur: 0.5, freq: 3000, freqTo: 9000, type: 'highpass', vol: 0.05, attack: 0.1 });
  },
  levelComplete: (ctx, dest, t) => {
    // fanfarra curta com cara de samba: batuque e metais de onda quadrada
    const pattern: Array<[string, number, number]> = [['C5', 0, 0.12], ['C5', 0.15, 0.12], ['E5', 0.3, 0.12], ['G5', 0.45, 0.14], ['E5', 0.62, 0.1], ['G5', 0.74, 0.1], ['C6', 0.88, 0.6]];
    for (const [n, at, dur] of pattern) {
      tone(ctx, dest, { freq: noteFreq(n), start: t + at, dur, type: 'square', vol: 0.12 });
      tone(ctx, dest, { freq: noteFreq(n) / 2, start: t + at, dur, type: 'triangle', vol: 0.12 });
    }
    for (const at of [0, 0.3, 0.6, 0.88]) tone(ctx, dest, { freq: 110, slideTo: 55, start: t + at, dur: 0.2, type: 'sine', vol: 0.3 });
  },

  // interface
  uiMove: (ctx, dest, t) => tone(ctx, dest, { freq: 540, start: t, dur: 0.05, type: 'square', vol: 0.07 }),
  uiConfirm: (ctx, dest, t) => {
    tone(ctx, dest, { freq: 620, start: t, dur: 0.06, type: 'square', vol: 0.09 });
    tone(ctx, dest, { freq: 930, start: t + 0.055, dur: 0.09, type: 'square', vol: 0.09 });
  },
  uiBack: (ctx, dest, t) => {
    tone(ctx, dest, { freq: 470, start: t, dur: 0.06, type: 'square', vol: 0.08 });
    tone(ctx, dest, { freq: 330, start: t + 0.055, dur: 0.09, type: 'square', vol: 0.08 });
  },
  type: (ctx, dest, t) => tone(ctx, dest, { freq: 330 + Math.random() * 90, start: t, dur: 0.03, type: 'triangle', vol: 0.05 }),
} as const satisfies Record<string, Effect>;

export type SfxName = keyof typeof SFX;
