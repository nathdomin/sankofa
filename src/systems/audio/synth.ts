/*
 * Peças básicas de síntese: tom com envelope, rajada de ruído filtrado e conversão de nome de nota
 * ("A4", "F#3") em frequência. Tudo recebe um BaseAudioContext, então roda também em
 * OfflineAudioContext (usado para conferir a mistura sem tocar).
 */

export type Ctx = BaseAudioContext;

export interface ToneOpts {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  attack?: number;
  release?: number;
  /** desliza a frequência até este valor ao longo de `slideS` (padrão: a duração toda) */
  slideTo?: number;
  slideS?: number;
}

export function tone(ctx: Ctx, dest: AudioNode, o: ToneOpts): void {
  const vol = o.vol ?? 0.2;
  const attack = o.attack ?? 0.004;
  const release = Math.min(o.release ?? 0.06, o.dur * 0.6);
  const end = o.start + o.dur;

  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'square';
  osc.frequency.setValueAtTime(o.freq, o.start);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, o.start + (o.slideS ?? o.dur));

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, o.start);
  gain.gain.linearRampToValueAtTime(vol, o.start + attack);
  gain.gain.setValueAtTime(vol, Math.max(o.start + attack, end - release));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain).connect(dest);
  osc.start(o.start);
  osc.stop(end + 0.02);
}

export interface NoiseOpts {
  start: number;
  dur: number;
  freq: number;
  type?: BiquadFilterType;
  vol?: number;
  q?: number;
  /** varre o filtro até esta frequência durante a rajada */
  freqTo?: number;
  attack?: number;
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(ctx: Ctx): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

export function noise(ctx: Ctx, dest: AudioNode, o: NoiseOpts): void {
  const vol = o.vol ?? 0.2;
  const attack = o.attack ?? 0.002;
  const end = o.start + o.dur;

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = o.type ?? 'bandpass';
  filter.Q.value = o.q ?? 1;
  filter.frequency.setValueAtTime(o.freq, o.start);
  if (o.freqTo) filter.frequency.exponentialRampToValueAtTime(o.freqTo, end);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, o.start);
  gain.gain.linearRampToValueAtTime(vol, o.start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  src.connect(filter).connect(gain).connect(dest);
  src.start(o.start, Math.random() * 0.4);
  src.stop(end + 0.02);
}

const SEMITONES: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "A4" → 440; aceita sustenido (#) e bemol (b) */
export function noteFreq(name: string): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`Nota inválida: ${name}`);
  const [, letter, accidental, octave] = match;
  const semis = SEMITONES[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  const midi = 12 * (Number(octave) + 1) + semis;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
