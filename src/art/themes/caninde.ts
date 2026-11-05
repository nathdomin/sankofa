import Phaser from 'phaser';
import { darken, lighten } from '../../config/palette';
import { TILE_SIZE } from '../../config/physics';
import type { LevelConfig, LevelPalette } from '../../data/levels';
import { gradientAt, lerpColor, periodicRidge, type GradientStop } from '../colors';
import { PARALLAX } from '../parallax';
import type { Draw } from '../tileArt';
import { BG_H, BG_W, CLOUDS_H, FAR_H, FG_H, HILLS_H, MID_H, NEAR_H } from './quilombo';

type G = Phaser.GameObjects.Graphics;
type Rng = Phaser.Math.RandomDataGenerator;

// Canindé (século XX): manhã clara sobre a favela de barracos coloridos de zinco e madeira;
// no fim da fase o cenário vira a cidade moderna, com a biblioteca. As camadas `-city`
// entram por cima das da favela (ver `crossfade` em Scenery.ts).
export const SUN_CANINDE = { x: 200, y: 170, glowSize: 300 } as const;

const SKY: readonly GradientStop[] = [
  { at: 0, color: 0x72bde8 },
  { at: 0.45, color: 0xa6daf2 },
  { at: 0.8, color: 0xdcf0f4 },
  { at: 1, color: 0xfdf0d2 },
];

const ZINC = 0x9fb0bd;
const BARRACO_COLORS = [0xd9573a, 0xe8a33d, 0x3f8fbf, 0x4faa7a, 0xb85fa0, 0x7fcfc4, 0xe9d8a6] as const;
export const BARRACO_VARIANTS = 4;
const BARRACO_WALLS = [0xd9573a, 0x3f8fbf, 0xe8a33d, 0x4faa7a] as const;

function paintSky(g: G): void {
  const band = 4;
  for (let y = 0; y < BG_H; y += band) g.fillStyle(gradientAt(SKY, y / BG_H)).fillRect(0, y, BG_W, band);
  const { x, y } = SUN_CANINDE;
  g.fillStyle(0xfff3c0, 0.5).fillCircle(x, y, 60);
  g.fillStyle(0xfffbe6).fillCircle(x, y, 38);
}

function paintSunGlow(g: G): void {
  const c = SUN_CANINDE.glowSize / 2;
  for (let r = c; r > 44; r -= 10) g.fillStyle(0xfff6d0, 0.045).fillCircle(c, c, r);
}

function paintClouds(g: G): void {
  const clouds: Array<[number, number, number]> = [
    [120, 80, 200], [380, 130, 150], [560, 60, 220], [800, 150, 190], [940, 70, 120], [260, 240, 140], [690, 260, 130],
  ];
  for (const [x, y, w] of clouds) {
    for (const dx of [-BG_W, 0, BG_W]) {
      g.fillStyle(0xb9d6e8, 0.55).fillEllipse(x + dx, y + 8, w, 18);
      g.fillStyle(0xffffff, 0.9).fillEllipse(x + dx, y, w * 0.9, 20);
      g.fillStyle(0xffffff, 0.95).fillEllipse(x + dx - w * 0.15, y - 9, w * 0.5, 16).fillEllipse(x + dx + w * 0.2, y - 6, w * 0.4, 14);
    }
  }
}

/** Skyline distante da cidade, em duas fileiras azuladas */
function paintFar(g: G): void {
  const rng = new Phaser.Math.RandomDataGenerator(['far-caninde']);
  const rows = [
    { color: 0xb6cbdc, h: [120, 200] as [number, number], w: [22, 40] as [number, number] },
    { color: 0x9db8cd, h: [90, 170] as [number, number], w: [26, 46] as [number, number] },
  ];
  for (const row of rows) {
    let x = rng.between(0, 20);
    while (x < BG_W - 50) {
      const w = rng.between(...row.w);
      const h = rng.between(...row.h);
      const top = FAR_H - h;
      g.fillStyle(row.color).fillRect(x, top, w, h);
      g.fillStyle(lighten(row.color, 10)).fillRect(x, top, w, 2);
      g.fillStyle(darken(row.color, 8)).fillRect(x + w - 3, top, 3, h);
      g.fillStyle(0xffffff, 0.18);
      for (let wy = top + 8; wy < FAR_H - 30; wy += 9) for (let wx = x + 4; wx < x + w - 5; wx += 7) g.fillRect(wx, wy, 3, 4);
      if (rng.frac() < 0.4) g.fillStyle(darken(row.color, 25)).fillRect(x + w / 2, top - 14, 1, 14);
      x += w + rng.between(2, 12);
    }
  }
  for (let i = 0; i < 6; i++) g.fillStyle(0xeaf5f8, 0.1 + i * 0.05).fillRect(0, FAR_H - 60 + i * 10, BG_W, 10);
}

/** Dá "profundidade" a uma cor: mistura com a cor da neblina */
const fog = (color: number, haze: number, amount: number): number => lerpColor(color, haze, amount);

/** Cálculo da faixa de mistura (em x da textura) de uma camada que anda com o fator `factor` */
function mixRange(factor: number, t: Transition): { x0: number; x1: number } {
  const at = (tile: number): number => factor * (tile * TILE_SIZE - BG_W / 2) + BG_W / 2;
  return { x0: at(t.from), x1: at(t.to) };
}

const smooth = (p: number): number => p * p * (3 - 2 * p);

/** 0 antes da faixa, 1 depois dela, curva suave no meio */
const mixAt = (x: number, r: { x0: number; x1: number }): number => smooth(Phaser.Math.Clamp((x - r.x0) / (r.x1 - r.x0), 0, 1));

/** Morro de casinhas coloridas que vira, aos poucos, quarteirões de prédios médios e arvoredo */
function paintHillsLong(g: G, texW: number, texH: number, r: { x0: number; x1: number }): void {
  const waves: Array<[number, number, number]> = [[22, 1, 0.7], [9, 3, 1.8]];
  const ridgeY = (x: number): number => Math.round(texH - 120 - periodicRidge(x, BG_W, waves));
  const rng = new Phaser.Math.RandomDataGenerator(['hills-caninde']);
  const end = Math.min(texW, r.x1 + 40);
  for (let x = 0; x < end; x++) g.fillStyle(0x86a58e).fillRect(x, ridgeY(x), 1, texH - ridgeY(x));
  for (let row = 0; row < 9; row++) {
    let x = rng.between(0, 8);
    while (x < end - 16) {
      const w = rng.between(9, 15);
      const h = rng.between(8, 11);
      const y = ridgeY(x + w / 2) + 5 + row * 12;
      if (y + h < texH - 2 && rng.frac() >= mixAt(x, r)) {
        const wall = fog(rng.pick([...BARRACO_COLORS]), 0xcfe0e8, 0.5);
        g.fillStyle(wall).fillRect(x, y, w, h);
        g.fillStyle(darken(wall, 14)).fillRect(x, y, w, 2);
        g.fillStyle(0x6c7a86, 0.7).fillRect(x - 1, y - 2, w + 2, 2);
        g.fillStyle(0x3a4655, 0.6).fillRect(x + 2, y + 4, 2, 3);
      }
      x += w + rng.between(0, 3);
    }
  }
  // cidade: blocos que crescem conforme a mistura avança
  const colors = [0x9fb2c2, 0x8da3b5, 0xa9bccb, 0x95aabb] as const;
  let x = r.x0 + (r.x1 - r.x0) * 0.25;
  while (x < texW) {
    const w = rng.between(24, 42);
    const grow = 0.45 + 0.55 * mixAt(x, r);
    const h = Math.round(rng.between(46, 110) * grow);
    const color = rng.pick([...colors]);
    const top = texH - h;
    g.fillStyle(color).fillRect(x, top, w, h);
    g.fillStyle(lighten(color, 10)).fillRect(x, top, w, 2);
    g.fillStyle(0xdbe8f0, 0.45);
    for (let wy = top + 8; wy < texH - 24; wy += 10) for (let wx = x + 4; wx < x + w - 5; wx += 8) g.fillRect(wx, wy, 4, 5);
    x += w + rng.between(0, 4);
  }
  for (let tx = r.x0; tx < texW; tx += 22) g.fillStyle(0x7fa889).fillEllipse(tx + rng.between(0, 10), texH - 8, rng.between(24, 36), 22);
  for (let i = 0; i < 5; i++) g.fillStyle(0xeaf5f8, 0.08 + i * 0.04).fillRect(0, texH - 50 + i * 10, texW, 10);
}

// --- Barracos (favela) ---

/** Barraco de tábuas coloridas com telhado de zinco. `fine`: com mais detalhes (planos próximos) */
function paintBarraco(g: G, rng: Rng, x: number, baseY: number, w: number, h: number, wall: number, fine: boolean, pipe = false): void {
  const top = baseY - h;
  g.fillStyle(darken(wall, 22)).fillRect(x, top, w, h);
  g.fillStyle(wall).fillRect(x + 1, top, w - 2, h - 1);
  // tábuas na vertical
  for (let px = x + 4; px < x + w - 2; px += fine ? 5 : 8) {
    g.fillStyle(darken(wall, 14)).fillRect(px, top + 1, 1, h - 2);
    if (fine) g.fillStyle(lighten(wall, 12), 0.5).fillRect(px + 1, top + 1, 1, h - 2);
  }
  // remendo de outra cor
  if (rng.frac() < 0.55) {
    const pw = rng.between(8, Math.max(9, Math.round(w * 0.2)));
    g.fillStyle(rng.pick([...BARRACO_COLORS])).fillRect(x + rng.between(2, Math.max(3, Math.round(w * 0.4))), top + rng.between(3, Math.max(4, Math.round(h * 0.25))), pw, rng.between(10, 16));
  }
  // porta e janela
  const dh = Math.round(h * 0.46);
  const dw = Math.max(7, Math.round(w * 0.17));
  const dx = x + Math.round(w * 0.62);
  g.fillStyle(darken(wall, 50)).fillRect(dx, baseY - dh, dw, dh);
  if (fine) g.fillStyle(0xd8c89a).fillRect(dx + dw - 3, baseY - dh / 2, 1, 2);
  const ww = Math.max(7, Math.round(w * 0.2));
  const wh = Math.max(7, Math.round(h * 0.2));
  const wx = x + Math.round(w * 0.16);
  const wy = top + Math.round(h * 0.22);
  g.fillStyle(0xf2ead8).fillRect(wx - 1, wy - 1, ww + 2, wh + 2);
  g.fillStyle(rng.frac() < 0.3 ? 0xf2c879 : 0x2f3b4a).fillRect(wx, wy, ww, wh);
  if (fine) g.fillStyle(0xc0392b, 0.85).fillRect(wx, wy, 3, wh); // cortina
  // telhado de zinco: duas chapas sobrepostas
  g.fillStyle(ZINC).fillRect(x - 3, top - 5, w + 6, 6);
  g.fillStyle(darken(ZINC, 10)).fillRect(x + 2, top - 9, w - 4, 4);
  for (let rx = x - 3; rx < x + w + 3; rx += 3) {
    g.fillStyle(darken(ZINC, 16)).fillRect(rx, top - 5, 1, 6);
    if (rx > x + 1 && rx < x + w - 3) g.fillRect(rx, top - 9, 1, 4);
  }
  g.fillStyle(lighten(ZINC, 18)).fillRect(x - 3, top - 5, w + 6, 1).fillRect(x + 2, top - 9, w - 4, 1);
  // pneu sobre o telhado, caixa d'água ou antena
  const extra = rng.frac();
  if (extra < 0.3) {
    g.fillStyle(0x23262c).fillCircle(x + w * 0.3, top - 13, 4);
    g.fillStyle(0x4a4f58).fillCircle(x + w * 0.3, top - 13, 2);
  } else if (extra < 0.6) {
    const tx = x + Math.round(w * 0.72);
    g.fillStyle(0x5a4a3a).fillRect(tx, top - 14, 1, 5).fillRect(tx + 9, top - 14, 1, 5);
    g.fillStyle(0x2c78b8).fillRect(tx - 1, top - 25, 12, 11);
    g.fillStyle(0x5aa6e0).fillRect(tx - 1, top - 25, 12, 2).fillRect(tx + 1, top - 25, 2, 11);
  } else {
    const ax = x + Math.round(w * 0.25);
    g.fillStyle(0x3a4350).fillRect(ax, top - 26, 1, 17).fillRect(ax - 4, top - 24, 9, 1).fillRect(ax - 3, top - 20, 7, 1);
  }
  if (pipe) {
    g.fillStyle(0x3a3d44).fillRect(x + w - 14, top - 22, 4, 14).fillRect(x + w - 15, top - 24, 6, 3);
  }
}

const MID_BASE = MID_H - 90;
const NEAR_BASE = NEAR_H - 84;

// --- Cidade moderna ---

interface TowerStyle {
  bodies: readonly number[];
  glass: number;
  glow: number;
  haze: number;
  hazeAlpha: number;
  litChance: number;
}

function paintTower(g: G, rng: Rng, x: number, baseY: number, w: number, h: number, s: TowerStyle): void {
  const top = baseY - h;
  const body = rng.pick([...s.bodies]);
  g.fillStyle(body).fillRect(x, top, w, h);
  g.fillStyle(lighten(body, 12)).fillRect(x, top, w, 2);
  g.fillStyle(darken(body, 16)).fillRect(x, top, 2, h).fillRect(x + w - 2, top, 2, h);
  // janelas de vidro em grade, com reflexos e algumas acesas
  for (let wy = top + 8; wy < baseY - 12; wy += 12) {
    for (let wx = x + 5; wx < x + w - 6; wx += 8) {
      const lit = rng.frac() < s.litChance;
      g.fillStyle(lit ? s.glow : s.glass).fillRect(wx, wy, 5, 8);
      if (!lit) g.fillStyle(0xffffff, 0.18).fillRect(wx, wy, 5, 2);
    }
  }
  // coroamento: casa de máquinas e antena
  g.fillStyle(darken(body, 20)).fillRect(x + 3, top - 5, w - 6, 5);
  if (rng.frac() < 0.4) g.fillStyle(darken(body, 10)).fillRect(x + Math.round(w * 0.2), top - 14, Math.round(w * 0.6), 9);
  if (rng.frac() < 0.5) g.fillStyle(darken(body, 30)).fillRect(x + Math.round(w / 2), top - 24, 1, 20);
  g.fillStyle(s.haze, s.hazeAlpha).fillRect(x - 1, top - 26, w + 2, h + 26);
}

const MID_TOWERS: TowerStyle = {
  bodies: [0xaabfcf, 0xc3d1da, 0x9fb3c4, 0xd6dde0],
  glass: 0x587a96,
  glow: 0xf6e3a5,
  haze: 0xcfe6f0,
  hazeAlpha: 0.3,
  litChance: 0.05,
};

const NEAR_TOWERS: TowerStyle = {
  bodies: [0x5f7283, 0x6c7f90, 0x536575],
  glass: 0x2f4a60,
  glow: 0xffe29a,
  haze: 0x4a5d6e,
  hazeAlpha: 0.08,
  litChance: 0.16,
};

interface MixedRow {
  barraco: { w: [number, number]; h: [number, number]; haze: number; hazeAlpha: number; fine: boolean };
  tower: { w: [number, number]; h: [number, number]; style: TowerStyle };
  gap: [number, number];
  under: number;
  lead: [number, number];
}

/**
 * Fileira comprida de construções: no começo só barracos, no fim só torres, e na faixa de mistura cada
 * construção sorteia o tipo com chance crescente. Assim o cenário "cresce" em vez de trocar de uma vez.
 */
function paintMixedRow(g: G, seed: string, baseY: number, texW: number, texH: number, r: { x0: number; x1: number }, row: MixedRow): void {
  const rng = new Phaser.Math.RandomDataGenerator([seed]);
  g.fillStyle(row.under).fillRect(0, baseY, texW, texH - baseY);
  let x = rng.between(...row.lead);
  while (x < texW - 20) {
    if (rng.frac() < mixAt(x, r)) {
      const w = rng.between(...row.tower.w);
      paintTower(g, rng, x, baseY, w, rng.between(...row.tower.h), row.tower.style);
      x += w + rng.between(...row.gap);
    } else {
      const w = rng.between(...row.barraco.w);
      const h = rng.between(...row.barraco.h);
      paintBarraco(g, rng, x, baseY, w, h, rng.pick([...BARRACO_COLORS]), row.barraco.fine);
      g.fillStyle(row.barraco.haze, row.barraco.hazeAlpha).fillRect(x - 3, baseY - h - 28, w + 6, h + 28);
      x += w + rng.between(...row.gap);
    }
  }
}

const MID_ROW: MixedRow = {
  barraco: { w: [46, 70], h: [56, 90], haze: 0xcfe6f0, hazeAlpha: 0.34, fine: false },
  tower: { w: [40, 64], h: [80, 140], style: MID_TOWERS },
  gap: [0, 3],
  under: 0x6b7785,
  lead: [0, 0],
};

const NEAR_ROW: MixedRow = {
  barraco: { w: [74, 110], h: [86, 124], haze: 0x6f879a, hazeAlpha: 0.1, fine: true },
  tower: { w: [56, 90], h: [100, 140], style: NEAR_TOWERS },
  gap: [70, 170],
  under: 0x3d4856,
  lead: [6, 40],
};

// --- Primeiro plano ---

/** Tapume de chapas onduladas de zinco, passando rápido */
function paintFgFavela(g: G): void {
  const rng = new Phaser.Math.RandomDataGenerator(['fg-caninde']);
  const colors = [0x4f8fbf, 0x3f7f5a, 0xc0583a, 0xd9a93d, 0x8a929a] as const;
  let x = 0;
  while (x < BG_W) {
    let w = rng.between(30, 50);
    if (BG_W - (x + w) < 30) w = BG_W - x;
    const top = FG_H - rng.between(30, 46);
    const color = rng.pick([...colors]);
    g.fillStyle(darken(color, 25)).fillRect(x, top, w, FG_H - top);
    g.fillStyle(color).fillRect(x + 1, top, w - 2, FG_H - top);
    for (let px = x + 2; px < x + w - 1; px += 4) {
      g.fillStyle(darken(color, 16)).fillRect(px, top + 1, 1, FG_H - top - 1);
      g.fillStyle(lighten(color, 14), 0.6).fillRect(px + 1, top + 1, 1, FG_H - top - 1);
    }
    g.fillStyle(lighten(color, 22)).fillRect(x, top, w, 2);
    g.fillStyle(0x3a3d44).fillRect(x + 4, top + 5, 2, 2).fillRect(x + w - 6, top + 5, 2, 2); // pregos
    x += w;
  }
}

/** Guarda-corpo moderno de vidro e aço, com postes */
function paintFgCity(g: G): void {
  const steel = 0x39465a;
  g.fillStyle(steel).fillRect(0, FG_H - 8, BG_W, 8);
  g.fillStyle(0x6d7f95).fillRect(0, FG_H - 8, BG_W, 2);
  g.fillStyle(0x8fc7e0, 0.35).fillRect(0, FG_H - 40, BG_W, 32);
  g.fillStyle(0xffffff, 0.18);
  for (let x = 6; x < BG_W; x += 48) g.fillTriangle(x, FG_H - 40, x + 14, FG_H - 40, x - 6, FG_H - 8).fillTriangle(x + 14, FG_H - 40, x + 8, FG_H - 8, x - 6, FG_H - 8);
  g.fillStyle(steel).fillRect(0, FG_H - 42, BG_W, 3);
  for (let x = 0; x < BG_W; x += 96) g.fillRect(x, FG_H - 46, 5, 38).fillStyle(0x9db3c5).fillRect(x, FG_H - 46, 5, 2).fillStyle(steel);
}

// --- Elementos do cenário (marcos e enfeites) ---

/** Barraco grande 128x128 (varia só a cor da parede), com chaminé de fogão a lenha */
function paintBarracoLandmark(g: G, variant: number): void {
  const rng = new Phaser.Math.RandomDataGenerator([`barraco-landmark-${variant}`]);
  paintBarraco(g, rng, 8, 126, 112, 84, BARRACO_WALLS[variant % BARRACO_WALLS.length], true, true);
}

/** Varal 96x80: dois postes de madeira e roupas penduradas */
function paintVaral(g: G): void {
  const rng = new Phaser.Math.RandomDataGenerator(['varal']);
  const lineY = (x: number): number => 18 + Math.round(6 * Math.sin((Math.PI * (x - 7)) / 84));
  g.fillStyle(0x6b4423).fillRect(5, 12, 4, 68).fillRect(87, 12, 4, 68);
  g.fillStyle(0x8d5f35).fillRect(5, 12, 1, 68).fillRect(87, 12, 1, 68);
  for (let x = 7; x <= 89; x++) g.fillStyle(0xd8d4c8).fillRect(x, lineY(x), 1, 1);
  const colors = [0xc0392b, 0xf2b705, 0x3f8fbf, 0xf5e6c8, 0x4faa7a, 0xb85fa0];
  for (const cx of [16, 32, 50, 68]) {
    const y = lineY(cx);
    const c = rng.pick(colors);
    g.fillStyle(darken(c, 18)).fillRect(cx - 2, y + 1, 14, 16);
    g.fillStyle(c).fillRect(cx - 1, y + 1, 12, 15);
    g.fillStyle(c).fillRect(cx - 5, y + 1, 4, 6).fillRect(cx + 11, y + 1, 4, 6);
    g.fillStyle(0x3a3d44).fillRect(cx + 1, y - 1, 2, 3).fillRect(cx + 7, y - 1, 2, 3);
  }
}

/** Poste moderno 20x84 com luminária de LED */
function paintLamp(g: G): void {
  const steel = 0x4a5666;
  g.fillStyle(0xdff4ff, 0.12).fillCircle(15, 10, 14);
  g.fillStyle(0xdff4ff, 0.18).fillCircle(15, 10, 8);
  g.fillStyle(steel).fillRect(4, 10, 3, 70).fillRect(1, 78, 9, 6);
  g.fillStyle(steel).fillRect(4, 6, 13, 3).fillRect(14, 6, 3, 5);
  g.fillStyle(0xf4fbff).fillRect(11, 9, 8, 3);
  g.fillStyle(0x9db3c5).fillRect(4, 6, 13, 1);
}

/** Fardo de papel prensado 22x20 (reciclagem) */
function paintCrate(g: G): void {
  g.fillStyle(0x8a7a5a).fillRect(0, 0, 22, 20);
  g.fillStyle(0xe8dfc8).fillRect(1, 1, 20, 18);
  g.fillStyle(0xc9bd9f);
  for (const y of [4, 8, 12, 16]) g.fillRect(1, y, 20, 1);
  g.fillStyle(0x6b5a3e).fillRect(5, 1, 2, 18).fillRect(15, 1, 2, 18);
  g.fillStyle(0x3f8fbf).fillRect(9, 5, 5, 4);
  g.fillStyle(0xffffff).fillRect(1, 1, 20, 1);
}

/** Tambor azul 18x22 */
function paintBarrel(g: G): void {
  g.fillStyle(0x1f4f7d).fillEllipse(9, 11, 18, 22);
  g.fillStyle(0x2f6fa8).fillEllipse(9, 11, 14, 20);
  g.fillStyle(0x1f4f7d).fillRect(1, 6, 16, 2).fillRect(1, 14, 16, 2);
  g.fillStyle(0x5aa0d6).fillRect(5, 3, 2, 16);
}

/** Biblioteca 240x170: pilotis, parede de vidro com estantes acesas, laje e o livro dourado */
function paintLibrary(g: G): void {
  const W = 240;
  const slab = 0xe6ebee;
  const shade = 0xb4bfc7;
  // degraus
  for (let i = 0; i < 3; i++) g.fillStyle(i % 2 ? shade : slab).fillRect(i * 8, 164 - i * 5, W - i * 16, 6);
  // parede de vidro
  g.fillStyle(0x4d7a95).fillRect(24, 66, W - 48, 82);
  for (let y = 0; y < 82; y += 4) g.fillStyle(lerpColor(0x9ed2ea, 0x5f9cc0, y / 82)).fillRect(26, 68 + y, W - 52, 4);
  // estantes e luzes quentes por trás do vidro
  g.fillStyle(0x35546a);
  for (const y of [90, 112, 134]) g.fillRect(26, y, W - 52, 2);
  const rng = new Phaser.Math.RandomDataGenerator(['library']);
  for (let x = 30; x < W - 36; x += 9) {
    for (const y of [78, 100, 122]) if (rng.frac() < 0.55) g.fillStyle(rng.pick([0xf2b705, 0xc0392b, 0x1e7a3c, 0xf5e6c8])).fillRect(x, y, 5, 10);
  }
  g.fillStyle(0xffe9a8, 0.18).fillRect(26, 68, W - 52, 78);
  // reflexos e montantes
  g.fillStyle(0xffffff, 0.16);
  for (const x of [50, 120, 190]) g.fillTriangle(x, 68, x + 22, 68, x - 16, 146).fillTriangle(x + 22, 68, x + 6, 146, x - 16, 146);
  for (let x = 24; x <= W - 24; x += 24) g.fillStyle(slab).fillRect(x - 1, 66, 3, 82);
  g.fillStyle(slab).fillRect(24, 106, W - 48, 3);
  // porta central rebaixada
  g.fillStyle(0x2a3d4d).fillRect(W / 2 - 22, 100, 44, 48);
  // laje em balanço e pilotis
  g.fillStyle(shade).fillRect(8, 54, W - 16, 14);
  g.fillStyle(slab).fillRect(8, 54, W - 16, 11);
  g.fillStyle(lighten(slab, 6)).fillRect(8, 54, W - 16, 2);
  for (const cx of [14, 70, 164, 220]) {
    g.fillStyle(shade).fillRect(cx - 1, 66, 8, 84);
    g.fillStyle(slab).fillRect(cx, 66, 6, 84);
  }
  // letreiro escuro com o livro aberto
  g.fillStyle(0x2f3d4c).fillRect(72, 14, 96, 38);
  g.fillStyle(0x4a5c70).fillRect(72, 14, 96, 3);
  g.fillStyle(0xf2b705).fillPoints([{ x: 120, y: 42 }, { x: 94, y: 37 }, { x: 94, y: 22 }, { x: 120, y: 27 }], true);
  g.fillStyle(0xffd24a).fillPoints([{ x: 120, y: 42 }, { x: 146, y: 37 }, { x: 146, y: 22 }, { x: 120, y: 27 }], true);
  g.fillStyle(0x7a5a10).fillRect(119, 27, 2, 15);
  g.fillStyle(0x7a5a10);
  for (const y of [28, 32]) g.fillRect(98, y, 18, 1).fillRect(124, y, 18, 1);
}

/** Portal 48x64: porta de vidro da biblioteca. Trancado = grade de enrolar fechada e apagada */
function paintLibraryDoor(g: G, open: boolean): void {
  const slab = open ? 0xe6ebee : 0xa2abb1;
  const shade = open ? 0xb4bfc7 : 0x7a838a;
  const W = 48;
  // moldura
  g.fillStyle(shade).fillRect(0, 12, W, 52);
  g.fillStyle(slab).fillRect(1, 12, W - 2, 51);
  // letreiro com o livro
  g.fillStyle(open ? 0x2f3d4c : 0x3a444c).fillRect(6, 0, 36, 14);
  const gold = open ? 0xf2b705 : 0x8a8564;
  g.fillStyle(gold).fillPoints([{ x: 24, y: 11 }, { x: 13, y: 9 }, { x: 13, y: 3 }, { x: 24, y: 5 }], true);
  g.fillStyle(open ? 0xffd24a : 0x9a9570).fillPoints([{ x: 24, y: 11 }, { x: 35, y: 9 }, { x: 35, y: 3 }, { x: 24, y: 5 }], true);
  // vão
  g.fillStyle(shade).fillRect(6, 18, 36, 46);
  if (open) {
    for (let y = 0; y < 46; y += 4) g.fillStyle(lerpColor(0xfff4d0, 0xffc94a, y / 46)).fillRect(8, 20 + y, 32, 4);
    g.fillStyle(0xffffff, 0.35).fillTriangle(8, 20, 22, 20, 8, 62);
    // folhas de vidro abertas nas laterais
    g.fillStyle(0x8fc7e0, 0.9).fillRect(8, 20, 3, 42).fillRect(37, 20, 3, 42);
    g.fillStyle(0xe6ebee).fillRect(23, 18, 2, 3);
  } else {
    g.fillStyle(0x6b757c).fillRect(8, 20, 32, 42);
    for (let y = 22; y < 62; y += 4) g.fillStyle(0x59636a).fillRect(8, y, 32, 1);
    g.fillStyle(0x8a949b).fillRect(8, 20, 32, 2).fillRect(8, 60, 32, 2);
    g.fillStyle(0x3a444c).fillRect(21, 54, 6, 5);
  }
  g.fillStyle(shade).fillRect(0, 60, W, 4);
}

// --- Prédios sobre os tiles sólidos ---

/**
 * Fachada de w x h px sobre os blocos sólidos. Variantes: 0 viaduto de concreto com grafite e faixa de aviso,
 * 1 torre de vidro, 2 prédio de apartamentos de alvenaria, 3 prédio branco de janelas em fita.
 */
export function paintBuilding(g: G, w: number, h: number, variant: number): void {
  const rng = new Phaser.Math.RandomDataGenerator([`building-caninde-${variant}-${w}x${h}`]);
  switch (variant % 4) {
    case 0: {
      const concrete = 0x9ba1a5;
      g.fillStyle(concrete).fillRect(0, 0, w, h);
      g.fillStyle(darken(concrete, 12)).fillRect(0, 0, 3, h).fillRect(w - 3, 0, 3, h);
      for (let y = 64; y < h; y += 64) g.fillStyle(darken(concrete, 22)).fillRect(0, y, w, 2);
      for (let x = 96; x < w; x += 96) g.fillStyle(darken(concrete, 22)).fillRect(x, 0, 2, h);
      // manchas de ferrugem escorrendo
      for (let i = 0; i < 9; i++) g.fillStyle(0x8a6a55, 0.28).fillRect(rng.between(4, w - 8), rng.between(0, h - 120), rng.between(2, 4), rng.between(40, 120));
      // mural de triângulos nas cores do jogo (padrão de tecido africano), como um grafite de rua
      const gy = h - 92;
      g.fillStyle(0x23262c).fillRect(6, gy - 4, w - 12, 40);
      g.fillStyle(0xf5e6c8).fillRect(8, gy - 2, w - 16, 36);
      const cycle = [0xc0392b, 0xf2b705, 0x1e7a3c];
      for (let i = 0, x = 8; x + 16 <= w - 8; i++, x += 16) {
        g.fillStyle(cycle[i % 3]).fillTriangle(x, gy + 32, x + 16, gy + 32, x + 8, gy + 2);
        g.fillStyle(cycle[(i + 1) % 3]).fillTriangle(x + 4, gy + 32, x + 12, gy + 32, x + 8, gy + 16);
      }
      g.fillStyle(0x23262c).fillRect(8, gy + 32, w - 16, 2);
      // faixa de aviso (amarelo e preto) na borda de baixo
      g.fillStyle(0x23262c).fillRect(0, h - 14, w, 14);
      g.fillStyle(0xf2b705);
      for (let x = -14; x < w; x += 16) g.fillPoints([{ x: x + 6, y: h - 14 }, { x: x + 14, y: h - 14 }, { x: x + 8, y: h }, { x: x, y: h }], true);
      g.fillStyle(0x15171b).fillRect(0, h - 3, w, 3);
      break;
    }
    case 1: {
      const body = 0x5d8aa8;
      g.fillStyle(body).fillRect(0, 0, w, h);
      for (let y = 8; y < h - 18; y += 10) {
        for (let x = 4; x < w - 4; x += 12) {
          const lit = rng.frac() < 0.12;
          g.fillStyle(lit ? 0xffe29a : lerpColor(0x86bad6, 0x3f6f8e, (y / h) * 0.8)).fillRect(x, y, 10, 8);
          if (!lit) g.fillStyle(0xffffff, 0.2).fillRect(x, y, 10, 2);
        }
      }
      g.fillStyle(lighten(body, 18)).fillRect(0, 0, w, 3);
      g.fillStyle(darken(body, 28)).fillRect(0, 0, 3, h).fillRect(w - 3, 0, 3, h);
      g.fillStyle(0x2f4a60).fillRect(0, h - 18, w, 18);
      g.fillStyle(0xdbe8f0, 0.4).fillRect(6, h - 14, w - 12, 8);
      break;
    }
    case 2: {
      const wall = 0xd6a98c;
      g.fillStyle(wall).fillRect(0, 0, w, h);
      g.fillStyle(darken(wall, 14)).fillRect(0, 0, 3, h).fillRect(w - 3, 0, 3, h);
      g.fillStyle(0xf2ead8).fillRect(0, 0, w, 5);
      g.fillStyle(darken(wall, 26)).fillRect(0, 5, w, 3);
      for (let y = 20; y + 30 < h - 10; y += 44) {
        for (let x = 10; x + 22 < w - 6; x += 38) {
          g.fillStyle(0xf2ead8).fillRect(x - 2, y - 2, 26, 30);
          g.fillStyle(rng.frac() < 0.2 ? 0xf2c879 : 0x34506a).fillRect(x, y, 22, 26);
          g.fillStyle(0xffffff, 0.2).fillRect(x, y, 22, 5);
          g.fillStyle(0x3a4350).fillRect(x - 3, y + 24, 28, 3); // grade da varanda
          if (rng.frac() < 0.3) g.fillStyle(0xc9d1d6).fillRect(x + 26, y + 6, 8, 6); // ar-condicionado
        }
      }
      g.fillStyle(darken(wall, 30)).fillRect(0, h - 10, w, 10);
      break;
    }
    default: {
      const white = 0xe4e8ea;
      g.fillStyle(white).fillRect(0, 0, w, h);
      for (let y = 14; y + 14 < h - 12; y += 30) {
        g.fillStyle(0x4f7f9c).fillRect(5, y, w - 10, 14);
        g.fillStyle(0xffffff, 0.22).fillRect(5, y, w - 10, 4);
      }
      for (let x = 21; x < w - 8; x += 24) g.fillStyle(darken(white, 24)).fillRect(x, 0, 2, h);
      g.fillStyle(darken(white, 18)).fillRect(0, 0, 3, h).fillRect(w - 3, 0, 3, h);
      g.fillStyle(0x6d7f95).fillRect(0, 0, w, 4);
      g.fillStyle(0x39465a).fillRect(0, h - 12, w, 12);
      break;
    }
  }
}

/** Telha de zinco (tile 32x32, emenda dos lados): viga pintada em cima, chapa ondulada e ferrugem */
export function paintZinc(g: G, p: LevelPalette): void {
  const rng = new Phaser.Math.RandomDataGenerator(['zinc']);
  const beam = p.block;
  g.fillStyle(0x66737d).fillRect(0, 0, 32, 32);
  // chapa ondulada na vertical (período de 4 px)
  const shades = [lighten(ZINC, 10), ZINC, darken(ZINC, 14), ZINC];
  for (let x = 0; x < 32; x++) g.fillStyle(shades[x % 4]).fillRect(x, 8, 1, 20);
  // ferrugem
  for (let i = 0; i < 6; i++) g.fillStyle(0x9a5a38, 0.55).fillRect(rng.between(0, 28), rng.between(10, 26), rng.between(2, 4), rng.between(2, 5));
  // viga de madeira pintada no alto
  g.fillStyle(darken(beam, 28)).fillRect(0, 0, 32, 10);
  g.fillStyle(beam).fillRect(0, 0, 32, 8);
  g.fillStyle(lighten(beam, 16)).fillRect(0, 0, 32, 1);
  g.fillStyle(0x3a3d44).fillRect(4, 3, 2, 2).fillRect(16, 3, 2, 2).fillRect(28, 3, 2, 2); // pregos
  // borda inferior com rebites
  g.fillStyle(darken(ZINC, 38)).fillRect(0, 28, 32, 4);
  g.fillStyle(lighten(ZINC, 20)).fillRect(2, 29, 2, 1).fillRect(10, 29, 2, 1).fillRect(18, 29, 2, 1).fillRect(26, 29, 2, 1);
}

export interface Transition {
  from: number;
  to: number;
}

/** Largura da textura comprida de uma camada: cobre a tela inteira em qualquer ponto da fase */
const longWidth = (factor: number, levelPx: number): number => Math.ceil(factor * (levelPx - BG_W) + BG_W) + 16;

export function makeCanindeArt(draw: Draw, level: LevelConfig): void {
  const levelPx = level.map[0].length * TILE_SIZE;
  const transition = level.transition ?? { from: 60, to: 94 };
  draw('sky-caninde', BG_W, BG_H, paintSky);
  draw('sunglow-caninde', SUN_CANINDE.glowSize, SUN_CANINDE.glowSize, paintSunGlow);
  draw('clouds-caninde', BG_W, CLOUDS_H, paintClouds);
  draw('far-caninde', BG_W, FAR_H, paintFar);
  const hillsW = longWidth(PARALLAX.hills, levelPx);
  const hillsR = mixRange(PARALLAX.hills, transition);
  draw('hills-caninde', hillsW, HILLS_H, (g) => paintHillsLong(g, hillsW, HILLS_H, hillsR));
  const midW = longWidth(PARALLAX.mid, levelPx);
  const midR = mixRange(PARALLAX.mid, transition);
  draw('mid-caninde', midW, MID_H, (g) => paintMixedRow(g, 'mid-caninde', MID_BASE, midW, MID_H, midR, MID_ROW));
  const nearW = longWidth(PARALLAX.near, levelPx);
  const nearR = mixRange(PARALLAX.near, transition);
  draw('near-caninde', nearW, NEAR_H, (g) => paintMixedRow(g, 'near-caninde', NEAR_BASE, nearW, NEAR_H, nearR, NEAR_ROW));
  draw('fg-caninde', BG_W, FG_H, paintFgFavela);
  draw('fg-caninde-city', BG_W, FG_H, paintFgCity);

  for (let v = 0; v < BARRACO_VARIANTS; v++) draw(`barraco-caninde-${v}`, 128, 128, (g) => paintBarracoLandmark(g, v));
  draw('varal-caninde', 96, 80, paintVaral);
  draw('lamp-caninde', 20, 84, paintLamp);
  draw('library-caninde', 240, 170, paintLibrary);
  draw('crate-caninde', 22, 20, paintCrate);
  draw('barrel-caninde', 18, 22, paintBarrel);
  draw('portal-caninde-locked', 48, 64, (g) => paintLibraryDoor(g, false));
  draw('portal-caninde-open', 48, 64, (g) => paintLibraryDoor(g, true));
}
