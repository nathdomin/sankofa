import Phaser from 'phaser';

export const PALETTE = {
  gold: 0xf2b705,
  green: 0x1e7a3c,
  red: 0xc0392b,
  earth: 0x7a4a2a,
  black: 0x1a1a1a,
  cream: 0xf5e6c8,
  white: 0xffffff,
} as const;

export const PLAYER_COLORS = {
  skin: 0x6b4226,
  skinShadow: 0x4e2f1a,
  skinLight: 0x8a5a36,
  hair: 0x161210,
  hairLight: 0x3a2c24,
  eyeWhite: 0xf5f0e6,
  pupil: 0x1a1a1a,
  brow: 0x1a1210,
  mouth: 0x3a1a12,
  shirt: 0xf2b705,
  shirtShadow: 0xc48f00,
  shirtLight: 0xffd34d,
  pants: 0xf5e6c8,
  pantsShadow: 0xd4c09a,
  pantsFar: 0xb9a47c,
  cord: 0x1e7a3c,
  cordShadow: 0x125226,
  outline: 0x1f140c,
} as const;

export function toCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function darken(color: number, percent: number): number {
  return Phaser.Display.Color.ValueToColor(color).darken(percent).color;
}

export function lighten(color: number, percent: number): number {
  return Phaser.Display.Color.ValueToColor(color).lighten(percent).color;
}
