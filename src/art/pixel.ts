import Phaser from 'phaser';

// Grade de caracteres: cada char é uma cor do ColorMap, '.' é transparente
export type PixelGrid = string[][];
export type ColorMap = Readonly<Record<string, number>>;

export const EMPTY = '.';

export function createGrid(w: number, h: number): PixelGrid {
  return Array.from({ length: h }, () => Array<string>(w).fill(EMPTY));
}

/** Copia um desenho em texto para a grade; '.' não sobrescreve */
export function stamp(grid: PixelGrid, rows: readonly string[], x: number, y: number): void {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const ch = row[dx];
      if (ch !== EMPTY) setPixel(grid, x + dx, y + dy, ch);
    }
  });
}

export function rect(grid: PixelGrid, x: number, y: number, w: number, h: number, ch: string): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) setPixel(grid, xx, yy, ch);
}

export function setPixel(grid: PixelGrid, x: number, y: number, ch: string): void {
  const row = grid[y];
  if (row && x >= 0 && x < row.length) row[x] = ch;
}

/** Contorno de 1px em volta de tudo que não é transparente */
export function outline(grid: PixelGrid, ch: string): void {
  const h = grid.length;
  const w = grid[0].length;
  const filled = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && grid[y][x] !== EMPTY;
  const marks: Array<[number, number]> = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] !== EMPTY) continue;
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) marks.push([x, y]);
    }
  }
  for (const [x, y] of marks) grid[y][x] = ch;
}

/** Pinta a grade agrupando pixels iguais em sequência para gerar menos retângulos */
export function paintGrid(g: Phaser.GameObjects.Graphics, grid: PixelGrid, colors: ColorMap, ox = 0, oy = 0): void {
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== EMPTY) {
        const color = colors[ch];
        if (color === undefined) throw new Error(`Cor não definida para '${ch}'`);
        g.fillStyle(color).fillRect(ox + x, oy + y, end - x, 1);
      }
      x = end;
    }
  });
}
