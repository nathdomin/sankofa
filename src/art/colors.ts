import Phaser from 'phaser';

export interface GradientStop {
  at: number; // 0..1
  color: number;
}

export function lerpColor(a: number, b: number, t: number): number {
  const ca = Phaser.Display.Color.ValueToColor(a);
  const cb = Phaser.Display.Color.ValueToColor(b);
  const mixed = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 1000, Math.round(t * 1000));
  return Phaser.Display.Color.GetColor(mixed.r, mixed.g, mixed.b);
}

export function gradientAt(stops: readonly GradientStop[], t: number): number {
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const next = stops[i];
    if (t <= next.at) return lerpColor(prev.color, next.color, (t - prev.at) / (next.at - prev.at));
  }
  return stops[stops.length - 1].color;
}

/** Soma de senos com frequências inteiras: repete perfeitamente a cada `period` px */
export function periodicRidge(x: number, period: number, waves: ReadonlyArray<[amp: number, freq: number, phase: number]>): number {
  return waves.reduce((sum, [amp, freq, phase]) => sum + amp * Math.sin((2 * Math.PI * freq * x) / period + phase), 0);
}
