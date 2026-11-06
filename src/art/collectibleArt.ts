import { EMPTY, createGrid, outline, paintGrid, rect, setPixel, stamp, type ColorMap, type PixelGrid } from './pixel';
import type { Draw } from './tileArt';

/*
 * Coletáveis em pixel art: Sankofa (o pássaro Adinkra que olha para trás), carta de alforria
 * (pergaminho com lacre) e folha de papel (página de caderno com letra de mão), mais as
 * texturas de brilho usadas ao redor deles (halo, faísca e cintilho).
 */

const COLORS: ColorMap = {
  o: 0x3a2410, // contorno marrom escuro
  g: 0xe8a30c, w: 0xfff6d0, // ovo dourado, olho e listras do Sankofa
  p: 0xf0dfb0, P: 0xcdb27a, q: 0x9c7a46, // pergaminho: claro, sombra e tinta
  r: 0xc0392b, R: 0x8a2418, k: 0xe9776a, // lacre de cera
  n: 0xffffff, N: 0xdcdcdc, M: 0xb0b0b0, // papel
  b: 0x6f8fc4, e: 0xd96a5f, i: 0x45506b, // pauta azul, margem vermelha e tinta
  B: 0x1b1714, c: 0xa8263f, u: 0xf5e6c8, // pássaro Sankofa: corpo, asa e contorno creme
};

/** Textura grande (menu, histórias, Game Over): o desenho de 46×46 mais o contorno de 1 px */
export const SANKOFA_SIZE = { w: 48, h: 48 } as const;
/** Ícone pequeno (coletável, HUD, carta, vitória): o mesmo desenho reduzido com suavização */
export const SANKOFA_ICON_SIZE = 32;

/*
 * Pássaro Sankofa (Adinkra): o corpo avança e a cabeça olha para trás, com o ovo no bico
 * ("voltar e buscar o que ficou para trás"). Desenhado a partir da referência do grupo.
 * B = corpo preto, c = asa carmim, w = olho e listras, g = ovo dourado. O contorno creme ('u')
 * é posto em volta, para o pássaro preto aparecer também sobre fundos escuros.
 */
const SANKOFA_ART: readonly string[] = [
  '............BBBBBB............................',
  '.........BBBBBBBBBB...........................',
  '........BBBBBBBBBBBB..........................',
  '.......BBBBBBBBBwwwBB.........................',
  '......BBBBBBBBBwwwwwBB...............B........',
  '.....BBBBBBBBBBwwwwwBB..............BB........',
  '....BBBBBB..BBBwwwwBBB.............BBB........',
  '...BBBBB......BBwwBBBB............BBBB........',
  '..BBBBB........BBBBBBB............BBB..BB.....',
  '..BBBB..........BBBBBBB..........BBBB..BB.....',
  '..BBBB..........BBBBBB...........BBB..BBB.....',
  '.BBBBB...........BBBBB..........BBB...BB......',
  '.BBBBB...........BBBBB..........BB...BB.......',
  '.BBBBBB...........B..B.........BBB..BB....BBB.',
  'BBBBBBB...........B............BBB.BB..BBBBB..',
  'BBwwBBBB...........ggg........BBBBBBBBBBBB....',
  'BBwBBBBBB.........gggg.......BBBBBBBBBBB......',
  'BBBBBwwBBBB.......gggg......BBBwwBBBBBBBBBBBB.',
  'BBBBwwwwBBBBB.......g......BBBwwwBBwBBBBBBBBBB',
  'BBBwwBBBBBBBBBBB........BBBBBBwwBBBwwBBB......',
  'BBBwBBBwwBBBBBBBBBBBBBBBBBBBBBwwwBBBBBB.......',
  'BBwwBBwwBBwwwBBBcccccBBBBBBBBBBBwBBBBBBB......',
  '.BBBBwwBBwwwBBBBccccccccccccccBBBBBBB.........',
  '.BBBBwBBwwwBBBBBBBBccccccccccccccBBBBB........',
  '..BBBwBBwwBBBBcccccBBBBccccccccccBBBBB........',
  '..BBBwBwwBBBBBBcccccccBBBBBBcccccBBB..........',
  '...BBBBwwBBBBcBBcccccccccBBBBBBccBBB..........',
  '....BBBwwBBBccccBBccccccccccBBccBBBBB.........',
  '....BBBwBBBBBcccccBBBBcccccccccBBB............',
  '.....BBBBBBBBBBccccccBBBBBBccccBBBB...........',
  '......BBBBBBcccBBBccccccBBBcccBBBBB...........',
  '......BBBBBBcccccBBBBccccccccBBB..............',
  '.......BBBBBBcccccBBBBBcccccBBBB..............',
  '.........BBBBBBcccccBBcccccBBBBB..............',
  '..........BBBBBBcccccccccBBBBBBB..............',
  '............BBBBBBBccccBBBBB..................',
  '..............BBBBBBBBBBBBBB..................',
  '.................BBBBBBBBBBB..................',
  '...................BBB...BBB..................',
  '....................BB...BBB..................',
  '....................BB...BBB..................',
  '....................BB...BBB..................',
  '....................BB...BBB..................',
  '....................BB...BBB..................',
  '...................BBBBBBBBBBBBB..............',
  '.................BBBBBBBBBBBBBBBBBB...........',
];

function sankofaGrid(): PixelGrid {
  const grid = createGrid(SANKOFA_SIZE.w, SANKOFA_SIZE.h);
  stamp(grid, SANKOFA_ART, 1, 1);
  outline(grid, 'u');
  return grid;
}

/** O mesmo pássaro todo numa cor só: marca d'água sobre fundos escuros */
function sankofaSilhouetteGrid(): PixelGrid {
  return sankofaGrid().map((row) => row.map((ch) => (ch === EMPTY ? EMPTY : 'u')));
}

/** Reduz a grade para `size` px fazendo a média das cores de cada bloco (o que sobra de vazio vira transparência) */
function paintSmoothed(draw: Draw, key: string, grid: PixelGrid, size: number): void {
  const ratio = grid.length / size;
  draw(key, size, size, (g) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let r = 0;
        let gr = 0;
        let b = 0;
        let filled = 0;
        let total = 0;
        for (let sy = Math.floor(y * ratio); sy < Math.min(grid.length, Math.ceil((y + 1) * ratio)); sy++) {
          for (let sx = Math.floor(x * ratio); sx < Math.min(grid[0].length, Math.ceil((x + 1) * ratio)); sx++) {
            total++;
            const ch = grid[sy][sx];
            if (ch === EMPTY) continue;
            const c = COLORS[ch];
            r += (c >> 16) & 255;
            gr += (c >> 8) & 255;
            b += c & 255;
            filled++;
          }
        }
        if (filled === 0) continue;
        const color = (Math.round(r / filled) << 16) | (Math.round(gr / filled) << 8) | Math.round(b / filled);
        g.fillStyle(color, filled / total).fillRect(x, y, 1, 1);
      }
    }
  });
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
  paintSmoothed(draw, 'sankofa', sankofaGrid(), SANKOFA_ICON_SIZE);
  paint('sankofa-big', sankofaGrid());
  paint('sankofa-silhouette', sankofaSilhouetteGrid());
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
