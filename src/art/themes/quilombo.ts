import Phaser from 'phaser';
import { darken, lighten } from '../../config/palette';
import { gradientAt, periodicRidge, type GradientStop } from '../colors';
import type { Draw } from '../tileArt';

type G = Phaser.GameObjects.Graphics;

export const BG_W = 960;
export const BG_H = 540;
export const FAR_H = 300;
export const MID_H = 240;

const SKY: readonly GradientStop[] = [
  { at: 0, color: 0x3b1f4a },
  { at: 0.35, color: 0xa8435a },
  { at: 0.62, color: 0xf0864a },
  { at: 0.82, color: 0xf9c56b },
  { at: 1, color: 0xfde3a0 },
];

const WOOD = { base: 0x6b4423, dark: 0x452a14, light: 0x8d5f35 };
const LEAF = { dark: 0x174d24, base: 0x2e7d3a, light: 0x5aa846, warm: 0x9cc44a };

// Margem transparente nas laterais e no topo para nada encostar na borda da textura.
// A base fica sem margem: o objeto é posicionado pela base (origin 0.5, 1).
interface Pad {
  side: number;
  top: number;
}

function drawPadded(draw: Draw, key: string, w: number, h: number, pad: Pad, paint: (g: G) => void): void {
  draw(key, w + pad.side * 2, h + pad.top, (g) => {
    g.translateCanvas(pad.side, pad.top);
    paint(g);
  });
}

/** Desenha um círculo também deslocado de ±período para a textura repetir sem emenda */
function wrapCircle(g: G, x: number, y: number, r: number): void {
  for (const dx of [-BG_W, 0, BG_W]) g.fillCircle(x + dx, y, r);
}

export const SUN = { x: 690, y: 360, glowSize: 300 } as const;
export const CLOUDS_H = 330;
export const HILLS_H = 220;
export const NEAR_H = 230;
export const FG_H = 56;

function paintSky(g: G): void {
  const band = 4;
  for (let y = 0; y < BG_H; y += band) g.fillStyle(gradientAt(SKY, y / BG_H)).fillRect(0, y, BG_W, band);

  // estrelas surgindo no alto do céu
  const rng = new Phaser.Math.RandomDataGenerator(['stars-quilombo']);
  for (let i = 0; i < 40; i++) {
    g.fillStyle(0xfde3a0, rng.realInRange(0.3, 0.8)).fillRect(rng.between(0, BG_W), rng.between(0, 120), 1, 1);
  }

  // sol baixo com faixas no estilo retrô (o halo é uma imagem separada que pulsa)
  const { x: sx, y: sy } = SUN;
  g.fillStyle(0xffe9a8).fillCircle(sx, sy, 68);
  g.fillStyle(0xfff4d0).fillCircle(sx - 10, sy - 12, 44);
  for (const [y, h] of [[372, 3], [388, 4], [404, 5], [420, 6]]) {
    g.fillStyle(gradientAt(SKY, y / BG_H)).fillRect(sx - 70, y, 140, h);
  }
}

function paintSunGlow(g: G): void {
  const c = SUN.glowSize / 2;
  for (let r = c; r > 60; r -= 10) g.fillStyle(0xffd27a, 0.035).fillCircle(c, c, r);
}

/** Nuvens soltas em camada própria: andam sozinhas com o vento */
function paintClouds(g: G): void {
  const clouds: Array<[number, number, number]> = [
    [120, 110, 200], [380, 60, 120], [520, 190, 160], [760, 120, 220], [900, 260, 120], [250, 270, 140], [640, 300, 90],
  ];
  for (const [x, y, w] of clouds) {
    for (const dx of [-BG_W, 0, BG_W]) {
      g.fillStyle(0xb8506a, 0.45).fillEllipse(x + dx, y + 6, w, 16);
      g.fillStyle(0xd96a55, 0.6).fillEllipse(x + dx + 6, y + 2, w * 0.9, 14);
      g.fillStyle(0xffb98a, 0.75).fillEllipse(x + dx - 8, y - 2, w * 0.7, 10);
      g.fillStyle(0xffe0b8, 0.7).fillEllipse(x + dx - 18, y - 4, w * 0.35, 5);
    }
  }
}

function paintFar(g: G): void {
  // duas cordilheiras da serra, a de trás mais clara (perspectiva atmosférica)
  const ridges: Array<{ color: number; base: number; waves: Array<[number, number, number]> }> = [
    { color: 0x9a5468, base: 150, waves: [[46, 1, 0.4], [22, 3, 1.7], [9, 8, 0.2]] },
    { color: 0x6e3a52, base: 95, waves: [[38, 2, 2.2], [18, 5, 0.9], [6, 11, 1.4]] },
  ];
  for (const { color, base, waves } of ridges) {
    for (let x = 0; x < BG_W; x++) {
      const top = Math.round(FAR_H - base - periodicRidge(x, BG_W, waves));
      g.fillStyle(color).fillRect(x, top, 1, FAR_H - top);
      g.fillStyle(lighten(color, 12)).fillRect(x, top, 1, 2);
    }
  }
  // névoa do entardecer no pé da serra
  for (let i = 0; i < 6; i++) g.fillStyle(0xf0864a, 0.08 + i * 0.03).fillRect(0, FAR_H - 60 + i * 10, BG_W, 10);
}

function paintMid(g: G): void {
  const hill = 0x2f3b24;
  const waves: Array<[number, number, number]> = [[26, 2, 1.1], [12, 5, 0.3], [5, 13, 2.0]];
  const ridgeY = (x: number): number => Math.round(MID_H - 120 - periodicRidge(x, BG_W, waves));
  for (let x = 0; x < BG_W; x++) {
    const top = ridgeY(x);
    g.fillStyle(hill).fillRect(x, top, 1, MID_H - top);
  }
  // mata fechada sobre o morro
  const rng = new Phaser.Math.RandomDataGenerator(['mid-quilombo']);
  g.fillStyle(hill);
  for (let x = 0; x < BG_W; x += rng.between(14, 26)) {
    const r = rng.between(10, 20);
    wrapCircle(g, x, ridgeY(x) - r * 0.4, r);
  }
  // palmeiras em silhueta
  for (let x = 40; x < BG_W; x += rng.between(110, 170)) {
    const baseY = ridgeY(x) - 6;
    g.fillRect(x, baseY - 46, 3, 46);
    g.lineStyle(3, hill);
    for (const [dx, dy] of [[-18, 8], [18, 8], [-12, -4], [12, -4], [0, -10]]) g.lineBetween(x + 1, baseY - 46, x + 1 + dx, baseY - 46 + dy);
  }
  // luz quente do pôr do sol no contorno
  g.fillStyle(0xf0864a, 0.18).fillRect(0, MID_H - 40, BG_W, 40);
}

/** Colinas entre a serra e a mata, com uma aldeia distante e roças */
function paintHills(g: G): void {
  const hill = 0x5a3a48;
  const waves: Array<[number, number, number]> = [[22, 1, 2.6], [14, 4, 0.5], [6, 9, 1.9]];
  const ridgeY = (x: number): number => Math.round(HILLS_H - 110 - periodicRidge(x, BG_W, waves));
  for (let x = 0; x < BG_W; x++) {
    const top = ridgeY(x);
    g.fillStyle(hill).fillRect(x, top, 1, HILLS_H - top);
    g.fillStyle(lighten(hill, 14)).fillRect(x, top, 1, 1);
  }
  // roças em faixas na encosta
  g.fillStyle(darken(hill, 10), 0.8);
  for (let x = 200; x < 340; x += 2) g.fillRect(x, ridgeY(x) + 14 + ((x / 6) % 3), 1, 3);
  for (let x = 640; x < 760; x += 2) g.fillRect(x, ridgeY(x) + 12 + ((x / 6) % 3), 1, 3);
  // casinhas distantes da aldeia
  for (const hx of [262, 284, 300, 690, 712]) {
    const y = ridgeY(hx) + 2;
    g.fillStyle(darken(hill, 25)).fillRect(hx - 5, y - 6, 10, 6).fillTriangle(hx - 8, y - 6, hx + 8, y - 6, hx, y - 13);
    g.fillStyle(0xf0a24a, 0.7).fillRect(hx - 1, y - 4, 2, 2);
  }
  // névoa quente no pé
  for (let i = 0; i < 5; i++) g.fillStyle(0xf0864a, 0.05 + i * 0.03).fillRect(0, HILLS_H - 50 + i * 10, BG_W, 10);
}

/** Mata próxima, escura, com copas grandes: fica logo atrás do chão da fase */
function paintNear(g: G): void {
  const dark = 0x1c2617;
  const rng = new Phaser.Math.RandomDataGenerator(['near-quilombo']);
  const waves: Array<[number, number, number]> = [[18, 3, 0.4], [10, 7, 2.2]];
  const ridgeY = (x: number): number => Math.round(NEAR_H - 120 - periodicRidge(x, BG_W, waves));
  g.fillStyle(dark);
  for (let x = 0; x < BG_W; x++) g.fillRect(x, ridgeY(x), 1, NEAR_H - ridgeY(x));
  for (let x = 0; x < BG_W; x += rng.between(22, 40)) {
    const r = rng.between(18, 30);
    wrapCircle(g, x, ridgeY(x) - r * 0.3, r);
  }
  // palmeiras altas em silhueta
  for (let x = 80; x < BG_W - 40; x += rng.between(150, 230)) {
    const baseY = ridgeY(x);
    const topY = baseY - 70;
    g.fillStyle(dark).fillRect(x, topY, 4, 70);
    g.lineStyle(4, dark);
    for (const [dx, dy] of [[-26, 12], [26, 12], [-18, -6], [18, -6], [-6, -14], [8, -12]]) g.lineBetween(x + 2, topY, x + 2 + dx, topY + dy);
  }
  // borda iluminada pelo pôr do sol
  g.fillStyle(0x3b4a26, 0.9);
  for (let x = 0; x < BG_W; x += 3) g.fillRect(x, ridgeY(x), 2, 1);
}

/** Primeiro plano: folhagem escura passando na frente, mais rápido que a câmera */
function paintForeground(g: G): void {
  const dark = 0x0f140b;
  const rng = new Phaser.Math.RandomDataGenerator(['fg-quilombo']);
  g.fillStyle(dark).fillRect(0, FG_H - 10, BG_W, 10);
  for (let x = 0; x < BG_W; x += rng.between(10, 26)) {
    // samambaias: folhas em leque
    const h = rng.between(18, FG_H - 6);
    g.lineStyle(3, dark);
    for (const spread of [-1, -0.5, 0, 0.5, 1]) {
      const tipX = x + spread * h * 0.6;
      const tipY = FG_H - h * (1 - Math.abs(spread) * 0.35);
      g.lineBetween(x, FG_H - 4, tipX, tipY);
      // repete do outro lado para emendar sem corte
      if (tipX < 0) g.lineBetween(x + BG_W, FG_H - 4, tipX + BG_W, tipY);
      if (tipX > BG_W) g.lineBetween(x - BG_W, FG_H - 4, tipX - BG_W, tipY);
    }
  }
}

function paintBird(g: G, wingsUp: boolean): void {
  g.fillStyle(0x2a1530);
  g.fillRect(4, 3, 3, 2);
  if (wingsUp) g.fillRect(1, 0, 3, 1).fillRect(3, 1, 2, 2).fillRect(7, 0, 3, 1).fillRect(6, 1, 2, 2);
  else g.fillRect(0, 4, 3, 1).fillRect(2, 3, 2, 1).fillRect(8, 4, 3, 1).fillRect(7, 3, 2, 1);
}

function paintTree(g: G): void {
  const cx = 40;
  // tronco com raízes
  g.fillStyle(WOOD.dark).fillRect(cx - 6, 56, 12, 64).fillRect(cx - 10, 110, 20, 10);
  g.fillStyle(WOOD.base).fillRect(cx - 4, 56, 8, 64).fillRect(cx - 8, 112, 16, 8);
  g.fillStyle(WOOD.light).fillRect(cx - 4, 56, 2, 60);
  g.fillStyle(WOOD.dark).fillRect(cx, 70, 1, 8).fillRect(cx - 2, 90, 1, 10).fillRect(cx + 2, 100, 1, 7);
  // galhos
  g.lineStyle(4, WOOD.base).lineBetween(cx, 70, cx - 18, 52).lineBetween(cx, 64, cx + 20, 48);
  // copa em camadas
  const blobs: Array<[number, number, number]> = [[40, 42, 28], [16, 54, 18], [64, 54, 18], [26, 26, 19], [54, 28, 19], [40, 16, 15], [40, 62, 16]];
  g.fillStyle(LEAF.dark);
  for (const [x, y, r] of blobs) g.fillCircle(x, y, r + 2);
  g.fillStyle(LEAF.base);
  for (const [x, y, r] of blobs) g.fillCircle(x, y, r);
  g.fillStyle(LEAF.light);
  for (const [x, y, r] of blobs) g.fillCircle(x - r * 0.3, y - r * 0.3, r * 0.5);
  g.fillStyle(LEAF.warm);
  for (const [x, y, r] of blobs) g.fillCircle(x - r * 0.4, y - r * 0.45, r * 0.2);
  // textura de folhas
  const rng = new Phaser.Math.RandomDataGenerator(['tree-quilombo']);
  g.fillStyle(LEAF.dark);
  for (let i = 0; i < 70; i++) {
    const [bx, by, br] = rng.pick(blobs);
    const a = rng.realInRange(0, Math.PI * 2);
    const d = rng.realInRange(0, br * 0.9);
    g.fillRect(Math.round(bx + Math.cos(a) * d), Math.round(by + Math.sin(a) * d), 2, 1);
  }
}

function paintPalm(g: G): void {
  // tronco curvo em gomos
  for (let y = 118; y > 34; y -= 4) {
    const t = (118 - y) / 84;
    const x = 22 + Math.round(t * t * 12);
    g.fillStyle(WOOD.dark).fillRect(x - 4, y - 4, 9, 5);
    g.fillStyle(y % 8 === 2 ? WOOD.light : WOOD.base).fillRect(x - 3, y - 4, 7, 3);
  }
  const topX = 34;
  const topY = 32;
  // folhas caindo em arco
  const fronds: Array<[number, number, number]> = [[-1, -0.35, 30], [1, -0.3, 30], [-1, 0.2, 28], [1, 0.25, 28], [-0.4, -1, 18], [0.5, -0.9, 18]];
  for (const [dx, dy, len] of fronds) {
    let px = topX;
    let py = topY;
    for (let i = 1; i <= 10; i++) {
      const t = i / 10;
      const nx = topX + dx * len * t;
      const ny = topY + dy * len * t + 14 * t * t;
      const w = Math.max(1, Math.round(5 * (1 - t)) + 1);
      g.lineStyle(w + 1, LEAF.dark).lineBetween(px, py, nx, ny);
      g.lineStyle(w, i % 2 === 0 ? LEAF.base : LEAF.light).lineBetween(px, py, nx, ny);
      // folíolos
      g.lineStyle(1, LEAF.base).lineBetween(nx, ny, nx + dx * 3, ny + 5);
      px = nx;
      py = ny;
    }
  }
  g.fillStyle(0x4a2f17).fillCircle(topX - 3, topY + 4, 3).fillCircle(topX + 3, topY + 5, 3).fillCircle(topX, topY + 7, 3);
}

// Arbusto 40x24: a base reta (últimos 6px) fica escondida atrás da grama do tile
function paintBush(g: G, rng: Phaser.Math.RandomDataGenerator): void {
  const blobs: Array<[number, number, number]> = [[10, 15, 8], [20, 11, 10], [30, 15, 8]];
  g.fillStyle(LEAF.dark);
  for (const [x, y, r] of blobs) g.fillCircle(x, y, r + 1);
  g.fillRect(2, 15, 36, 9);
  g.fillStyle(LEAF.base);
  for (const [x, y, r] of blobs) g.fillCircle(x, y, r);
  g.fillRect(3, 15, 34, 9);
  g.fillStyle(LEAF.light);
  for (const [x, y, r] of blobs) g.fillCircle(x - 2, y - 3, r * 0.45);
  g.fillStyle(LEAF.dark);
  for (let i = 0; i < 10; i++) g.fillRect(rng.between(5, 34), rng.between(8, 20), 2, 1);
  g.fillStyle(0xc0392b);
  for (let i = 0; i < 4; i++) g.fillRect(rng.between(6, 33), rng.between(8, 16), 2, 2);
}

// Pedra 22x14 com base reta para assentar no chão
function paintRock(g: G): void {
  g.fillStyle(0x4a3f38).fillEllipse(11, 9, 22, 14).fillRect(0, 9, 22, 5);
  g.fillStyle(0x7a6a5e).fillEllipse(11, 8, 18, 11).fillRect(2, 8, 18, 6);
  g.fillStyle(0x9a8a7c).fillEllipse(9, 6, 10, 5);
  g.fillStyle(0xbcae9e).fillRect(6, 4, 4, 1);
  g.fillStyle(0x4a3f38).fillRect(13, 7, 1, 4);
}

function paintPalisade(g: G): void {
  const logs: Array<[number, number]> = [[1, 8], [11, 2], [21, 6]];
  for (const [x, top] of logs) {
    g.fillStyle(WOOD.dark).fillRect(x, top + 6, 10, 64 - top - 6).fillTriangle(x, top + 7, x + 10, top + 7, x + 5, top - 1);
    g.fillStyle(WOOD.base).fillRect(x + 1, top + 6, 8, 64 - top - 6).fillTriangle(x + 1, top + 7, x + 9, top + 7, x + 5, top + 1);
    g.fillStyle(WOOD.light).fillRect(x + 2, top + 6, 2, 64 - top - 8);
    g.fillStyle(WOOD.dark).fillRect(x + 6, top + 16, 1, 6).fillRect(x + 5, top + 34, 1, 8);
  }
  // amarrações de cipó
  const rope = 0xc8a165;
  for (const y of [24, 46]) {
    g.fillStyle(darken(rope, 30)).fillRect(0, y, 32, 5);
    g.fillStyle(rope);
    for (let x = 0; x < 32; x += 4) g.fillRect(x, y, 3, 4);
  }
}

function paintHut(g: G): void {
  const mud = 0xa0703f;
  const post = 0x4a2f17;
  // paredes de pau-a-pique
  g.fillStyle(darken(mud, 25)).fillRect(12, 44, 88, 44);
  g.fillStyle(mud).fillRect(14, 46, 84, 42);
  g.fillStyle(lighten(mud, 12)).fillRect(14, 46, 84, 3);
  g.fillStyle(darken(mud, 15)).fillRect(14, 80, 84, 8);
  // trama de varas onde o barro caiu
  g.fillStyle(post);
  for (const [x, y] of [[22, 54], [78, 72]]) {
    g.fillRect(x, y, 10, 1).fillRect(x, y + 4, 10, 1).fillRect(x + 2, y - 2, 1, 9).fillRect(x + 7, y - 2, 1, 9);
  }
  g.fillRect(12, 44, 4, 44).fillRect(96, 44, 4, 44).fillRect(12, 62, 88, 3);
  // porta e janela
  g.fillStyle(post).fillRect(42, 56, 22, 32);
  g.fillStyle(0x24160b).fillRect(45, 59, 16, 29);
  g.fillStyle(0xf0a24a, 0.35).fillRect(45, 80, 16, 8);
  g.fillStyle(post).fillRect(72, 50, 16, 13);
  g.fillStyle(0x24160b).fillRect(74, 52, 12, 9);
  g.fillStyle(post).fillRect(79, 52, 2, 9);
  // telhado de palha
  const straw = 0xd9a441;
  g.fillStyle(darken(straw, 35)).fillPoints([{ x: 0, y: 52 }, { x: 112, y: 52 }, { x: 78, y: 8 }, { x: 34, y: 8 }], true);
  g.fillStyle(straw).fillPoints([{ x: 3, y: 49 }, { x: 109, y: 49 }, { x: 76, y: 10 }, { x: 36, y: 10 }], true);
  const rng = new Phaser.Math.RandomDataGenerator(['hut-quilombo']);
  for (let i = 0; i < 90; i++) {
    const y = rng.between(12, 42);
    // meia-largura do telhado nesta altura (de 20 no topo a 53 na base), com folga de 3px
    const t = (y + 6 - 10) / 39;
    const half = 20 + t * 33 - 3;
    const x = Math.round(56 + rng.realInRange(-half, half));
    g.fillStyle(rng.pick([darken(straw, 22), lighten(straw, 18), darken(straw, 10)])).fillRect(x, y, 1, rng.between(3, 6));
  }
  // franja irregular da palha e cumeeira
  g.fillStyle(darken(straw, 15));
  for (let x = 3; x < 109; x += 3) g.fillRect(x, 49, 2, rng.between(2, 5));
  g.fillStyle(darken(straw, 40)).fillRect(34, 6, 44, 5);
}

export const DECOR_VARIANTS = 3;
const TUFT = { w: 18, h: 16 } as const;
const FLOWER_PETALS = [0xc0392b, 0xf2b705, 0xfff3c4] as const;

/** Tufo em leque: lâminas curvas saindo da base, cada uma num tom de verde */
function paintTuft(g: G, rng: Phaser.Math.RandomDataGenerator, variant: number): void {
  const baseX = TUFT.w / 2;
  const baseY = TUFT.h - 1;
  const blades = 6 + variant;
  const maxLen = 9 + variant * 2;
  for (let i = 0; i < blades; i++) {
    const spread = (i / (blades - 1)) * 2 - 1; // -1..1
    const len = maxLen * (1 - Math.abs(spread) * 0.45) * rng.realInRange(0.75, 1);
    const color = rng.pick([LEAF.base, LEAF.light, LEAF.dark, LEAF.base]);
    const steps = Math.ceil(len);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // curva: sobe e se abre para o lado, mais no fim da lâmina
      const x = baseX + spread * (len * 0.35 * t + len * 0.35 * t * t);
      const y = baseY - len * t * (1 - Math.abs(spread) * 0.25 * t);
      const tip = s === steps;
      g.fillStyle(tip ? LEAF.warm : color).fillRect(Math.round(x), Math.round(y), s < steps * 0.3 ? 2 : 1, 1);
    }
  }
  // variante com sementes nas pontas
  if (variant === 2) {
    g.fillStyle(0xd9c27a);
    for (const dx of [-3, 1, 4]) g.fillRect(baseX + dx, 1 + Math.abs(dx) % 3, 1, 2);
  }
}

function paintFlower(g: G, petal: number): void {
  // caule com duas folhas
  g.fillStyle(LEAF.dark).fillRect(5, 5, 1, 9);
  g.fillStyle(LEAF.base).fillRect(2, 9, 3, 1).fillRect(1, 8, 2, 1).fillRect(6, 10, 3, 1).fillRect(8, 9, 2, 1);
  // pétalas em cruz com miolo
  g.fillStyle(darken(petal, 25)).fillRect(3, 1, 5, 5).fillRect(4, 0, 3, 7);
  g.fillStyle(petal).fillRect(3, 2, 5, 3).fillRect(4, 1, 3, 5);
  g.fillStyle(lighten(petal, 25)).fillRect(4, 1, 1, 1);
  g.fillStyle(0xf2b705).fillRect(5, 3, 1, 1);
  if (petal === 0xf2b705) g.fillStyle(0x7a4a2a).fillRect(5, 3, 1, 1);
}

export function makeQuilomboArt(draw: Draw): void {
  draw('sky-quilombo', BG_W, BG_H, paintSky);
  draw('sunglow-quilombo', SUN.glowSize, SUN.glowSize, paintSunGlow);
  draw('clouds-quilombo', BG_W, CLOUDS_H, paintClouds);
  draw('far-quilombo', BG_W, FAR_H, paintFar);
  draw('hills-quilombo', BG_W, HILLS_H, paintHills);
  draw('mid-quilombo', BG_W, MID_H, paintMid);
  draw('near-quilombo', BG_W, NEAR_H, paintNear);
  draw('fg-quilombo', BG_W, FG_H, paintForeground);
  draw('bird-0', 11, 5, (g) => paintBird(g, true));
  draw('bird-1', 11, 5, (g) => paintBird(g, false));
  // partículas genéricas: pólen dourado e fumaça
  draw('mote', 4, 4, (g) => {
    g.fillStyle(0xffe9a8, 0.5).fillRect(0, 1, 4, 2).fillRect(1, 0, 2, 4);
    g.fillStyle(0xfff4d0).fillRect(1, 1, 2, 2);
  });
  draw('smoke', 12, 12, (g) => {
    g.fillStyle(0xd8c8c0, 0.35).fillCircle(6, 6, 6);
    g.fillStyle(0xe8dcd4, 0.5).fillCircle(5, 5, 4);
  });

  drawPadded(draw, 'tree-quilombo', 80, 120, { side: 10, top: 6 }, paintTree);
  drawPadded(draw, 'palm-quilombo', 64, 120, { side: 12, top: 4 }, paintPalm);
  draw('palisade-quilombo', 32, 64, paintPalisade);
  drawPadded(draw, 'hut-quilombo', 112, 88, { side: 2, top: 2 }, paintHut);

  for (let v = 0; v < 2; v++) {
    const rng = new Phaser.Math.RandomDataGenerator([`decor-quilombo-${v}`]);
    drawPadded(draw, `bush-quilombo-${v}`, 40, 24, { side: 2, top: 2 }, (g) => paintBush(g, rng));
  }
  for (let v = 0; v < DECOR_VARIANTS; v++) {
    const rng = new Phaser.Math.RandomDataGenerator([`tuft-quilombo-${v}`]);
    draw(`tuft-quilombo-${v}`, TUFT.w, TUFT.h, (g) => paintTuft(g, rng, v));
    draw(`flower-quilombo-${v}`, 11, 14, (g) => paintFlower(g, FLOWER_PETALS[v]));
  }
  drawPadded(draw, 'rock-quilombo', 22, 14, { side: 1, top: 1 }, paintRock);
}
