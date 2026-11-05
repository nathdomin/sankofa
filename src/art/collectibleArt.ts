import { PALETTE } from '../config/palette';
import { createGrid, outline, paintGrid, rect, setPixel, type ColorMap, type PixelGrid } from './pixel';
import type { Draw } from './tileArt';

/*
 * Coletáveis em pixel art: Sankofa (símbolo Adinkra do coração com espirais), carta de alforria
 * (pergaminho com lacre) e folha de papel (página de caderno com letra de mão), mais as
 * texturas de brilho usadas ao redor deles (halo, faísca e cintilho).
 */

const COLORS: ColorMap = {
  o: 0x3a2410, // contorno marrom escuro
  g: PALETTE.gold, G: 0xb07d00, l: 0xffe58a, w: 0xfff6d0,
  p: 0xf0dfb0, P: 0xcdb27a, q: 0x9c7a46, // pergaminho: claro, sombra e tinta
  r: 0xc0392b, R: 0x8a2418, k: 0xe9776a, // lacre de cera
  n: 0xffffff, N: 0xdcdcdc, M: 0xb0b0b0, // papel
  b: 0x6f8fc4, e: 0xd96a5f, i: 0x45506b, // pauta azul, margem vermelha e tinta
};

export const SANKOFA_SIZE = { w: 26, h: 24 } as const;

/** Coração Sankofa: ouro com relevo e uma espiral gravada em cada lóbulo */
function sankofaGrid(): PixelGrid {
  const { w, h } = SANKOFA_SIZE;
  const grid = createGrid(w, h);
  const iw = w - 2;
  const ih = h - 2;
  // curva do coração: (x²+y²-1)³ - x²y³ <= 0
  const inside = (px: number, py: number): boolean => {
    const x = ((px + 0.5 - iw / 2) / (iw / 2)) * 1.18;
    const y = 1.28 - ((py + 0.5) / ih) * 2.3;
    return Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y <= 0;
  };
  for (let py = 0; py < ih; py++) {
    for (let px = 0; px < iw; px++) {
      if (!inside(px, py)) continue;
      // luz vinda de cima à esquerda: borda clara em cima, sombra embaixo e à direita
      const lit = !inside(px - 1, py - 1) || !inside(px, py - 1);
      const shade = !inside(px + 1, py + 1) || !inside(px, py + 1);
      const mirrored = px >= iw / 2;
      setPixel(grid, px + 1, py + 1, shade ? 'G' : lit && !mirrored ? 'l' : 'g');
    }
  }
  // espiral gravada no lóbulo esquerdo: parte do lado do centro, contorna o lóbulo e se enrola para dentro
  const cx = 7.5;
  const cy = 8;
  for (let t = 0; t <= 1; t += 0.008) {
    const ang = -0.35 + t * Math.PI * 3;
    const r = 5.2 - 3.9 * t;
    const sx = Math.round(cx + r * Math.cos(ang));
    const sy = Math.round(cy - r * Math.sin(ang));
    setPixel(grid, sx, sy, 'G');
    setPixel(grid, w - 1 - sx, sy, 'G'); // o lóbulo direito é o espelho
  }
  // brilho num pixel do lóbulo
  setPixel(grid, 4, 4, 'w');
  setPixel(grid, 3, 5, 'w');
  outline(grid, 'o');
  return grid;
}

export const ALFORRIA_SIZE = { w: 20, h: 24 } as const;

/** Carta de alforria: pergaminho enrolado em cima e embaixo, linhas de tinta e lacre de cera vermelho */
function alforriaGrid(): PixelGrid {
  const { w, h } = ALFORRIA_SIZE;
  const grid = createGrid(w, h);
  // folha
  rect(grid, 3, 4, 14, 16, 'p');
  rect(grid, 3, 4, 1, 16, 'w');
  rect(grid, 16, 4, 1, 16, 'P');
  // rolos de cima e de baixo, com ponta escurecida
  for (const y of [1, 19]) {
    rect(grid, 1, y, 18, 4, 'p');
    rect(grid, 1, y, 18, 1, 'w');
    rect(grid, 1, y + 3, 18, 1, 'P');
    rect(grid, 1, y + 1, 1, 2, 'P');
    rect(grid, 18, y + 1, 1, 2, 'P');
  }
  // texto: título curto e linhas de tinta
  rect(grid, 6, 6, 8, 1, 'q');
  for (const [y, len] of [[9, 10], [11, 10], [13, 7]] as const) rect(grid, 5, y, len, 1, 'q');
  // lacre de cera com laço
  rect(grid, 11, 16, 2, 4, 'R');
  rect(grid, 14, 16, 2, 4, 'R');
  rect(grid, 11, 14, 5, 4, 'r');
  rect(grid, 10, 15, 7, 2, 'r');
  rect(grid, 12, 13, 3, 1, 'r');
  rect(grid, 12, 17, 3, 1, 'r');
  setPixel(grid, 11, 14, 'k');
  setPixel(grid, 12, 14, 'k');
  setPixel(grid, 13, 15, 'R');
  setPixel(grid, 14, 16, 'R');
  outline(grid, 'o');
  return grid;
}

export const PAPEL_SIZE = { w: 18, h: 24 } as const;

/** Folha de caderno: pauta azul, margem vermelha, letra de mão e canto dobrado */
function papelGrid(): PixelGrid {
  const { w, h } = PAPEL_SIZE;
  const grid = createGrid(w, h);
  rect(grid, 1, 1, 16, 22, 'n');
  rect(grid, 16, 1, 1, 22, 'N');
  rect(grid, 1, 22, 16, 1, 'N');
  // canto superior direito dobrado
  for (let i = 0; i < 6; i++) rect(grid, 11 + i, 1 + i, 6 - i, 1, '.');
  for (let i = 0; i < 5; i++) rect(grid, 12 + i, 2 + i, 5 - i, 1, i === 0 ? 'M' : 'N');
  // pauta e margem
  rect(grid, 4, 1, 1, 22, 'e');
  for (const y of [8, 11, 14, 17, 20]) rect(grid, 2, y, 14, 1, 'b');
  // letra de mão: palavras curtas apoiadas na pauta, a última linha termina antes
  const lines: Array<[number, number[]]> = [[8, [3, 2, 4]], [11, [4, 3, 2]], [14, [2, 4, 3]], [17, [3, 3]], [20, [4]]];
  for (const [y, words] of lines) {
    let x = 6;
    for (const len of words) {
      rect(grid, x, y - 1, len, 1, 'i');
      if (len > 2) setPixel(grid, x + 1, y - 2, 'i');
      x += len + 1;
    }
  }
  outline(grid, 'o');
  return grid;
}

/** Estrela de quatro pontas (cintilho e faíscas) */
const SPARK = [
  '...w...',
  '...w...',
  '..www..',
  'wwwwwww',
  '..www..',
  '...w...',
  '...w...',
];

/** Texturas dos coletáveis e dos efeitos de brilho ao redor deles */
export function makeCollectibleTextures(draw: Draw): void {
  const paint = (key: string, grid: PixelGrid): void => {
    draw(key, grid[0].length, grid.length, (g) => paintGrid(g, grid, COLORS));
  };
  paint('sankofa', sankofaGrid());
  paint('alforria', alforriaGrid());
  paint('papel', papelGrid());

  const spark = SPARK.map((row) => row.split(''));
  paint('spark', spark);

  // halo suave: círculos concêntricos quase transparentes (o tom vem do tint)
  const size = 56;
  draw('collect-glow', size, size, (g) => {
    for (let r = size / 2; r > 4; r -= 3) g.fillStyle(0xffffff, 0.05).fillCircle(size / 2, size / 2, r);
  });
}
