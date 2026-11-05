import Phaser from 'phaser';
import { TILE_SIZE } from '../config/physics';
import type { LevelConfig, Landmark, LandmarkKind, SceneryTheme } from '../data/levels';
import { DECOR_VARIANTS, SUN } from '../art/themes/quilombo';
import { SUN_SAOPAULO, paintBuilding } from '../art/themes/saopaulo';

// Profundidades: fundo < construções < árvores < tiles (0) < enfeites de chão < player (10) < primeiro plano
export const DEPTH = {
  sky: -100,
  sunGlow: -99,
  birds: -97,
  clouds: -95,
  far: -90,
  hills: -85,
  mid: -80,
  motes: -70,
  near: -60,
  smoke: -32,
  landmark: -30,
  tree: -20,
  // atrás dos tiles: a base fica escondida pela grama e o objeto parece plantado
  seated: -10,
  groundDecor: 3,
  foreground: 50,
} as const;

// quanto a base de cada enfeite afunda abaixo do topo do chão
const SEAT = { tree: 8, bush: 7, rock: 5, small: 3 } as const;

// balanço da vegetação rasteira
const WIND = { minAngle: 3, maxAngle: 7, minMs: 900, maxMs: 1700 } as const;

// quanto cada camada anda em relação à câmera (1 = junto com o chão)
const PARALLAX = { clouds: 0.04, birds: 0.08, far: 0.1, hills: 0.2, mid: 0.32, near: 0.5, foreground: 1.3 } as const;

const AMBIENT = {
  cloudDriftPxPerSec: 6,
  sunPulseMs: 3200,
  birdCount: 4,
  birdSpeed: { min: 18, max: 32 },
  birdFlapFps: 6,
  smoke: { lifespan: 3200, frequency: 380 },
} as const;

// O que cada tema liga no fundo: halo do sol (se tiver) e pólen dourado
interface ThemeFx {
  sun?: { x: number; y: number };
  motes: boolean;
}
const THEME_FX: Record<SceneryTheme, ThemeFx> = {
  quilombo: { sun: SUN, motes: true },
  saopaulo: { sun: SUN_SAOPAULO, motes: false },
  caninde: { motes: false },
};

// Saída de fumaça de cada marco, a partir do centro (dx) e do topo (dy) da imagem
const CHIMNEY: Partial<Record<LandmarkKind, { dx: number; dy: number }>> = {
  hut: { dx: 10, dy: 12 },
  townhouse: { dx: 30, dy: 2 },
};

export type ParallaxUpdater = (cam: Phaser.Cameras.Scene2D.Camera, delta: number) => void;

interface Bird {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  speed: number;
  phase: number;
}

/** Céu, camadas em parallax e elementos vivos do fundo (nuvens, sol, pássaros, pólen) */
export function addParallax(scene: Phaser.Scene, level: LevelConfig): ParallaxUpdater {
  const { theme } = level;
  const { width, height } = scene.scale;
  if (!scene.textures.exists(`sky-${theme}`)) return () => undefined;

  scene.add.image(0, 0, `sky-${theme}`).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.sky);

  const fx = THEME_FX[theme];
  // halo do sol pulsando devagar
  if (fx.sun) {
    const glow = scene.add.image(fx.sun.x, fx.sun.y, `sunglow-${theme}`).setScrollFactor(0).setDepth(DEPTH.sunGlow);
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.7, to: 1 },
      scale: { from: 0.95, to: 1.08 },
      duration: AMBIENT.sunPulseMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  const layer = (key: string, depth: number, top?: number): Phaser.GameObjects.TileSprite => {
    const frame = scene.textures.getFrame(key);
    return scene.add
      .tileSprite(0, top ?? height - frame.height, width, frame.height, key)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(depth);
  };
  const clouds = layer(`clouds-${theme}`, DEPTH.clouds, 0);
  const far = layer(`far-${theme}`, DEPTH.far);
  const hills = layer(`hills-${theme}`, DEPTH.hills);
  const mid = layer(`mid-${theme}`, DEPTH.mid);
  const near = layer(`near-${theme}`, DEPTH.near);
  const fg = layer(`fg-${theme}`, DEPTH.foreground);

  // pólen dourado flutuando na luz do fim de tarde
  if (fx.motes) {
    scene.add
      .particles(0, 0, 'mote', {
        x: { min: 0, max: width },
        y: { min: height * 0.35, max: height * 0.9 },
        lifespan: { min: 4000, max: 7000 },
        speedX: { min: -10, max: 10 },
        speedY: { min: -14, max: -4 },
        scale: { start: 1, end: 0.4 },
        alpha: { start: 0.9, end: 0 },
        frequency: 220,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.motes);
  }

  const birds = createBirds(scene, width);

  let cloudDrift = 0;
  return (cam, delta) => {
    const dt = delta / 1000;
    cloudDrift += AMBIENT.cloudDriftPxPerSec * dt;
    clouds.tilePositionX = cam.scrollX * PARALLAX.clouds + cloudDrift;
    far.tilePositionX = cam.scrollX * PARALLAX.far;
    hills.tilePositionX = cam.scrollX * PARALLAX.hills;
    mid.tilePositionX = cam.scrollX * PARALLAX.mid;
    near.tilePositionX = cam.scrollX * PARALLAX.near;
    fg.tilePositionX = cam.scrollX * PARALLAX.foreground;

    const span = width + 40;
    for (const b of birds) {
      b.x += b.speed * dt;
      b.phase += dt * 2;
      const screenX = Phaser.Math.Wrap(b.x - cam.scrollX * PARALLAX.birds, -20, span - 20);
      b.sprite.setPosition(screenX, b.y + Math.sin(b.phase) * 3);
    }
  };
}

function createBirds(scene: Phaser.Scene, width: number): Bird[] {
  if (!scene.anims.exists('bird-flap')) {
    scene.anims.create({ key: 'bird-flap', frames: [{ key: 'bird-0' }, { key: 'bird-1' }], frameRate: AMBIENT.birdFlapFps, repeat: -1 });
  }
  const rng = new Phaser.Math.RandomDataGenerator(['birds']);
  return Array.from({ length: AMBIENT.birdCount }, () => {
    const sprite = scene.add.sprite(0, 0, 'bird-0').setScrollFactor(0).setDepth(DEPTH.birds);
    sprite.play({ key: 'bird-flap', startFrame: rng.between(0, 1) });
    sprite.anims.timeScale = rng.realInRange(0.8, 1.3);
    return {
      sprite,
      x: rng.between(0, width),
      y: rng.between(60, 230),
      speed: rng.between(AMBIENT.birdSpeed.min, AMBIENT.birdSpeed.max),
      phase: rng.realInRange(0, Math.PI * 2),
    };
  });
}

/** Fumaça saindo do telhado das casas */
function addChimneySmoke(scene: Phaser.Scene, x: number, y: number): void {
  scene.add
    .particles(x, y, 'smoke', {
      lifespan: AMBIENT.smoke.lifespan,
      frequency: AMBIENT.smoke.frequency,
      speedX: { min: 3, max: 10 },
      speedY: { min: -24, max: -12 },
      scale: { start: 0.5, end: 2.2 },
      alpha: { start: 0.55, end: 0 },
    })
    .setDepth(DEPTH.smoke);
}

/** Linha do topo do chão (X) numa coluna, ou -1 se a coluna é buraco */
function surfaceRow(map: string[], tx: number): number {
  for (let ty = 1; ty < map.length; ty++) {
    if (map[ty][tx] === 'X' && map[ty - 1][tx] !== 'X') return ty;
  }
  return -1;
}

/** Prédio pintado sobre os tiles sólidos: a altura vem do mapa (da primeira linha sólida da coluna até o fim do bloco) */
function placeBuilding(scene: Phaser.Scene, level: LevelConfig, lm: Landmark): void {
  const { map, theme } = level;
  const painters: Partial<Record<SceneryTheme, typeof paintBuilding>> = { saopaulo: paintBuilding };
  const paint = painters[theme];
  if (!paint) return;
  let top = 0;
  while (top < map.length && map[top][lm.x] !== 'X') top++;
  let bottom = top;
  while (bottom + 1 < map.length && map[bottom + 1][lm.x] === 'X') bottom++;
  if (top >= map.length) return;

  const w = (lm.width ?? 1) * TILE_SIZE;
  const h = (bottom - top + 1) * TILE_SIZE;
  const variant = lm.variant ?? 0;
  const key = `building-${theme}-${variant}-${w}x${h}`;
  if (!scene.textures.exists(key)) {
    const g = scene.add.graphics();
    paint(g, w, h, variant);
    g.generateTexture(key, w, h);
    g.destroy();
  }
  // acima dos tiles (0) e abaixo da sombra das quinas (1) e da franja do topo (2)
  scene.add.image(lm.x * TILE_SIZE, top * TILE_SIZE, key).setOrigin(0, 0).setDepth(0.5);
}

function placeLandmark(scene: Phaser.Scene, level: LevelConfig, lm: Landmark, used: Set<number>): void {
  const { map, theme } = level;
  const width = lm.width ?? 1;
  if (lm.kind === 'building') {
    placeBuilding(scene, level, lm);
    return;
  }
  const key = lm.variant === undefined ? `${lm.kind}-${theme}` : `${lm.kind}-${theme}-${lm.variant}`;
  if (!scene.textures.exists(key)) return;
  if (lm.kind === 'palisade') {
    for (let i = 0; i < width; i++) {
      const tx = lm.x + i;
      const row = surfaceRow(map, tx);
      if (row < 0) continue;
      scene.add.image(tx * TILE_SIZE, row * TILE_SIZE + 4, `palisade-${theme}`).setOrigin(0, 1).setDepth(DEPTH.landmark);
      used.add(tx);
    }
    return;
  }
  const row = surfaceRow(map, lm.x);
  if (row < 0) return;
  // lampiões ficam na frente das casas
  const depth = lm.kind === 'lamp' ? DEPTH.landmark : DEPTH.landmark - 1;
  const img = scene.add.image(lm.x * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + 2, key).setOrigin(0.5, 1).setDepth(depth);
  const half = Math.ceil(img.width / 2 / TILE_SIZE);
  for (let tx = lm.x - half; tx <= lm.x + half; tx++) used.add(tx);
  const chimney = CHIMNEY[lm.kind];
  if (chimney) addChimneySmoke(scene, img.x + chimney.dx, img.y - img.height + chimney.dy);
}

/** Chão no mesmo nível por `radius` colunas para cada lado (nada pendurado na quina) */
function flatAround(map: string[], tx: number, row: number, radius: number): boolean {
  for (let d = -radius; d <= radius; d++) if (surfaceRow(map, tx + d) !== row) return false;
  return true;
}

/** Marcos posicionados à mão + enfeites espalhados de forma determinística (mesmo resultado a cada partida) */
export function decorateLevel(scene: Phaser.Scene, level: LevelConfig): void {
  const { theme } = level;
  const used = new Set<number>();
  level.landmarks.forEach((lm) => placeLandmark(scene, level, lm, used));

  if (scene.textures.exists(`tree-${theme}`)) decorateNature(scene, level, used);
  else if (scene.textures.exists(`crate-${theme}`)) decorateCity(scene, level, used);
}

/** Cidade: caixas e barris encostados no chão, nas ruas planas */
function decorateCity(scene: Phaser.Scene, level: LevelConfig, used: Set<number>): void {
  const { map, theme } = level;
  const rng = new Phaser.Math.RandomDataGenerator([`scenery-${level.id}`]);
  for (let tx = 0; tx < map[0].length; tx++) {
    const row = surfaceRow(map, tx);
    if (row < 0 || used.has(tx) || !flatAround(map, tx, row, 1)) continue;
    const roll = rng.frac();
    if (roll > 0.12) continue;
    scene.add
      .image(tx * TILE_SIZE + TILE_SIZE / 2 + rng.between(-6, 6), row * TILE_SIZE + SEAT.small, `${roll < 0.06 ? 'crate' : 'barrel'}-${theme}`)
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.seated)
      .setFlipX(rng.frac() < 0.5);
  }
}

/** Natureza: árvores, arbustos, pedras, tufos e flores (com vento) */
function decorateNature(scene: Phaser.Scene, level: LevelConfig, used: Set<number>): void {
  const { map, theme } = level;
  const rng = new Phaser.Math.RandomDataGenerator([`scenery-${level.id}`]);
  const cols = map[0].length;
  let nextTreeAt = rng.between(2, 5);

  // sem plataforma ou chão nas `rows` linhas acima, em `radius` colunas para cada lado
  const clearAbove = (tx: number, row: number, rows: number, radius: number): boolean => {
    for (let d = -radius; d <= radius; d++) {
      for (let r = 1; r <= rows; r++) {
        const ch = map[row - r]?.[tx + d];
        if (ch === 'X' || ch === 'B') return false;
      }
    }
    return true;
  };

  for (let tx = 0; tx < cols; tx++) {
    const row = surfaceRow(map, tx);
    if (row < 0) continue;
    const groundY = row * TILE_SIZE;
    const centerX = tx * TILE_SIZE + TILE_SIZE / 2;

    if (tx >= nextTreeAt && !used.has(tx) && flatAround(map, tx, row, 2) && clearAbove(tx, row, 4, 1)) {
      const kind = rng.frac() < 0.35 ? 'palm' : 'tree';
      scene.add
        .image(centerX, groundY + SEAT.tree, `${kind}-${theme}`)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.tree)
        .setFlipX(rng.frac() < 0.5);
      nextTreeAt = tx + rng.between(4, 8);
    }

    const seated = (key: string, seat: number, jitter: number): void => {
      scene.add
        .image(centerX + rng.between(-jitter, jitter), groundY + seat, key)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.seated)
        .setFlipX(rng.frac() < 0.5);
    };
    if (!used.has(tx) && flatAround(map, tx, row, 1) && clearAbove(tx, row, 1, 1)) {
      if (rng.frac() < 0.16) seated(`bush-${theme}-${rng.between(0, 1)}`, SEAT.bush, 4);
      else if (rng.frac() < 0.07) seated(`rock-${theme}`, SEAT.rock, 6);
    }

    // tufos e flores são pequenos: ficam na frente, dentro da faixa de grama do próprio tile,
    // e balançam ao vento cada um no seu ritmo
    const small = (key: string): void => {
      const img = scene.add
        .image(centerX + rng.between(-10, 10), groundY + SEAT.small, key)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.groundDecor)
        .setFlipX(rng.frac() < 0.5);
      const sway = rng.realInRange(WIND.minAngle, WIND.maxAngle);
      scene.tweens.add({
        targets: img,
        angle: { from: -sway, to: sway },
        duration: rng.between(WIND.minMs, WIND.maxMs),
        delay: rng.between(0, WIND.maxMs),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    };
    if (rng.frac() < 0.6) small(`tuft-${theme}-${rng.between(0, DECOR_VARIANTS - 1)}`);
    if (rng.frac() < 0.18) small(`flower-${theme}-${rng.between(0, DECOR_VARIANTS - 1)}`);
  }
}
