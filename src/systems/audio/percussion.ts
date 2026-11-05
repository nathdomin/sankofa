import { noise, tone, type Ctx } from './synth';

/*
 * Instrumentos da roda de capoeira e da bateria de samba, em versão "chiptune": cada um é um golpe
 * curto de oscilador e/ou ruído filtrado. `a` é a intensidade (0 a 1) do golpe.
 */

type Hit = (ctx: Ctx, dest: AudioNode, t: number, a: number) => void;

/** Surdo: o bumbo grave do samba */
const surdo: Hit = (ctx, dest, t, a) => {
  tone(ctx, dest, { freq: 120, slideTo: 52, slideS: 0.2, start: t, dur: 0.26, type: 'sine', vol: 0.55 * a, release: 0.2 });
  noise(ctx, dest, { start: t, dur: 0.04, freq: 220, type: 'lowpass', vol: 0.12 * a });
};

/** Atabaque: tambor de couro da capoeira */
const atabaque: Hit = (ctx, dest, t, a) => {
  tone(ctx, dest, { freq: 170, slideTo: 100, slideS: 0.12, start: t, dur: 0.2, type: 'sine', vol: 0.42 * a, release: 0.15 });
  noise(ctx, dest, { start: t, dur: 0.045, freq: 1100, vol: 0.1 * a, q: 0.8 });
};

/** Tamborim: estalo seco e agudo do samba */
const tamborim: Hit = (ctx, dest, t, a) => {
  noise(ctx, dest, { start: t, dur: 0.05, freq: 4200, vol: 0.2 * a, q: 3 });
  tone(ctx, dest, { freq: 1900, slideTo: 1400, start: t, dur: 0.035, type: 'triangle', vol: 0.07 * a });
};

/** Pandeiro: batida fechada (intensidade baixa) ou aberta, com platinelas (intensidade alta) */
const pandeiro: Hit = (ctx, dest, t, a) => {
  if (a > 0.7) {
    noise(ctx, dest, { start: t, dur: 0.11, freq: 3200, vol: 0.15 * a, q: 1.2 });
  } else {
    noise(ctx, dest, { start: t, dur: 0.04, freq: 6500, type: 'highpass', vol: 0.1 });
  }
  noise(ctx, dest, { start: t, dur: 0.07, freq: 9500, type: 'highpass', vol: 0.04 * a });
};

/** Agogô: dois sinos, um mais agudo (intensidade alta) e um mais grave */
const agogo: Hit = (ctx, dest, t, a) => {
  const f = a > 0.7 ? 1175 : 880;
  tone(ctx, dest, { freq: f, start: t, dur: 0.11, type: 'square', vol: 0.06, release: 0.09 });
  tone(ctx, dest, { freq: f * 2.76, start: t, dur: 0.06, type: 'sine', vol: 0.03, release: 0.05 });
};

/** Palmas da roda */
const palmas: Hit = (ctx, dest, t, a) => {
  noise(ctx, dest, { start: t, dur: 0.07, freq: 1800, vol: 0.24 * a, q: 0.7 });
  noise(ctx, dest, { start: t + 0.013, dur: 0.05, freq: 2400, vol: 0.14 * a, q: 0.8 });
};

/** Caxixi: o chocalho que acompanha o berimbau */
const caxixi: Hit = (ctx, dest, t, a) => {
  noise(ctx, dest, { start: t, dur: 0.1, freq: 7000, type: 'highpass', vol: 0.1 * a, attack: 0.02 });
};

/** Berimbau: "dong" (corda solta) e "ding" (corda presa, mais aguda); o filtro que sobe imita a cabaça abrindo */
export function berimbau(ctx: Ctx, dest: AudioNode, t: number, a: number, root: number, high: boolean): void {
  const f = high ? root * 1.26 : root;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 4;
  filter.frequency.setValueAtTime(f * 1.6, t);
  filter.frequency.exponentialRampToValueAtTime(f * 3.4, t + 0.22);
  filter.connect(dest);
  tone(ctx, filter, { freq: f, start: t, dur: 0.42, type: 'sawtooth', vol: 0.5 * a, release: 0.34 });
  tone(ctx, dest, { freq: f * 2.01, start: t, dur: 0.3, type: 'sine', vol: 0.06 * a, release: 0.25 });
  noise(ctx, dest, { start: t, dur: 0.03, freq: 3000, vol: 0.07 * a });
}

export const PERCUSSION = { surdo, atabaque, tamborim, pandeiro, agogo, palmas, caxixi } as const;
export type PercussionName = keyof typeof PERCUSSION;
