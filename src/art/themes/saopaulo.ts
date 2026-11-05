import Phaser from 'phaser';
import { darken, lighten } from '../../config/palette';
import { gradientAt, periodicRidge, type GradientStop } from '../colors';
import type { LevelPalette } from '../../data/levels';
import type { Draw } from '../tileArt';
import { BG_H, BG_W, CLOUDS_H, FAR_H, FG_H, HILLS_H, MID_H, NEAR_H } from './quilombo';

type G = Phaser.GameObjects.Graphics;

// Cidade colonial do século XIX: céu de garoa azul-acinzentado, casario de telhas terracota,
// sobrados com sacadas de ferro, lampiões a gás e, no fim, a faculdade de Direito.
export const SUN_SAOPAULO = { x: 700, y: 300, glowSize: 280 } as const;

const SKY: readonly GradientStop[] = [
  { at: 0, color: 0x4f6b8a },
  { at: 0.4, color: 0x87a0ba },
  { at: 0.75, color: 0xc7d2dd },
  { at: 1, color: 0xeadfcf },
];

const TERRACOTTA = 0xb5603a;
const IRON = 0x2a2d36;

function paintSky(g: G): void {
  const band = 4;
  for (let y = 0; y < BG_H; y += band) g.fillStyle(gradientAt(SKY, y / BG_H)).fillRect(0, y, BG_W, band);
  // sol pálido atrás da névoa
  const { x, y } = SUN_SAOPAULO;
  g.fillStyle(0xf7eedd, 0.55).fillCircle(x, y, 74);
  g.fillStyle(0xfff6e6, 0.9).fillCircle(x, y, 52);
}

function paintSunGlow(g: G): void {
  const c = SUN_SAOPAULO.glowSize / 2;
  for (let r = c; r > 50; r -= 10) g.fillStyle(0xfff0d0, 0.04).fillCircle(c, c, r);
}

function paintClouds(g: G): void {
  const clouds: Array<[number, number, number]> = [
    [110, 90, 220], [360, 50, 150], [540, 170, 180], [790, 100, 240], [920, 240, 130], [240, 250, 160], [650, 290, 110],
  ];
  for (const [x, y, w] of clouds) {
    for (const dx of [-BG_W, 0, BG_W]) {
      g.fillStyle(0x7d90a6, 0.45).fillEllipse(x + dx, y + 6, w, 18);
      g.fillStyle(0xa9b9c9, 0.6).fillEllipse(x + dx + 6, y + 2, w * 0.9, 15);
      g.fillStyle(0xdfe7ee, 0.7).fillEllipse(x + dx - 8, y - 2, w * 0.7, 11);
    }
  }
}

/** Serra ao longe em duas cordilheiras azuladas */
function paintFar(g: G): void {
  const ridges: Array<{ color: number; base: number; waves: Array<[number, number, number]> }> = [
    { color: 0x93a6ba, base: 150, waves: [[40, 1, 1.1], [18, 3, 0.3], [7, 9, 1.0]] },
    { color: 0x7a8ea5, base: 92, waves: [[34, 2, 0.2], [16, 5, 1.6], [6, 11, 0.8]] },
  ];
  for (const { color, base, waves } of ridges) {
    for (let x = 0; x < BG_W; x++) {
      const top = Math.round(FAR_H - base - periodicRidge(x, BG_W, waves));
      g.fillStyle(color).fillRect(x, top, 1, FAR_H - top);
      g.fillStyle(lighten(color, 10)).fillRect(x, top, 1, 2);
    }
  }
  for (let i = 0; i < 6; i++) g.fillStyle(0xe6edf3, 0.1 + i * 0.04).fillRect(0, FAR_H - 60 + i * 10, BG_W, 10);
}

interface Facade {
  x: number;
  w: number;
  h: number;
  wall: number;
  lit: boolean[];
}

interface FacadeStyle {
  walls: readonly number[];
  roof: number;
  trim: number;
  window: number;
  glow: number;
  haze: number;
  hazeAlpha: number;
  litChance: number;
}

interface RowSize {
  w: [number, number];
  h: [number, number];
  gap: [number, number];
  /** Fecha a fileira exatamente no fim da textura (repete sem emenda); senão deixa espaço no fim */
  fit: boolean;
}

function makeFacades(rng: Phaser.Math.RandomDataGenerator, style: FacadeStyle, size: RowSize): Facade[] {
  const out: Facade[] = [];
  let x = size.fit ? 0 : rng.between(10, 60);
  while (x < BG_W) {
    let w = rng.between(...size.w);
    if (size.fit && BG_W - (x + w) < size.w[0]) w = BG_W - x;
    if (!size.fit && x + w > BG_W - 10) break;
    out.push({
      x,
      w,
      h: rng.between(...size.h),
      wall: rng.pick([...style.walls]),
      lit: Array.from({ length: 24 }, () => rng.frac() < style.litChance),
    });
    x += w + rng.between(...size.gap);
  }
  return out;
}

function paintFacade(g: G, f: Facade, baseY: number, s: FacadeStyle): void {
  const top = baseY - f.h;
  g.fillStyle(f.wall).fillRect(f.x, top, f.w, f.h);
  g.fillStyle(lighten(f.wall, 14)).fillRect(f.x, top, f.w, 2);
  g.fillStyle(darken(f.wall, 14)).fillRect(f.x, top, 2, f.h);
  // telhado de quatro águas
  const rh = Math.min(16, Math.round(f.w * 0.28));
  g.fillStyle(darken(s.roof, 20)).fillRect(f.x - 3, top - 3, f.w + 6, 4);
  g.fillStyle(s.roof).fillPoints([{ x: f.x - 2, y: top - 3 }, { x: f.x + f.w + 2, y: top - 3 }, { x: f.x + f.w - 6, y: top - 3 - rh }, { x: f.x + 6, y: top - 3 - rh }], true);
  g.fillStyle(darken(s.roof, 18));
  for (let ty = top - 3 - rh + 4; ty < top - 3; ty += 4) g.fillRect(f.x + 4, ty, f.w - 8, 1);
  // janelas em grade, com verga clara; o piso térreo ganha porta
  const cols = Math.max(1, Math.floor((f.w - 6) / 13));
  const rows = Math.max(1, Math.floor((f.h - 14) / 24));
  const gapX = (f.w - cols * 7) / (cols + 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = Math.round(f.x + gapX * (c + 1) + c * 7);
      const wy = top + 8 + r * 24;
      const isDoor = r === rows - 1 && c === Math.floor(cols / 2);
      const lit = f.lit[(r * cols + c) % f.lit.length];
      g.fillStyle(s.trim).fillRect(wx - 1, wy - 1, 9, isDoor ? 20 : 12);
      g.fillStyle(lit ? s.glow : s.window).fillRect(wx, wy, 7, isDoor ? 19 : 11);
      if (!isDoor && r > 0) g.fillStyle(IRON).fillRect(wx - 2, wy + 11, 11, 1); // sacada de ferro
    }
  }
  // neblina de distância sobre a fachada inteira
  g.fillStyle(s.haze, s.hazeAlpha).fillRect(f.x - 3, top - 3 - rh, f.w + 6, f.h + rh + 3);
}

function paintRow(g: G, seed: string, baseY: number, style: FacadeStyle, size: RowSize): void {
  const rng = new Phaser.Math.RandomDataGenerator([seed]);
  for (const f of makeFacades(rng, style, size)) paintFacade(g, f, baseY, style);
}

/** Casario distante com duas torres de igreja */
function paintHills(g: G): void {
  const base = 0x8e97a8;
  const waves: Array<[number, number, number]> = [[16, 1, 0.9], [8, 4, 2.0]];
  const ridgeY = (x: number): number => Math.round(HILLS_H - 70 - periodicRidge(x, BG_W, waves));
  for (let x = 0; x < BG_W; x++) {
    const top = ridgeY(x);
    g.fillStyle(base).fillRect(x, top, 1, HILLS_H - top);
  }
  const rng = new Phaser.Math.RandomDataGenerator(['hills-saopaulo']);
  let x = 0;
  while (x < BG_W - 20) {
    const w = rng.between(20, 34);
    const h = rng.between(16, 30);
    const y = ridgeY(x + w / 2) + 4;
    g.fillStyle(darken(base, 10)).fillRect(x, y - h, w, h);
    g.fillStyle(0x9d8582).fillPoints([{ x: x - 2, y: y - h }, { x: x + w + 2, y: y - h }, { x: x + w - 4, y: y - h - 7 }, { x: x + 4, y: y - h - 7 }], true);
    g.fillStyle(0xf2d9a0, 0.6);
    for (let wx = x + 5; wx < x + w - 4; wx += 8) g.fillRect(wx, y - h + 6, 3, 4);
    x += w + rng.between(0, 3);
  }
  // torres de igreja com agulha
  for (const tx of [310, 770]) {
    const y = ridgeY(tx) + 4;
    g.fillStyle(darken(base, 22)).fillRect(tx - 7, y - 58, 14, 58).fillTriangle(tx - 9, y - 58, tx + 9, y - 58, tx, y - 84);
    g.fillStyle(0xf2d9a0, 0.7).fillRect(tx - 2, y - 46, 4, 8);
  }
  for (let i = 0; i < 5; i++) g.fillStyle(0xe6edf3, 0.06 + i * 0.03).fillRect(0, HILLS_H - 50 + i * 10, BG_W, 10);
}

const MID_STYLE: FacadeStyle = {
  walls: [0xc9a36a, 0xd8c9a8, 0xc98a6e, 0x9aa68c, 0xb7a58f],
  roof: 0x9a5a48,
  trim: 0xf2ead8,
  window: 0x3b4558,
  glow: 0xf2c879,
  haze: 0x9fb2c6,
  hazeAlpha: 0.42,
  litChance: 0.08,
};

const NEAR_STYLE: FacadeStyle = {
  walls: [0x39404f, 0x424a5a, 0x353b49],
  roof: 0x4a3a40,
  trim: 0x59627a,
  window: 0x1d222c,
  glow: 0xffcf7a,
  haze: 0x2c3340,
  hazeAlpha: 0.12,
  litChance: 0.3,
};

const MID_BASE = MID_H - 90;
const NEAR_BASE = NEAR_H - 84;

function paintMid(g: G): void {
  // o que fica abaixo da rua (buracos mostram o fundo) é só um paredão escuro
  g.fillStyle(0x6f7686).fillRect(0, MID_BASE, BG_W, MID_H - MID_BASE);
  paintRow(g, 'mid-saopaulo', MID_BASE, MID_STYLE, { w: [44, 70], h: [80, 116], gap: [0, 2], fit: true });
}

function paintNear(g: G): void {
  g.fillStyle(0x2c3340).fillRect(0, NEAR_BASE, BG_W, NEAR_H - NEAR_BASE);
  // prédios altos e espaçados: deixam o casario colorido aparecer entre eles
  paintRow(g, 'near-saopaulo', NEAR_BASE, NEAR_STYLE, { w: [64, 100], h: [110, 160], gap: [60, 150], fit: false });
}

/** Primeiro plano: grade de ferro com pontas de lança e um lampião, passando rápido */
function paintForeground(g: G): void {
  g.fillStyle(IRON).fillRect(0, FG_H - 8, BG_W, 8);
  g.fillRect(0, FG_H - 30, BG_W, 3);
  for (let x = 2; x < BG_W; x += 9) {
    g.fillRect(x, FG_H - 40, 3, 40);
    g.fillTriangle(x - 1, FG_H - 40, x + 4, FG_H - 40, x + 1.5, FG_H - 50);
  }
  for (let x = 40; x < BG_W; x += 160) g.fillRect(x, FG_H - 52, 7, 52).fillRect(x - 3, FG_H - 56, 13, 5);
}

// --- Elementos do cenário (marcos e enfeites) ---

export const TOWNHOUSE_VARIANTS = 3;
const TOWNHOUSE_WALLS = [0xd3a96a, 0xc98f7a, 0xa9b8a4] as const;

/** Sobrado 128x112: térreo com porta e janelas, andar de cima com sacada de ferro, chaminé */
function paintTownhouse(g: G, variant: number): void {
  const wall = TOWNHOUSE_WALLS[variant];
  const trim = 0xf2ead8;
  const W = 128;
  // chaminé e telhado
  g.fillStyle(darken(TERRACOTTA, 25)).fillRect(88, 0, 12, 22);
  g.fillStyle(0x2a2d36).fillRect(87, 0, 14, 3);
  g.fillStyle(darken(TERRACOTTA, 30)).fillPoints([{ x: 0, y: 36 }, { x: W, y: 36 }, { x: 104, y: 8 }, { x: 24, y: 8 }], true);
  g.fillStyle(TERRACOTTA).fillPoints([{ x: 3, y: 34 }, { x: W - 3, y: 34 }, { x: 102, y: 10 }, { x: 26, y: 10 }], true);
  g.fillStyle(darken(TERRACOTTA, 16));
  for (let y = 14; y < 34; y += 4) g.fillRect(8 + (y - 14), y, W - 16 - (y - 14) * 2, 1);
  // paredes e cornijas
  g.fillStyle(darken(wall, 25)).fillRect(6, 36, W - 12, 76);
  g.fillStyle(wall).fillRect(8, 36, W - 16, 74);
  g.fillStyle(trim).fillRect(4, 36, W - 8, 4).fillRect(4, 70, W - 8, 3).fillRect(6, 106, W - 12, 6);
  // andar de cima: três janelas com sacada corrida
  for (const wx of [20, 56, 92]) {
    g.fillStyle(trim).fillRect(wx - 2, 44, 20, 26);
    g.fillStyle(0x3b4558).fillRect(wx, 46, 16, 24);
    g.fillStyle(0xf2c879, 0.5).fillRect(wx, 46, 16, 8);
    g.fillStyle(IRON).fillRect(wx + 7, 46, 2, 24);
  }
  g.fillStyle(IRON).fillRect(10, 62, W - 20, 2);
  for (let x = 12; x < W - 12; x += 5) g.fillRect(x, 62, 1, 10);
  // térreo: porta com bandeira e duas janelas
  g.fillStyle(trim).fillRect(52, 76, 24, 32);
  g.fillStyle(0x4a2f17).fillRect(54, 80, 20, 28);
  g.fillStyle(0xf2c879, 0.6).fillRect(54, 77, 20, 5);
  g.fillStyle(0x2a1a0c).fillRect(62, 80, 4, 28);
  for (const wx of [20, 94]) {
    g.fillStyle(trim).fillRect(wx - 2, 80, 20, 22);
    g.fillStyle(0x3b4558).fillRect(wx, 82, 16, 20);
    g.fillStyle(IRON).fillRect(wx + 7, 82, 2, 20).fillRect(wx, 91, 16, 2);
  }
}

/** Lampião a gás 20x84 */
function paintLamp(g: G): void {
  g.fillStyle(0xffd27a, 0.12).fillCircle(10, 14, 14);
  g.fillStyle(0xffd27a, 0.18).fillCircle(10, 14, 9);
  g.fillStyle(IRON).fillRect(8, 24, 4, 54).fillRect(5, 76, 10, 8).fillRect(6, 20, 8, 5);
  g.fillStyle(0xffe6a0).fillRect(6, 8, 8, 12);
  g.fillStyle(IRON).fillRect(5, 6, 10, 3).fillRect(4, 19, 12, 2).fillTriangle(5, 6, 15, 6, 10, 0);
  g.fillStyle(0xfff6d0).fillRect(8, 10, 3, 7);
}

function paintCrate(g: G): void {
  g.fillStyle(0x4a2f17).fillRect(0, 0, 22, 20);
  g.fillStyle(0x8d5f35).fillRect(1, 1, 20, 18);
  g.fillStyle(0x6b4423).fillRect(1, 9, 20, 2).fillRect(10, 1, 2, 18);
  g.fillStyle(0xa97a46).fillRect(1, 1, 20, 1);
}

function paintBarrel(g: G): void {
  g.fillStyle(0x452a14).fillEllipse(9, 11, 18, 22);
  g.fillStyle(0x7a4f2a).fillEllipse(9, 11, 14, 20);
  g.fillStyle(IRON).fillRect(1, 5, 16, 2).fillRect(1, 15, 16, 2);
  g.fillStyle(0x9a6a3a).fillRect(5, 3, 2, 16);
}

/** Faculdade de Direito 224x150: escadaria, quatro colunas, frontão e porta */
function paintFaculty(g: G): void {
  const stone = 0xe3d9c2;
  const shade = 0xb9ae95;
  const W = 224;
  // escadaria
  for (let i = 0; i < 4; i++) g.fillStyle(i % 2 ? shade : stone).fillRect(i * 6, 146 - i * 6 - 4, W - i * 12, 6);
  // corpo e frontão
  g.fillStyle(shade).fillRect(20, 40, W - 40, 82);
  g.fillStyle(stone).fillRect(22, 42, W - 44, 80);
  g.fillStyle(shade).fillTriangle(14, 42, W - 14, 42, W / 2, 6);
  g.fillStyle(stone).fillTriangle(22, 40, W - 22, 40, W / 2, 12);
  g.fillStyle(shade).fillCircle(W / 2, 30, 9);
  g.fillStyle(0x3b4558).fillCircle(W / 2, 30, 6);
  g.fillStyle(shade).fillRect(14, 42, W - 28, 5);
  // porta e janelas
  g.fillStyle(0x4a2f17).fillRect(W / 2 - 14, 80, 28, 42);
  g.fillStyle(0x2a1a0c).fillRect(W / 2 - 1, 80, 2, 42);
  for (const wx of [48, 160]) g.fillStyle(0x3b4558).fillRect(wx, 72, 14, 30).fillStyle(0xf2c879, 0.5).fillRect(wx, 72, 14, 8);
  // colunas
  for (const cx of [34, 82, 130, 178]) {
    g.fillStyle(shade).fillRect(cx - 1, 46, 14, 76);
    g.fillStyle(stone).fillRect(cx, 46, 12, 76);
    g.fillStyle(lighten(stone, 6)).fillRect(cx + 2, 46, 3, 76);
    g.fillStyle(shade).fillRect(cx - 3, 46, 18, 5).fillRect(cx - 3, 118, 18, 5);
  }
}

const BUILDING_WALLS = [0xcdb98f, 0xb98a7a, 0x9fae9c, 0xc5a56e] as const;

/** Fachada de um prédio w x h px: cornija, janelas com verga e persianas, base de pedra */
export function paintBuilding(g: G, w: number, h: number, variant: number): void {
  const wall = BUILDING_WALLS[variant % BUILDING_WALLS.length];
  const trim = 0xf2ead8;
  g.fillStyle(wall).fillRect(0, 0, w, h);
  g.fillStyle(darken(wall, 14)).fillRect(0, 0, 3, h).fillRect(w - 3, 0, 3, h);
  g.fillStyle(lighten(wall, 10)).fillRect(3, 0, 2, h);
  // cornija no topo e friso na base
  g.fillStyle(trim).fillRect(0, 0, w, 5);
  g.fillStyle(darken(wall, 25)).fillRect(0, 5, w, 3);
  g.fillStyle(darken(wall, 30)).fillRect(0, h - 10, w, 10);
  g.fillStyle(lighten(wall, 18)).fillRect(0, h - 12, w, 2);
  // janelas em grade (o espaçamento se ajusta à largura)
  const cols = Math.max(1, Math.floor(w / 56));
  const gapX = (w - cols * 24) / (cols + 1);
  for (let y = 26; y + 40 < h - 10; y += 62) {
    for (let c = 0; c < cols; c++) {
      const x = Math.round(gapX * (c + 1) + c * 24);
      g.fillStyle(trim).fillRect(x - 3, y - 4, 30, 4).fillRect(x - 2, y, 28, 40);
      g.fillStyle(0x3b4558).fillRect(x, y + 2, 24, 36);
      g.fillStyle(0xf2c879, (x + y) % 3 === 0 ? 0.55 : 0.18).fillRect(x, y + 2, 24, 12);
      g.fillStyle(IRON).fillRect(x + 11, y + 2, 2, 36);
      g.fillStyle(darken(wall, 35)).fillRect(x - 8, y + 2, 6, 36).fillRect(x + 26, y + 2, 6, 36); // persianas
      g.fillStyle(IRON).fillRect(x - 4, y + 38, 32, 3); // sacada
    }
  }
}

/** Sacada de sobrado (tile 32x32, emenda dos lados): tampo de pedra, grade de ferro e mísulas */
export function paintSacada(g: G, p: LevelPalette): void {
  const stone = 0xe3d9c2;
  const shade = 0xb9ae95;
  const back = darken(p.block, 30);
  const lightIron = 0x4a4f5c;
  g.fillStyle(back).fillRect(0, 0, 32, 32);
  // tampo de pedra
  g.fillStyle(shade).fillRect(0, 0, 32, 8);
  g.fillStyle(stone).fillRect(0, 0, 32, 6);
  g.fillStyle(lighten(stone, 6)).fillRect(0, 0, 32, 1);
  g.fillStyle(darken(shade, 28)).fillRect(0, 8, 32, 2);
  // grade de ferro: balaústres, travessas e medalhões com um ponto dourado
  g.fillStyle(IRON).fillRect(0, 10, 32, 2).fillRect(0, 24, 32, 2);
  for (let x = 2; x < 32; x += 4) {
    g.fillStyle(IRON).fillRect(x, 12, 2, 12);
    g.fillStyle(lightIron).fillRect(x, 12, 1, 12);
  }
  for (const cx of [8, 24]) {
    g.fillStyle(IRON).fillCircle(cx, 18, 6);
    g.fillStyle(back).fillCircle(cx, 18, 4);
    g.fillStyle(0xc9a14a).fillRect(cx - 1, 17, 2, 2);
  }
  // mísulas sob a laje
  g.fillStyle(shade).fillRect(0, 26, 32, 6);
  g.fillStyle(stone).fillRect(0, 26, 32, 2);
  for (let x = 0; x < 32; x += 8) g.fillStyle(darken(shade, 28)).fillRect(x + 1, 29, 6, 3);
}

/** Portal 48x64: porta da faculdade (pilastres, frontão, friso de padrão africano). Trancado = porta fechada e apagada */
function paintFacultyDoor(g: G, open: boolean): void {
  const stone = open ? 0xe3d9c2 : 0x9b958a;
  const shade = open ? 0xb9ae95 : 0x726d63;
  const W = 48;
  // degrau e pilastres
  g.fillStyle(shade).fillRect(0, 60, W, 4);
  g.fillStyle(stone).fillRect(0, 60, W, 2);
  for (const px of [0, 42]) {
    g.fillStyle(shade).fillRect(px, 16, 6, 44);
    g.fillStyle(stone).fillRect(px + 1, 16, 4, 44);
    g.fillStyle(lighten(stone, 6)).fillRect(px + 1, 16, 1, 44);
    g.fillStyle(shade).fillRect(px, 16, 6, 3).fillRect(px, 57, 6, 3);
  }
  // arquitrave com friso de padrão geométrico e frontão
  g.fillStyle(shade).fillTriangle(0, 11, W, 11, W / 2, 0);
  g.fillStyle(stone).fillTriangle(5, 10, W - 5, 10, W / 2, 3);
  g.fillStyle(shade).fillRect(0, 10, W, 7);
  g.fillStyle(stone).fillRect(0, 10, W, 5);
  const pattern = open ? [0xc0392b, 0xf2b705, 0x1e7a3c] : [0x6e5a55, 0x7a7355, 0x4d6355];
  for (let i = 0; i < 8; i++) g.fillStyle(pattern[i % 3]).fillRect(2 + i * 5, 11, 4, 3);
  // vão em arco
  g.fillStyle(shade).fillCircle(24, 34, 17).fillRect(7, 34, 34, 26);
  if (open) {
    g.fillStyle(0xffc94a).fillCircle(24, 34, 15).fillRect(9, 34, 30, 26);
    g.fillStyle(0xfff4d0).fillCircle(24, 38, 9).fillRect(15, 38, 18, 22);
    // folhas da porta abertas nas laterais
    g.fillStyle(0x4a2f17).fillRect(9, 30, 4, 30).fillRect(35, 30, 4, 30);
    g.fillStyle(0x2a1a0c).fillRect(12, 32, 1, 28).fillRect(35, 32, 1, 28);
  } else {
    g.fillStyle(0x3a2412).fillCircle(24, 34, 15).fillRect(9, 34, 30, 26);
    g.fillStyle(0x2a1a0c).fillRect(23, 20, 2, 40);
    g.fillStyle(0x4a3a2a);
    for (const y of [28, 42, 52]) g.fillRect(9, y, 30, 2);
    // fechadura apagada
    g.fillStyle(0x6b6358).fillRect(19, 40, 3, 4).fillRect(26, 40, 3, 4);
  }
}

export function makeSaoPauloArt(draw: Draw): void {
  draw('sky-saopaulo', BG_W, BG_H, paintSky);
  draw('sunglow-saopaulo', SUN_SAOPAULO.glowSize, SUN_SAOPAULO.glowSize, paintSunGlow);
  draw('clouds-saopaulo', BG_W, CLOUDS_H, paintClouds);
  draw('far-saopaulo', BG_W, FAR_H, paintFar);
  draw('hills-saopaulo', BG_W, HILLS_H, paintHills);
  draw('mid-saopaulo', BG_W, MID_H, paintMid);
  draw('near-saopaulo', BG_W, NEAR_H, paintNear);
  draw('fg-saopaulo', BG_W, FG_H, paintForeground);

  for (let v = 0; v < TOWNHOUSE_VARIANTS; v++) draw(`townhouse-saopaulo-${v}`, 128, 112, (g) => paintTownhouse(g, v));
  draw('lamp-saopaulo', 20, 84, paintLamp);
  draw('faculty-saopaulo', 224, 150, paintFaculty);
  draw('portal-saopaulo-locked', 48, 64, (g) => paintFacultyDoor(g, false));
  draw('portal-saopaulo-open', 48, 64, (g) => paintFacultyDoor(g, true));
  draw('crate-saopaulo', 22, 20, paintCrate);
  draw('barrel-saopaulo', 18, 22, paintBarrel);
}
