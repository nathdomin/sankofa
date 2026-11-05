import { createGrid, outline, paintGrid, rect, setPixel, type ColorMap, type PixelGrid } from './pixel';
import type { Draw } from './tileArt';

/*
 * Os dois inimigos são ideias, nunca pessoas:
 *  - Desinformação: uma nuvem de boato roxa, com franja de "ruído de TV" (ciano e magenta), olhos
 *    desiguais, sorriso de dentes de serra e um "?" ou "!" que pisca sobre a cabeça. Pode ser pisada.
 *  - Esquecimento: um espectro de névoa com coroa de pontas, olhos vazios que brilham e a base se
 *    desfazendo em poeira: quem não é lembrado vai sumindo. As pontas impedem o pisão.
 * Cada um tem dois quadros de animação (`-0` e `-1`).
 */

export const ENEMY_SIZES = {
  desinformacao: { w: 28, h: 24 },
  esquecimento: { w: 28, h: 28 },
} as const;

export type EnemyArtKind = keyof typeof ENEMY_SIZES;

export const ENEMY_ACCENT: Readonly<Record<EnemyArtKind, number>> = { desinformacao: 0xe0409a, esquecimento: 0xa8e6ff };

const COLORS: ColorMap = {
  b: 0x4b3f5c, B: 0x362c44, l: 0x7a6a94, // nuvem
  m: 0xe0409a, c: 0x40d8e8, // ruído magenta e ciano
  w: 0xf5f0e6, p: 0x1a1210, o: 0x1a1224,
  F: 0x2f2a3a, f: 0x4a4458, g: 0x6e6a80, S: 0x1d1a26, // espectro: corpo, névoa clara, ponta
  e: 0xa8e6ff, E: 0xffffff, r: 0x8a84a0, k: 0x15121c, // olhos, brilho do contorno e boca
};

function ellipse(grid: PixelGrid, cx: number, cy: number, rx: number, ry: number, ch: string): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPixel(grid, x, y, ch);
    }
  }
}

const GLYPH_QUESTION = ['mmm', '..m', '.mm', '...', '.m.'];
const GLYPH_BANG = ['.m.', '.m.', '.m.', '...', '.m.'];

function desinformacaoGrid(frame: number): PixelGrid {
  const { w, h } = ENEMY_SIZES.desinformacao;
  const lumps = (g: PixelGrid, ch: string, dx: number): void => {
    ellipse(g, 14 + dx, 15, 13, 8, ch);
    ellipse(g, 8 + dx, 10, 6, 5, ch);
    ellipse(g, 17 + dx, 8, 7, 6, ch);
    ellipse(g, 12 + dx, 8, 4, 4, ch);
  };

  // franja de ruído: o corpo em ciano e magenta, deslocado para cada lado, com a ordem trocada a cada quadro
  const g = createGrid(w, h);
  const fringe = frame === 0 ? 1 : -1;
  lumps(g, 'c', -fringe);
  lumps(g, 'm', fringe);
  const body = createGrid(w, h);
  lumps(body, 'b', 0);

  // relevo: luz em cima e à esquerda, sombra embaixo
  const filled = (x: number, y: number): boolean => (body[y]?.[x] ?? '.') !== '.';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!filled(x, y)) continue;
      const top = !filled(x, y - 1) || !filled(x - 1, y - 1);
      const bottom = !filled(x, y + 1) || !filled(x + 1, y + 1);
      setPixel(g, x, y, bottom ? 'B' : top ? 'l' : 'b');
    }
  }

  // olho grande, olho pequeno e sobrancelha brava
  ellipse(g, 10, 13, 3.2, 3.2, 'w');
  rect(g, 11, 13, 2, 2, 'p');
  ellipse(g, 19, 12, 2.2, 2.2, 'w');
  setPixel(g, 19, 12, 'p');
  setPixel(g, 20, 12, 'p');
  for (const [x, y] of [[6, 8], [7, 8], [8, 9], [9, 9], [10, 10], [11, 10]] as const) setPixel(g, x, y, 'p');
  for (const [x, y] of [[17, 9], [18, 9], [19, 8], [20, 8]] as const) setPixel(g, x, y, 'p');

  // boca de dentes de serra
  rect(g, 6, 18, 17, 3, 'p');
  for (let x = 6; x < 23; x += 2) {
    setPixel(g, x, 18, 'w');
    setPixel(g, x + 1, 20, 'w');
  }

  // pezinhos, que se alternam a cada quadro
  const left = frame === 0 ? 6 : 8;
  const right = frame === 0 ? 17 : 15;
  rect(g, left, 22, 6, 2, 'B');
  rect(g, right, 22, 6, 2, 'B');

  // ruído solto em volta e o símbolo de boato sobre a cabeça
  const bits: Array<[number, number, string]> = frame === 0 ? [[1, 12, 'c'], [26, 14, 'm'], [24, 3, 'm'], [24, 19, 'c']] : [[2, 16, 'm'], [25, 11, 'c'], [24, 2, 'c'], [26, 20, 'm']];
  for (const [x, y, ch] of bits) setPixel(g, x, y, ch);
  const glyph = frame === 0 ? GLYPH_QUESTION : GLYPH_BANG;
  glyph.forEach((row, dy) => [...row].forEach((ch, dx) => ch !== '.' && setPixel(g, 2 + dx, dy, ch)));

  outline(g, 'o');
  return g;
}

function esquecimentoGrid(frame: number): PixelGrid {
  const { w, h } = ENEMY_SIZES.esquecimento;
  const g = createGrid(w, h);

  // coroa de pontas: a do meio é a mais alta
  for (const [cx, top] of [[4, 4], [9, 2], [14, 0], [19, 2], [24, 4]] as const) {
    for (let y = top; y < 9; y++) {
      const half = Math.min(1, Math.floor((y - top) / 3));
      rect(g, cx - half, y, half * 2 + 1, 1, 'S');
    }
  }
  // cabeça em cúpula e corpo de névoa que se alarga e termina em ondas
  ellipse(g, 14, 14, 10, 8, 'F');
  const phase = frame * Math.PI;
  for (let x = 4; x < 24; x++) {
    const bottom = 26 + Math.round(1.4 * Math.sin(x * 0.9 + phase));
    for (let y = 14; y <= bottom; y++) {
      const half = 9.5 + (y - 14) * 0.12;
      if (Math.abs(x + 0.5 - 14) <= half) setPixel(g, x, y, 'F');
    }
  }

  // névoa mais clara nas bordas e embaixo: o corpo vai desbotando
  const filled = (x: number, y: number): boolean => (g[y]?.[x] ?? '.') !== '.';
  const snapshot = g.map((row) => [...row]);
  const wasFilled = (x: number, y: number): boolean => (snapshot[y]?.[x] ?? '.') !== '.';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!filled(x, y) || snapshot[y][x] === 'S') continue;
      const rim = !wasFilled(x - 1, y) || !wasFilled(x + 1, y);
      if (y >= 24) setPixel(g, x, y, 'g');
      else if (y >= 19 || rim) setPixel(g, x, y, 'f');
      if (!wasFilled(x - 1, y - 1) && y < 16) setPixel(g, x, y, 'g');
    }
  }

  // desfazendo: falhas na base, que mudam de lugar a cada quadro
  for (let y = 21; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!filled(x, y)) continue;
      const hash = (x * 7 + y * 13 + frame * 5) % 11;
      if (hash < (y - 20)) setPixel(g, x, y, '.');
    }
  }

  // olhos vazios que brilham e uma boca fina
  rect(g, 9, 12, 4, 2, 'e');
  rect(g, 16, 12, 4, 2, 'e');
  rect(g, 10, 12, 2, 1, 'E');
  rect(g, 17, 12, 2, 1, 'E');
  rect(g, 14, 17, 1, 3, 'k');

  // um contorno claro de névoa, que também desenha as falhas da base
  outline(g, 'r');
  return g;
}

export function enemyGrid(kind: EnemyArtKind, frame: number): PixelGrid {
  return kind === 'desinformacao' ? desinformacaoGrid(frame) : esquecimentoGrid(frame);
}

export const enemyTextureKey = (kind: EnemyArtKind, frame: number): string => `enemy-${kind}-${frame}`;
export const ENEMY_FRAMES = 2;

/** Texturas dos dois inimigos (dois quadros cada) e o pixel usado nas partículas de derrota */
export function makeEnemyTextures(draw: Draw): void {
  for (const kind of Object.keys(ENEMY_SIZES) as EnemyArtKind[]) {
    const { w, h } = ENEMY_SIZES[kind];
    for (let frame = 0; frame < ENEMY_FRAMES; frame++) {
      const grid = enemyGrid(kind, frame);
      draw(enemyTextureKey(kind, frame), w, h, (g) => paintGrid(g, grid, COLORS));
    }
  }
  draw('pixel', 3, 3, (g) => g.fillStyle(0xffffff).fillRect(0, 0, 3, 3));
}
