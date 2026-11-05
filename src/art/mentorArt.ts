import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import type { MentorId } from '../data/levels';
import { EMPTY, createGrid, outline, paintGrid, rect, setPixel, type ColorMap, type PixelGrid } from './pixel';
import type { Draw } from './tileArt';

export const PORTRAIT = { w: 200, h: 240 } as const;

// Retratos em pixel art (busto), uma grade de 50x60 pixels ampliada 4x. São ilustrações estilizadas,
// inspiradas no que se sabe da aparência de cada pessoa; Zumbi dos Palmares não tem retrato da época,
// então o dele é imaginado a partir das representações tradicionais (líder guerreiro, lança, contas).
const GRID = { w: 50, h: 60, scale: 4 } as const;

/** Cor de destaque do fundo de cada retrato */
export const MENTOR_ACCENT: Record<MentorId, number> = {
  zumbi: PALETTE.gold,
  luizgama: 0x6b8cae,
  carolina: PALETTE.red,
};

export type MentorVariant = 'idle' | 'talk' | 'blink';

export const mentorTextureKey = (id: MentorId, variant: MentorVariant = 'idle'): string =>
  variant === 'idle' ? `mentor-${id}` : `mentor-${id}-${variant}`;

// centro do rosto: as colunas são simétricas em torno de 24,5 (espelho: x' = 49 - x)
const CX = 24.5;
const mirror = (x: number): number => 49 - x;

interface Head {
  cy: number;
  rx: number;
  ry: number;
}

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function fillEllipse(grid: PixelGrid, cx: number, cy: number, rx: number, ry: number, ch: string, where?: (x: number, y: number) => boolean): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (inEllipse(x, y, cx, cy, rx, ry) && (!where || where(x, y))) setPixel(grid, x, y, ch);
    }
  }
}

/** Pixel e o seu espelho */
function pair(grid: PixelGrid, x: number, y: number, ch: string): void {
  setPixel(grid, x, y, ch);
  setPixel(grid, mirror(x), y, ch);
}

/** Ombros arredondados: meia-largura por linha, a partir de y = 44 */
const SHOULDER_HW = [11, 15, 18, 21, 23, 24, 25];

function paintTorso(grid: PixelGrid, ch: string): void {
  for (let y = 44; y < GRID.h; y++) {
    const hw = SHOULDER_HW[Math.min(y - 44, SHOULDER_HW.length - 1)];
    for (let x = 25 - hw; x < 25 + hw; x++) setPixel(grid, x, y, ch);
  }
}

function paintNeckAndHead(grid: PixelGrid, head: Head): void {
  // pescoço com sombra sob o queixo
  rect(grid, 21, head.cy + head.ry - 4, 8, 44 - (head.cy + head.ry - 4) + 3, 's');
  rect(grid, 21, head.cy + head.ry - 1, 8, 4, 'S');
  // orelhas
  fillEllipse(grid, CX - head.rx - 0.5, head.cy + 2, 2, 3, 's');
  fillEllipse(grid, CX + head.rx + 0.5, head.cy + 2, 2, 3, 'S');
  // rosto com sombra do lado direito e embaixo, e realce na bochecha e na testa
  fillEllipse(grid, CX, head.cy, head.rx, head.ry, 's');
  fillEllipse(grid, CX, head.cy, head.rx, head.ry, 'S', (x, y) => (x - CX) / head.rx > 0.55 || (y > head.cy + head.ry * 0.78 && x > CX));
  fillEllipse(grid, CX - 5, head.cy + 5, 1.8, 1.4, 'h');
}

type Brows = 'stern' | 'straight' | 'arched';

const BROW_CELLS: Record<Brows, ReadonlyArray<readonly [number, number]>> = {
  stern: [[17, 22], [18, 22], [19, 22], [20, 23], [21, 23], [18, 23], [19, 23]],
  straight: [[17, 22], [18, 22], [19, 22], [20, 22], [21, 22], [18, 23], [19, 23], [20, 23]],
  arched: [[17, 23], [18, 22], [19, 22], [20, 22], [21, 23]],
};

interface FaceOptions {
  brows: Brows;
  /** Cantos da boca para cima */
  smile?: boolean;
}

function paintFace(grid: PixelGrid, variant: MentorVariant, opts: FaceOptions): void {
  // sobrancelhas
  for (const [x, y] of BROW_CELLS[opts.brows]) pair(grid, x, y, 'b');
  // olhos: branco, íris e pálpebra; fechados no piscar
  for (const x of [18, 19, 20, 21]) {
    if (variant === 'blink') {
      pair(grid, x, 26, 'k');
    } else {
      pair(grid, x, 25, 'w');
      pair(grid, x, 26, 'w');
      pair(grid, x, 24, 'k');
    }
  }
  if (variant !== 'blink') {
    for (const [x, y] of [[19, 25], [20, 25], [19, 26], [20, 26]] as const) pair(grid, x, y, 'e');
    pair(grid, 18, 26, 'S');
  }
  // nariz: ponte, narinas e ponta clara
  setPixel(grid, 23, 27, 'S');
  setPixel(grid, 23, 28, 'S');
  setPixel(grid, 23, 29, 'S');
  for (const x of [22, 23, 26, 27]) setPixel(grid, x, 31, 'S');
  setPixel(grid, 23, 31, 'k');
  setPixel(grid, 26, 31, 'k');
  setPixel(grid, 24, 30, 'h');
  setPixel(grid, 25, 30, 'h');
  setPixel(grid, 24, 29, 'h');
  // boca
  if (variant === 'talk') {
    for (const x of [23, 24, 25, 26]) {
      setPixel(grid, x, 34, 'm');
      setPixel(grid, x, 35, 't');
      setPixel(grid, x, 36, 'o');
      setPixel(grid, x, 37, 'm');
    }
  } else {
    for (const x of [22, 23, 24, 25, 26, 27]) setPixel(grid, x, 35, 'o');
    for (const x of [23, 24, 25, 26]) {
      setPixel(grid, x, 34, 'm');
      setPixel(grid, x, 36, 'm');
    }
    if (opts.smile) {
      setPixel(grid, 21, 34, 'o');
      setPixel(grid, 28, 34, 'o');
    }
  }
}

// --- Zumbi dos Palmares (imaginado) ---

const ZUMBI_COLORS: ColorMap = {
  k: 0x140d08, w: 0xf5efe6, e: 0x1a0f0a, m: 0x7a3b30, o: 0x2a0f0f, t: 0xf1e8dc,
  s: 0x6b4328, S: 0x4f301c, h: 0x78502f, b: 0x140d08,
  H: 0x1b130e, J: 0x34281f, B: 0x1b130e,
  c: 0xb3382a, C: 0x8a2a1f, g: 0xf2b705, G: 0xb88403,
  W: 0x7a5232, V: 0x5a3b22, P: 0xc4cbd2, Q: 0x7f8890,
};

function drawZumbi(variant: MentorVariant): PixelGrid {
  const grid = createGrid(GRID.w, GRID.h);
  const head: Head = { cy: 26, rx: 11, ry: 14 };
  // lança atrás do ombro esquerdo: haste e ponta de metal
  for (let y = 12; y < GRID.h; y++) {
    setPixel(grid, 8 + Math.floor((60 - y) / 26), y, 'W');
    setPixel(grid, 9 + Math.floor((60 - y) / 26), y, 'V');
  }
  for (let i = 0; i < 9; i++) {
    const half = Math.floor((9 - i) / 3);
    for (let dx = -half; dx <= half; dx++) setPixel(grid, 10 + dx, 3 + i, i < 2 ? 'Q' : 'P');
  }
  paintTorso(grid, 's');
  // ombros com sombra e faixa de pano vermelha cruzando o peito
  for (let y = 44; y < GRID.h; y++) {
    const x0 = 14 + Math.round((y - 44) * 1.75);
    for (let x = x0; x < x0 + 8; x++) setPixel(grid, x, y, x >= x0 + 6 ? 'C' : 'c');
    for (let x = 36; x < 50; x++) if (grid[y][x] === 's') setPixel(grid, x, y, 'S');
  }
  paintNeckAndHead(grid, head);
  // cabelo curto e barba cheia pelo contorno do queixo
  fillEllipse(grid, CX, head.cy - 1, head.rx + 1, head.ry + 1, 'H', (x, y) => y <= 17 || (y <= 24 && Math.abs(x - CX) > head.rx - 1));
  for (let x = 14; x < 36; x += 3) setPixel(grid, x, 15 + ((x * 7) % 3), 'J');
  fillEllipse(grid, CX, 36, head.rx + 0.5, 8, 'B', (x, y) => y >= 33 && !(y <= 37 && Math.abs(x - CX) < 3.2) && y <= 42);
  for (const x of [20, 21, 22, 27, 28, 29]) setPixel(grid, x, 32, 'B'); // bigode
  paintFace(grid, variant, { brows: 'stern' });
  // colar de contas douradas e vermelhas
  for (let dx = -9; dx <= 9; dx += 2) {
    const y = 44 + Math.floor((dx * dx) / 22);
    const bead = Math.abs(dx) % 4 === 1 ? 'g' : 'c';
    setPixel(grid, Math.round(CX + dx), y, bead);
    setPixel(grid, Math.round(CX + dx), y + 1, bead === 'g' ? 'G' : 'C');
  }
  outline(grid, 'k');
  return grid;
}

// --- Luiz Gama ---

const GAMA_COLORS: ColorMap = {
  k: 0x111111, w: 0xf5efe6, e: 0x1a0f0a, m: 0x6a2f26, o: 0x2a0f0f, t: 0xf1e8dc,
  s: 0x7a4f35, S: 0x5c3a27, h: 0x88593d, b: 0x1f1c19,
  H: 0x26231f, J: 0x8d8a85, B: 0x2c2926,
  c: 0x23252e, C: 0x3f4351, p: 0xf0ece4, P: 0xc9c4b8,
};

function drawGama(variant: MentorVariant): PixelGrid {
  const grid = createGrid(GRID.w, GRID.h);
  const head: Head = { cy: 26, rx: 11, ry: 14 };
  paintTorso(grid, 'c');
  // camisa branca em V entre as lapelas
  for (let y = 44; y < GRID.h; y++) {
    const hw = Math.min(3 + Math.floor((y - 44) * 0.4), 7);
    for (let x = 25 - hw; x < 25 + hw; x++) setPixel(grid, x, y, x === 24 || x === 25 ? 'P' : 'p');
    setPixel(grid, 25 - hw - 1, y, 'C');
    setPixel(grid, 25 + hw, y, 'C');
  }
  paintNeckAndHead(grid, head);
  for (let y = 43; y < 47; y++) {
    for (let x = 18; x < 23; x++) setPixel(grid, x, y, 'p');
    for (let x = 27; x < 32; x++) setPixel(grid, x, y, 'p');
  }
  // laço preto
  rect(grid, 20, 46, 4, 4, 'k');
  rect(grid, 27, 46, 4, 4, 'k');
  rect(grid, 24, 47, 3, 2, 'k');
  // cabelo grisalho recuado e costeletas ligadas à barba
  fillEllipse(grid, CX, head.cy - 1, head.rx + 1, head.ry + 1, 'H', (x, y) => y <= 18 && !(y >= 15 && Math.abs(x - CX) < 4.5));
  for (let x = 15; x < 35; x += 2) setPixel(grid, x, 14 + ((x * 5) % 3), 'J');
  for (const side of [0, 1]) {
    for (let y = 18; y < 33; y++) {
      for (let k = 0; k < 3; k++) setPixel(grid, side ? mirror(14 + k) : 14 + k, y, 'B');
    }
  }
  fillEllipse(grid, CX, 36, head.rx + 0.5, 8.5, 'B', (x, y) => y >= 31 && !(y >= 34 && y <= 37 && Math.abs(x - CX) < 3.2) && y <= 43);
  for (const x of [19, 20, 21, 22, 23, 26, 27, 28, 29, 30]) setPixel(grid, x, 32, 'B'); // bigode
  const rng = new Phaser.Math.RandomDataGenerator(['gama-beard']);
  for (let i = 0; i < 14; i++) {
    const x = rng.between(16, 33);
    const y = rng.between(37, 43);
    if (grid[y][x] === 'B') setPixel(grid, x, y, 'J');
  }
  paintFace(grid, variant, { brows: 'straight' });
  outline(grid, 'k');
  return grid;
}

// --- Carolina Maria de Jesus ---

const CAROLINA_COLORS: ColorMap = {
  k: 0x140d08, w: 0xf5efe6, e: 0x1a0f0a, m: 0x8a3b32, o: 0x2a0f0f, t: 0xf1e8dc,
  s: 0x5c3820, S: 0x42261a, h: 0x674029, b: 0x1f130c,
  d: 0xd9573a, D: 0xa83d28, g: 0xf2b705,
  c: 0x3f7fb5, C: 0x2f6592, p: 0xf5efe6, P: 0xd8d0c4, r: 0xc0392b, R: 0x8f2a20,
};

function drawCarolina(variant: MentorVariant): PixelGrid {
  const grid = createGrid(GRID.w, GRID.h);
  const head: Head = { cy: 27, rx: 12, ry: 14 };
  paintTorso(grid, 'c');
  for (let y = 44; y < GRID.h; y++) for (let x = 36; x < 50; x++) if (grid[y][x] === 'c') setPixel(grid, x, y, 'C');
  paintNeckAndHead(grid, head);
  // gola redonda branca e botões
  fillEllipse(grid, 24.5, 45, 9, 4, 'p', (x, y) => y >= 43 && !inEllipse(x, y, 24.5, 43, 6, 3));
  for (const y of [52, 56]) pair(grid, 24, y, 'p');
  // lenço na cabeça: faixa na testa, volume no alto e nó de lado, com estampa dourada
  fillEllipse(grid, CX, head.cy - 2, head.rx + 2, head.ry, 'd', (_x, y) => y <= 19);
  fillEllipse(grid, CX, 11, 10, 5, 'd');
  fillEllipse(grid, 11, 12, 4, 3.4, 'd');
  fillEllipse(grid, 7, 16, 2.4, 3, 'D');
  for (let y = 5; y <= 20; y++) {
    for (let x = 5; x < 46; x++) {
      if (grid[y][x] === 'd' && (x + y * 2) % 6 === 0) setPixel(grid, x, y, 'g');
      else if (grid[y][x] === 'd' && y === 19) setPixel(grid, x, y, 'D');
    }
  }
  // brincos
  for (const y of [31, 32]) pair(grid, 11, y, 'g');
  paintFace(grid, variant, { brows: 'arched', smile: true });
  // caderno vermelho nas mãos
  rect(grid, 32, 49, 16, 11, 'R');
  rect(grid, 33, 50, 14, 9, 'r');
  rect(grid, 44, 50, 3, 9, 'p');
  for (const y of [52, 54, 56]) rect(grid, 35, y, 7, 1, 'p');
  fillEllipse(grid, 33, 56, 3, 2.4, 's');
  fillEllipse(grid, 33, 56, 3, 2.4, 'S', (_x, y) => y > 56);
  outline(grid, 'k');
  return grid;
}

const DRAWERS: Record<MentorId, { draw: (variant: MentorVariant) => PixelGrid; colors: ColorMap }> = {
  zumbi: { draw: drawZumbi, colors: ZUMBI_COLORS },
  luizgama: { draw: drawGama, colors: GAMA_COLORS },
  carolina: { draw: drawCarolina, colors: CAROLINA_COLORS },
};

/** Três quadros por mentor: parado (boca fechada), falando (boca aberta) e piscando */
export function makeMentorTextures(draw: Draw): void {
  (Object.keys(DRAWERS) as MentorId[]).forEach((id) => {
    const { draw: drawGrid, colors } = DRAWERS[id];
    for (const variant of ['idle', 'talk', 'blink'] as const) {
      draw(mentorTextureKey(id, variant), PORTRAIT.w, PORTRAIT.h, (g) => {
        const grid = drawGrid(variant);
        // 'k' (contorno) existe em todas as paletas; células sem cor definida são erro de arte
        grid.forEach((row) => row.forEach((ch, x) => { if (ch !== EMPTY && colors[ch] === undefined) throw new Error(`Cor '${ch}' sem definição no retrato ${id} (x=${x})`); }));
        paintGrid(g, grid, colors, 0, 0, GRID.scale);
      });
    }
  });
}
