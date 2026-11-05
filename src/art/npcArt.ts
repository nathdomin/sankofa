import { darken, lighten } from '../config/palette';
import { createGrid, outline, paintGrid, rect, setPixel, type ColorMap, type PixelGrid } from './pixel';
import type { Draw } from './tileArt';

/*
 * Pessoas da fase 2 (século XIX) que são libertadas pelas cartas de alforria. Cinco variações
 * (cabelo, roupa, rosto) em pixel art, de frente. Cada uma tem dois estados:
 *  - preso: cores apagadas, olhar firme e algemas nos pulsos ligadas por uma corrente curta;
 *  - livre: cores cheias, sorriso, braços para o alto e as algemas abertas nos pulsos.
 * A pessoa é sempre mostrada de cabeça erguida, com dignidade: o foco é a liberdade, não o sofrimento.
 */

export const NPC_SIZE = { w: 28, h: 46 } as const;
export const NPC_VARIANTS = 5;

type HairStyle = 'wrap' | 'hat' | 'afro' | 'short' | 'grey';
type Bottom = 'dress' | 'trousers';
type TopStyle = 'plain' | 'apron' | 'vest' | 'suspenders';

interface Look {
  skin: number;
  hair: number;
  hairStyle: HairStyle;
  top: number;
  bottom: number;
  bottomStyle: Bottom;
  topStyle: TopStyle;
  /** turbante ou chapéu */
  headwear: number;
  /** avental, colete ou suspensório */
  trim: number;
  beard?: boolean;
  earrings?: boolean;
}

const LOOKS: readonly Look[] = [
  // mulher com turbante ocre, blusa creme, saia azul e avental branco
  { skin: 0x7a4a2c, hair: 0x161210, hairStyle: 'wrap', top: 0xf0e6d0, bottom: 0x3f6fb0, bottomStyle: 'dress', topStyle: 'apron', headwear: 0xe8a21a, trim: 0xf5f0e6, earrings: true },
  // homem com chapéu de palha, camisa branca e suspensório
  { skin: 0x6a4128, hair: 0x161210, hairStyle: 'hat', top: 0xf2efe6, bottom: 0x7a5a3a, bottomStyle: 'trousers', topStyle: 'suspenders', headwear: 0xd9b45a, trim: 0x5a3a1e },
  // mulher de cabelo crespo volumoso, blusa dourada e saia vinho
  { skin: 0x8a5a38, hair: 0x161210, hairStyle: 'afro', top: 0xf2b705, bottom: 0x9a2f2a, bottomStyle: 'dress', topStyle: 'plain', headwear: 0, trim: 0, earrings: true },
  // homem mais velho, cabelo e barba grisalhos, colete verde
  { skin: 0x5c3822, hair: 0xbab6ae, hairStyle: 'grey', top: 0xeee2c4, bottom: 0x55504a, bottomStyle: 'trousers', topStyle: 'vest', headwear: 0, trim: 0x2f6b43, beard: true },
  // jovem de cabelo curto, camisa ocre e calça azul
  { skin: 0x9a6a44, hair: 0x1a1410, hairStyle: 'short', top: 0xd98a2b, bottom: 0x3b5f8f, bottomStyle: 'trousers', topStyle: 'plain', headwear: 0, trim: 0 },
];

/** Apaga a cor: perto do cinza e um pouco mais escura (estado preso) */
function muted(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const lum = 0.3 * r + 0.59 * g + 0.11 * b;
  const mix = (c: number): number => Math.round((c * 0.2 + lum * 0.8) * 0.94);
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

function colorsFor(look: Look, free: boolean): ColorMap {
  const tone = (c: number): number => (free ? c : muted(c));
  return {
    s: tone(look.skin), S: tone(darken(look.skin, 22)), l: tone(lighten(look.skin, 14)),
    q: tone(darken(look.hair, 0)),
    h: tone(look.hair), H: tone(look.hair + 0x1a1a1a),
    t: tone(look.top), T: tone(darken(look.top, 18)),
    b: tone(look.bottom), B: tone(darken(look.bottom, 22)),
    a: tone(look.headwear || look.trim || 0xffffff), A: tone(darken(look.headwear || look.trim || 0xffffff, 25)),
    r: tone(look.trim || 0xffffff), R: tone(darken(look.trim || 0xffffff, 22)),
    p: 0x1a1210, w: 0xf5f0e6, m: tone(0x3a1a12), g: tone(0xf2b705),
    k: 0x4a4a52, K: 0x9a9aa4, // ferro escuro e brilho
    o: 0x1f140c,
  };
}

/** Segmento grosso entre dois pontos */
function line(g: PixelGrid, x0: number, y0: number, x1: number, y1: number, w: number, ch: string): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps);
    const y = Math.round(y0 + ((y1 - y0) * i) / steps);
    rect(g, x - Math.floor(w / 2), y - Math.floor(w / 2), w, w, ch);
  }
}

const HEAD = { x: 9, y: 4 } as const; // canto da cabeça de 11x11

function drawHead(g: PixelGrid, look: Look, free: boolean): void {
  const { x, y } = HEAD;
  // rosto e pescoço
  rect(g, x + 1, y + 2, 9, 8, 's');
  rect(g, x + 2, y + 10, 7, 1, 's');
  rect(g, x + 9, y + 3, 1, 7, 'S');
  rect(g, x + 3, y + 10, 5, 1, 'S');
  rect(g, x + 4, y + 11, 3, 2, 'S');
  setPixel(g, x, y + 6, 's');
  setPixel(g, x + 10, y + 6, 'S');
  // luz na testa e nas bochechas
  rect(g, x + 3, y + 3, 5, 1, 'l');
  // olhos (branco e pupila), sobrancelhas e nariz
  rect(g, x + 2, y + 5, 1, 1, 'w');
  rect(g, x + 3, y + 5, 1, 1, 'p');
  rect(g, x + 7, y + 5, 1, 1, 'p');
  rect(g, x + 8, y + 5, 1, 1, 'w');
  rect(g, x + 2, y + 4, 2, 1, 'q');
  rect(g, x + 7, y + 4, 2, 1, 'q');
  setPixel(g, x + 5, y + 7, 'S');
  // boca: firme enquanto preso, sorriso aberto quando livre
  if (free) {
    setPixel(g, x + 3, y + 8, 'm');
    setPixel(g, x + 7, y + 8, 'm');
    rect(g, x + 4, y + 9, 3, 1, 'm');
    setPixel(g, x + 5, y + 9, 'w');
  } else {
    rect(g, x + 4, y + 9, 3, 1, 'm');
  }
  if (look.earrings) {
    setPixel(g, x + 1, y + 8, 'g');
    setPixel(g, x + 9, y + 8, 'g');
  }

  // cabelo, turbante ou chapéu por cima
  switch (look.hairStyle) {
    case 'afro':
      rect(g, x + 2, y - 1, 7, 1, 'h');
      rect(g, x + 1, y, 9, 1, 'h');
      rect(g, x, y + 1, 11, 3, 'h');
      rect(g, x, y + 4, 2, 3, 'h');
      rect(g, x + 9, y + 4, 2, 3, 'h');
      rect(g, x + 3, y, 2, 1, 'H');
      rect(g, x + 2, y + 1, 1, 1, 'H');
      break;
    case 'short':
    case 'grey':
      rect(g, x + 2, y, 7, 1, 'h');
      rect(g, x + 1, y + 1, 9, 2, 'h');
      rect(g, x + 1, y + 3, 1, 3, 'h');
      rect(g, x + 9, y + 3, 1, 3, 'h');
      rect(g, x + 3, y + 1, 2, 1, 'H');
      if (look.beard) {
        rect(g, x + 2, y + 7, 1, 3, 'h');
        rect(g, x + 8, y + 7, 1, 3, 'h');
        rect(g, x + 2, y + 9, 7, 2, 'h');
        rect(g, x + 3, y + 8, 5, 1, 'h');
        rect(g, x + 4, y + 9, 3, 1, 'm');
        if (free) setPixel(g, x + 5, y + 9, 'w');
      }
      break;
    case 'wrap':
      rect(g, x + 1, y, 9, 4, 'a');
      rect(g, x + 1, y + 3, 9, 1, 'A');
      rect(g, x + 6, y - 2, 3, 2, 'a');
      for (const px of [2, 4, 6, 8]) setPixel(g, x + px, y + 1, 'A');
      rect(g, x + 1, y + 4, 1, 2, 'h');
      rect(g, x + 9, y + 4, 1, 2, 'h');
      break;
    case 'hat':
      rect(g, x + 2, y - 1, 7, 3, 'a');
      rect(g, x + 2, y + 1, 7, 1, 'A');
      rect(g, x - 1, y + 2, 13, 2, 'a');
      rect(g, x - 1, y + 3, 13, 1, 'A');
      rect(g, x + 1, y + 4, 1, 2, 'h');
      rect(g, x + 9, y + 4, 1, 2, 'h');
      break;
  }
}

const CX = 14; // eixo central do corpo
const SHOULDER_Y = 18;
const WAIST_Y = 29;
const FEET_Y = 44;

function drawBody(g: PixelGrid, look: Look): void {
  // saia ou calça por baixo, depois a blusa
  if (look.bottomStyle === 'dress') {
    for (let y = WAIST_Y; y <= FEET_Y - 2; y++) {
      const half = 5 + Math.floor(((y - WAIST_Y) * 3) / (FEET_Y - 2 - WAIST_Y)) + 1;
      rect(g, CX - half, y, half * 2, 1, 'b');
      rect(g, CX + half - 3, y, 3, 1, 'B');
    }
    rect(g, CX - 8, FEET_Y - 3, 16, 1, 'B');
    rect(g, CX - 4, FEET_Y - 1, 3, 2, 'S');
    rect(g, CX + 2, FEET_Y - 1, 3, 2, 'S');
  } else {
    rect(g, CX - 5, WAIST_Y, 10, 2, 'B');
    rect(g, CX - 5, WAIST_Y + 2, 4, 11, 'b');
    rect(g, CX + 1, WAIST_Y + 2, 4, 11, 'b');
    rect(g, CX - 2, WAIST_Y + 2, 1, 11, 'B');
    rect(g, CX + 4, WAIST_Y + 2, 1, 11, 'B');
    rect(g, CX - 5, FEET_Y - 3, 5, 3, 's');
    rect(g, CX + 1, FEET_Y - 3, 5, 3, 's');
    rect(g, CX - 5, FEET_Y - 1, 5, 1, 'S');
    rect(g, CX + 1, FEET_Y - 1, 5, 1, 'S');
  }

  // tronco
  rect(g, CX - 5, SHOULDER_Y - 1, 11, WAIST_Y - SHOULDER_Y + 2, 't');
  rect(g, CX + 3, SHOULDER_Y - 1, 3, WAIST_Y - SHOULDER_Y + 2, 'T');
  switch (look.topStyle) {
    case 'apron':
      rect(g, CX - 3, SHOULDER_Y + 3, 7, WAIST_Y - SHOULDER_Y + 14, 'r');
      rect(g, CX + 2, SHOULDER_Y + 3, 2, WAIST_Y - SHOULDER_Y + 14, 'R');
      break;
    case 'vest':
      rect(g, CX - 5, SHOULDER_Y - 1, 4, WAIST_Y - SHOULDER_Y + 2, 'r');
      rect(g, CX + 2, SHOULDER_Y - 1, 4, WAIST_Y - SHOULDER_Y + 2, 'r');
      rect(g, CX + 4, SHOULDER_Y - 1, 2, WAIST_Y - SHOULDER_Y + 2, 'R');
      break;
    case 'suspenders':
      rect(g, CX - 3, SHOULDER_Y - 1, 1, WAIST_Y - SHOULDER_Y + 3, 'r');
      rect(g, CX + 3, SHOULDER_Y - 1, 1, WAIST_Y - SHOULDER_Y + 3, 'r');
      break;
    case 'plain':
      break;
  }
  // gola em V
  rect(g, CX - 2, SHOULDER_Y - 1, 5, 1, 'S');
  rect(g, CX - 1, SHOULDER_Y, 3, 1, 'S');
}

function drawArms(g: PixelGrid, free: boolean): void {
  if (free) {
    // braços abertos para o alto, mãos acima da cabeça; as algemas já abertas nos pulsos
    for (const side of [-1, 1]) {
      const sh = { x: CX + side * 5, y: SHOULDER_Y };
      const el = { x: CX + side * 9, y: SHOULDER_Y - 6 };
      const hand = { x: CX + side * 11, y: SHOULDER_Y - 13 };
      line(g, sh.x, sh.y, el.x, el.y, 3, 't');
      line(g, el.x, el.y, hand.x, hand.y + 2, 3, 's');
      rect(g, hand.x - 1, hand.y - 1, 3, 3, 's');
      // argola aberta no pulso e um pedaço de corrente pendurado
      rect(g, hand.x - 1, hand.y + 3, 3, 2, 'k');
      setPixel(g, hand.x, hand.y + 3, 'K');
      setPixel(g, hand.x + side, hand.y + 5, 'k');
      setPixel(g, hand.x + side, hand.y + 6, 'K');
    }
    return;
  }
  // preso: braços à frente, as mãos juntas segurando a corrente curta entre as algemas
  for (const side of [-1, 1]) {
    const sh = { x: CX + side * 5, y: SHOULDER_Y };
    const el = { x: CX + side * 6, y: SHOULDER_Y + 7 };
    const hand = { x: CX + side * 3, y: SHOULDER_Y + 12 };
    line(g, sh.x, sh.y, el.x, el.y, 3, 't');
    line(g, el.x, el.y + 1, hand.x, hand.y, 3, 's');
    rect(g, hand.x - 1, hand.y - 1, 3, 3, 's');
    rect(g, hand.x - 1, hand.y - 3, 3, 2, 'k'); // algema no pulso
    setPixel(g, hand.x, hand.y - 3, 'K');
  }
  rect(g, CX - 1, SHOULDER_Y + 13, 3, 1, 'k');
  setPixel(g, CX, SHOULDER_Y + 14, 'k');
  setPixel(g, CX, SHOULDER_Y + 13, 'K');
}

function npcGrid(look: Look, free: boolean): PixelGrid {
  const g = createGrid(NPC_SIZE.w, NPC_SIZE.h);
  drawBody(g, look);
  drawArms(g, free);
  drawHead(g, look, free);
  outline(g, 'o');
  return g;
}

/** Texturas das cinco pessoas (preso e livre) e do elo de corrente que cai ao libertar */
export function makeNpcTextures(draw: Draw): void {
  LOOKS.forEach((look, i) => {
    for (const free of [false, true]) {
      const grid = npcGrid(look, free);
      draw(npcTextureKey(i, free), NPC_SIZE.w, NPC_SIZE.h, (g) => paintGrid(g, grid, colorsFor(look, free)));
    }
  });
  const link = createGrid(5, 3);
  rect(link, 0, 0, 5, 3, 'k');
  rect(link, 1, 1, 3, 1, '.');
  setPixel(link, 0, 0, 'K');
  setPixel(link, 1, 0, 'K');
  draw('chain-link', 5, 3, (g) => paintGrid(g, link, { k: 0x4a4a52, K: 0x9a9aa4 }));
}

export const npcTextureKey = (variant: number, free: boolean): string => `npc-${variant % NPC_VARIANTS}-${free ? 'livre' : 'preso'}`;
