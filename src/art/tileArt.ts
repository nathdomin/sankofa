import Phaser from 'phaser';
import { TILE_SIZE } from '../config/physics';
import { darken, lighten } from '../config/palette';
import type { LevelPalette, SceneryTheme } from '../data/levels';
import { lerpColor } from './colors';
import { paintSacada } from './themes/saopaulo';

export type Draw = (key: string, w: number, h: number, paint: (g: Phaser.GameObjects.Graphics) => void) => void;

export const TILE_VARIANTS = 3;
export const EDGE_W = 4;
export const LIP_W = 5;
// franja de lâminas que fica acima do topo do tile (a última linha encosta no tile)
export const FRINGE_H = 10;

export const tileKeys = {
  top: (id: number, v: number): string => `ground-top-${id}-${v}`,
  ground: (id: number, v: number): string => `ground-${id}-${v}`,
  deep: (id: number): string => `ground-deep-${id}`,
  block: (id: number): string => `block-${id}`,
  lip: (id: number): string => `lip-${id}`,
  fringe: (id: number, v: number): string => `fringe-${id}-${v}`,
  edgeLeft: 'edge-left',
  edgeRight: 'edge-right',
};

const S = TILE_SIZE;

function paintDirt(g: Phaser.GameObjects.Graphics, p: LevelPalette, rng: Phaser.Math.RandomDataGenerator, fromY: number, base: number): void {
  g.fillStyle(base).fillRect(0, fromY, S, S - fromY);
  // torrões escuros e grãos claros
  g.fillStyle(darken(base, 12));
  for (let i = 0; i < 12; i++) g.fillRect(rng.between(0, S - 3), rng.between(fromY, S - 2), rng.pick([2, 3]), rng.pick([1, 2]));
  g.fillStyle(lighten(base, 10));
  for (let i = 0; i < 6; i++) g.fillRect(rng.between(0, S - 1), rng.between(fromY, S - 1), 1, 1);
  // pedrinhas
  const stones = rng.between(1, 2);
  for (let i = 0; i < stones; i++) {
    const x = rng.between(2, S - 9);
    const y = rng.between(fromY + 3, S - 6);
    const stone = lighten(p.ground, 28);
    g.fillStyle(darken(stone, 30)).fillRect(x, y + 1, 7, 4).fillRect(x + 1, y, 5, 5);
    g.fillStyle(stone).fillRect(x + 1, y + 1, 5, 3);
    g.fillStyle(lighten(stone, 20)).fillRect(x + 2, y + 1, 2, 1);
  }
  // raiz fina ocasional
  if (rng.frac() < 0.5) {
    g.fillStyle(darken(base, 22));
    let x = rng.between(4, S - 4);
    for (let y = fromY; y < Math.min(S, fromY + 14); y++) {
      x += rng.between(-1, 1);
      g.fillRect(x, y, 1, 1);
    }
  }
}

export interface GrassShades {
  dark: number;
  base: number;
  light: number;
  tip: number;
}

export function grassShades(accent: number): GrassShades {
  return {
    dark: darken(accent, 22),
    base: accent,
    light: lighten(accent, 14),
    tip: lerpColor(lighten(accent, 25), 0xe8e070, 0.5),
  };
}

const FLOWER_COLORS = [0xfff3c4, 0xf2b705, 0xe0609a, 0xc0392b] as const;

/** Lâminas de alturas e inclinações variadas, com pontas claras e florzinhas ocasionais */
function paintFringe(g: Phaser.GameObjects.Graphics, rng: Phaser.Math.RandomDataGenerator, accent: number): void {
  const grass = grassShades(accent);
  const base = FRINGE_H - 1;
  g.fillStyle(grass.light).fillRect(0, base, S, 1);
  for (let x = 0; x < S; x++) {
    if (rng.frac() < 0.15) continue;
    const h = rng.between(2, FRINGE_H - 2);
    const lean = rng.pick([-1, 0, 0, 1]);
    const color = rng.pick([grass.base, grass.base, grass.light, grass.dark]);
    for (let i = 0; i < h; i++) {
      // a ponta da lâmina se inclina para um lado
      const px = Phaser.Math.Clamp(x + (i > h * 0.55 ? lean : 0), 0, S - 1);
      g.fillStyle(i === h - 1 ? grass.tip : color).fillRect(px, base - i, 1, 1);
    }
  }
  // florzinhas
  for (let i = 0; i < 2; i++) {
    if (rng.frac() > 0.45) continue;
    const x = rng.between(2, S - 3);
    const top = rng.between(1, 3);
    g.fillStyle(grass.dark).fillRect(x, top + 1, 1, base - top);
    g.fillStyle(rng.pick([...FLOWER_COLORS])).fillRect(x - 1, top, 3, 1).fillRect(x, top - 1, 1, 3);
    g.fillStyle(0xfde3a0).fillRect(x, top, 1, 1);
  }
}

/** Plataforma flutuante (`B`) própria de cada tema; sem entrada, usa os troncos amarrados */
const THEME_BLOCKS: Partial<Record<SceneryTheme, (g: Phaser.GameObjects.Graphics, p: LevelPalette) => void>> = {
  saopaulo: paintSacada,
};

export function makeTileTextures(draw: Draw, id: number, p: LevelPalette, theme: SceneryTheme): void {
  for (let v = 0; v < TILE_VARIANTS; v++) {
    draw(tileKeys.ground(id, v), S, S, (g) => {
      paintDirt(g, p, new Phaser.Math.RandomDataGenerator([`ground-${id}-${v}`]), 0, p.ground);
    });

    draw(tileKeys.top(id, v), S, S, (g) => {
      const rng = new Phaser.Math.RandomDataGenerator([`top-${id}-${v}`]);
      paintDirt(g, p, rng, 0, p.ground);
      const grass = grassShades(p.accent);
      for (let x = 0; x < S; x++) {
        const depth = 7 + Math.round(1.5 * Math.sin(x * 0.7 + v * 2.1)) + rng.between(0, 1);
        // sombra da grama sobre a terra
        g.fillStyle(darken(p.ground, 25)).fillRect(x, depth, 1, 2);
        // faixa com degradê: mais clara no alto, mais escura na base
        g.fillStyle(grass.light).fillRect(x, 0, 1, 2);
        g.fillStyle(grass.base).fillRect(x, 2, 1, depth - 4);
        g.fillStyle(grass.dark).fillRect(x, depth - 2, 1, 2);
        // traços de lâminas e brilhos para não parecer uma faixa lisa
        if (rng.frac() < 0.4) g.fillStyle(grass.dark).fillRect(x, rng.between(2, depth - 3), 1, rng.between(2, 3));
        if (rng.frac() < 0.3) g.fillStyle(grass.light).fillRect(x, rng.between(2, depth - 3), 1, 1);
        if (rng.frac() < 0.08) g.fillStyle(grass.tip).fillRect(x, rng.between(0, 3), 1, 1);
        // fiapos e raízes pendurados
        if (rng.frac() < 0.15) g.fillStyle(grass.dark).fillRect(x, depth, 1, rng.between(1, 3));
      }
    });

    draw(tileKeys.fringe(id, v), S, FRINGE_H, (g) => {
      paintFringe(g, new Phaser.Math.RandomDataGenerator([`fringe-${id}-${v}`]), p.accent);
    });
  }

  draw(tileKeys.deep(id), S, S, (g) => {
    paintDirt(g, p, new Phaser.Math.RandomDataGenerator([`deep-${id}`]), 0, darken(p.ground, 14));
  });

  const themed = THEME_BLOCKS[theme];
  // plataforma de troncos amarrados
  draw(tileKeys.block(id), S, S, (g) => {
    if (themed) {
      themed(g, p);
      return;
    }
    const wood = p.block;
    const bark = darken(wood, 30);
    for (const y of [0, 16]) {
      g.fillStyle(bark).fillRect(0, y + 1, S, 14);
      g.fillStyle(wood).fillRect(0, y + 2, S, 11);
      g.fillStyle(lighten(wood, 18)).fillRect(0, y + 3, S, 2);
      g.fillStyle(darken(wood, 15)).fillRect(0, y + 10, S, 2);
      g.fillStyle(bark).fillRect(5, y + 6, 6, 1).fillRect(18, y + 8, 8, 1).fillRect(12, y + 4, 3, 1);
    }
    // amarração de corda
    const rope = 0xc8a165;
    g.fillStyle(darken(rope, 25)).fillRect(13, 0, 6, S);
    g.fillStyle(rope);
    for (let y = 0; y < S; y += 3) g.fillRect(13, y, 6, 2);
  });

  // grama que dobra sobre a quina do barranco
  draw(tileKeys.lip(id), LIP_W, 12, (g) => {
    const heights = [3, 5, 7, 9, 11];
    heights.forEach((h, x) => {
      g.fillStyle(p.accent).fillRect(x, 0, 1, h);
      g.fillStyle(darken(p.accent, 22)).fillRect(x, h - 1, 1, 1);
    });
  });
}

/** Sombras nas laterais expostas, iguais para todas as fases */
export function makeEdgeTextures(draw: Draw): void {
  const alphas = [0.32, 0.22, 0.13, 0.06];
  draw(tileKeys.edgeLeft, EDGE_W, S, (g) => {
    alphas.forEach((a, x) => g.fillStyle(0x000000, a).fillRect(x, 0, 1, S));
  });
  draw(tileKeys.edgeRight, EDGE_W, S, (g) => {
    alphas.forEach((a, x) => g.fillStyle(0x000000, a).fillRect(EDGE_W - 1 - x, 0, 1, S));
  });
}
