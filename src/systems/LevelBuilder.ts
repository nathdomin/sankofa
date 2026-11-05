import Phaser from 'phaser';
import { TILE_SIZE } from '../config/physics';
import type { LevelConfig } from '../data/levels';
import { EDGE_W, FRINGE_H, LIP_W, TILE_VARIANTS, tileKeys } from '../art/tileArt';

// Ponto no mundo = centro-inferior do tile (onde os pés da entidade ficam)
export interface SpawnPoint {
  x: number;
  y: number;
}

export type EnemyKind = 'desinformacao' | 'esquecimento';

export interface EnemySpawn extends SpawnPoint {
  kind: EnemyKind;
}

export interface BuiltLevel {
  widthPx: number;
  heightPx: number;
  solids: Phaser.Physics.Arcade.StaticGroup;
  playerSpawn: SpawnPoint;
  goal: SpawnPoint;
  collectibles: SpawnPoint[];
  enemies: EnemySpawn[];
  checkpoints: SpawnPoint[];
  npcs: SpawnPoint[];
  isSolidAt(tileX: number, tileY: number): boolean;
}

const SOLID_CHARS = new Set(['X', 'B']);
const KNOWN_CHARS = new Set(['.', 'X', 'B', 'P', 'C', 'E', 'F', 'K', 'N', 'G']);

function validate(level: LevelConfig): void {
  const { map } = level;
  if (map.length === 0) throw new Error(`Fase ${level.id}: mapa vazio`);
  const width = map[0].length;
  let players = 0;
  let goals = 0;
  map.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`Fase ${level.id}: linha ${y} tem ${row.length} colunas (esperado ${width})`);
    }
    for (const ch of row) {
      if (!KNOWN_CHARS.has(ch)) throw new Error(`Fase ${level.id}: caractere desconhecido '${ch}' na linha ${y}`);
      if (ch === 'P') players++;
      if (ch === 'G') goals++;
    }
  });
  if (players !== 1) throw new Error(`Fase ${level.id}: precisa de exatamente 1 'P' (tem ${players})`);
  if (goals !== 1) throw new Error(`Fase ${level.id}: precisa de exatamente 1 'G' (tem ${goals})`);
}

function placeTileVisual(
  scene: Phaser.Scene,
  id: number,
  ch: string,
  tx: number,
  ty: number,
  isSolidAt: (tx: number, ty: number) => boolean,
  hasLip: (tx: number) => boolean,
): void {
  const x = tx * TILE_SIZE;
  const y = ty * TILE_SIZE;
  if (ch === 'B') {
    scene.add.image(x, y, tileKeys.block(id)).setOrigin(0, 0);
    return;
  }

  // variação fixa por posição para o chão não parecer repetido
  const variant = (tx * 7 + ty * 3) % TILE_VARIANTS;
  const isTop = !isSolidAt(tx, ty - 1);
  const texture = isTop
    ? tileKeys.top(id, variant)
    : isSolidAt(tx, ty - 2)
      ? tileKeys.deep(id)
      : tileKeys.ground(id, variant);
  scene.add.image(x, y, texture).setOrigin(0, 0);
  // lâminas de grama acima do chão: na frente dos enfeites, atrás do player
  if (isTop) scene.add.image(x, y - FRINGE_H + 1, tileKeys.fringe(id, variant)).setOrigin(0, 0).setDepth(2);

  // sombra nas laterais expostas e grama dobrando na quina (prédios pintados têm quina reta, sem grama saindo)
  const lip = isTop && hasLip(tx);
  if (!isSolidAt(tx - 1, ty)) {
    scene.add.image(x, y, tileKeys.edgeLeft).setOrigin(0, 0).setDepth(1);
    if (lip) scene.add.image(x - LIP_W, y, tileKeys.lip(id)).setOrigin(0, 0).setDepth(1);
  }
  if (!isSolidAt(tx + 1, ty)) {
    scene.add.image(x + TILE_SIZE - EDGE_W, y, tileKeys.edgeRight).setOrigin(0, 0).setDepth(1);
    if (lip) scene.add.image(x + TILE_SIZE, y, tileKeys.lip(id)).setOrigin(0, 0).setFlipX(true).setDepth(1);
  }
}

export function buildLevel(scene: Phaser.Scene, level: LevelConfig): BuiltLevel {
  validate(level);
  const { map, id } = level;
  const rows = map.length;
  const cols = map[0].length;

  const isSolidAt = (tx: number, ty: number): boolean => {
    if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) return false;
    return SOLID_CHARS.has(map[ty][tx]);
  };

  // para o visual, as bordas laterais do mapa contam como sólidas (sem sombra/grama na borda)
  const solidOrBorder = (tx: number, ty: number): boolean => tx < 0 || tx >= cols || isSolidAt(tx, ty);

  // colunas cobertas por fachadas de prédio (landmark `building`): a quina do telhado fica reta
  const buildingCols = new Set<number>();
  for (const lm of level.landmarks) {
    if (lm.kind !== 'building') continue;
    for (let i = 0; i < (lm.width ?? 1); i++) buildingCols.add(lm.x + i);
  }
  const hasLip = (tx: number): boolean => !buildingCols.has(tx);

  const solids = scene.physics.add.staticGroup();
  const built: BuiltLevel = {
    widthPx: cols * TILE_SIZE,
    heightPx: rows * TILE_SIZE,
    solids,
    playerSpawn: { x: 0, y: 0 },
    goal: { x: 0, y: 0 },
    collectibles: [],
    enemies: [],
    checkpoints: [],
    npcs: [],
    isSolidAt,
  };

  for (let ty = 0; ty < rows; ty++) {
    let runStart = -1;
    for (let tx = 0; tx <= cols; tx++) {
      const ch = tx < cols ? map[ty][tx] : '.';
      const solid = SOLID_CHARS.has(ch);

      if (solid) {
        placeTileVisual(scene, id, ch, tx, ty, solidOrBorder, hasLip);
        if (runStart < 0) runStart = tx;
      } else if (runStart >= 0) {
        // um corpo estático por sequência horizontal de tiles sólidos
        const w = (tx - runStart) * TILE_SIZE;
        const zone = scene.add.zone(runStart * TILE_SIZE + w / 2, ty * TILE_SIZE + TILE_SIZE / 2, w, TILE_SIZE);
        solids.add(zone);
        runStart = -1;
      }

      if (tx >= cols) continue;
      const point: SpawnPoint = { x: tx * TILE_SIZE + TILE_SIZE / 2, y: (ty + 1) * TILE_SIZE };
      switch (ch) {
        case 'P': built.playerSpawn = point; break;
        case 'G': built.goal = point; break;
        case 'C': built.collectibles.push(point); break;
        case 'E': built.enemies.push({ ...point, kind: 'desinformacao' }); break;
        case 'F': built.enemies.push({ ...point, kind: 'esquecimento' }); break;
        case 'K': built.checkpoints.push(point); break;
        case 'N': built.npcs.push(point); break;
        default: break;
      }
    }
  }

  return built;
}
