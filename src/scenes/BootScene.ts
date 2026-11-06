import Phaser from 'phaser';
import { ENEMY, PLAYER } from '../config/physics';
import { PALETTE, darken } from '../config/palette';
import { LEVELS } from '../data/levels';
import { paintGrid } from '../art/pixel';
import { PLAYER_COLOR_MAP, PLAYER_POSES, PLAYER_RUN_KEYS, buildPoseGrid, playerTextureKey } from '../art/playerArt';
import { makeCollectibleTextures } from '../art/collectibleArt';
import { ENEMY_FRAMES, enemyTextureKey, makeEnemyTextures, type EnemyArtKind } from '../art/enemyArt';
import { makeHudTextures } from '../art/hudArt';
import { makeMentorTextures } from '../art/mentorArt';
import { makeNpcTextures } from '../art/npcArt';
import { makeEdgeTextures, makeTileTextures } from '../art/tileArt';
import { makeQuilomboArt } from '../art/themes/quilombo';
import { makeCanindeArt } from '../art/themes/caninde';
import { makeSaoPauloArt } from '../art/themes/saopaulo';

type Painter = (g: Phaser.GameObjects.Graphics) => void;

// Gera todas as texturas em código. Assets reais podem substituir as mesmas chaves depois.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const draw = this.draw.bind(this);
    this.makePlayerTextures();
    LEVELS.forEach((level) => makeTileTextures(draw, level.id, level.palette, level.theme));
    makeEdgeTextures(draw);
    makeQuilomboArt(draw);
    makeSaoPauloArt(draw);
    const canindeLevel = LEVELS.find((l) => l.theme === 'caninde');
    if (canindeLevel) makeCanindeArt(draw, canindeLevel);
    makeHudTextures(draw);
    makeMentorTextures(draw);
    this.makePortalTextures();
    makeCollectibleTextures(draw);
    makeEnemyTextures(draw);
    this.makeEnemyAnimations();
    makeNpcTextures(draw);
    this.makeCheckpointTextures();

    this.scene.launch('AudioUi');
    this.scene.start('Menu');
  }

  private draw(key: string, w: number, h: number, paint: Painter): void {
    const g = this.add.graphics();
    paint(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makePlayerTextures(): void {
    const { w, h } = PLAYER.sprite;
    for (const [name, pose] of Object.entries(PLAYER_POSES)) {
      const grid = buildPoseGrid(pose);
      this.draw(playerTextureKey(name), w, h, (g) => paintGrid(g, grid, PLAYER_COLOR_MAP));
    }
    this.anims.create({
      key: 'player-run',
      frames: PLAYER_RUN_KEYS.map((key) => ({ key })),
      frameRate: PLAYER.runFrameRate,
      repeat: -1,
    });
  }

  private makePortalTextures(): void {
    const paintArch = (g: Phaser.GameObjects.Graphics, stone: number, inner: number, core: number): void => {
      // arco de pedra em blocos
      g.fillStyle(darken(stone, 35)).fillCircle(24, 24, 24).fillRect(0, 24, 48, 40);
      g.fillStyle(stone).fillCircle(24, 24, 22).fillRect(2, 24, 44, 40);
      g.fillStyle(darken(stone, 20));
      for (const y of [30, 42, 54]) g.fillRect(2, y, 9, 1).fillRect(37, y, 9, 1);
      g.fillRect(6, 36, 1, 6).fillRect(41, 48, 1, 6).fillRect(13, 6, 1, 6).fillRect(34, 6, 1, 6);
      // abertura com brilho em anéis
      g.fillStyle(darken(inner, 30)).fillCircle(24, 26, 14).fillRect(10, 26, 28, 38);
      g.fillStyle(inner).fillCircle(24, 27, 12).fillRect(12, 27, 24, 37);
      g.fillStyle(core).fillCircle(24, 32, 7).fillRect(17, 32, 14, 32);
      // padrão geométrico de tecido africano nos pilares
      const pattern = [PALETTE.red, PALETTE.gold, PALETTE.green];
      for (let i = 0; i < 6; i++) {
        g.fillStyle(pattern[i % 3]).fillRect(3, 30 + i * 5, 5, 3).fillRect(40, 30 + i * 5, 5, 3);
      }
      g.fillStyle(PALETTE.gold).fillTriangle(20, 4, 28, 4, 24, 10);
    };
    this.draw('portal-locked', 48, 64, (g) => paintArch(g, 0x6b6b6b, 0x2a2a2a, 0x3a3a3a));
    this.draw('portal-open', 48, 64, (g) => paintArch(g, 0x9a8a78, 0xffc94a, 0xfff4d0));
  }

  /** Cada inimigo balança entre dois quadros enquanto anda */
  private makeEnemyAnimations(): void {
    for (const kind of ['desinformacao', 'esquecimento'] as EnemyArtKind[]) {
      this.anims.create({
        key: `enemy-${kind}-walk`,
        frames: Array.from({ length: ENEMY_FRAMES }, (_, i) => ({ key: enemyTextureKey(kind, i) })),
        frameRate: ENEMY.animFps[kind],
        repeat: -1,
      });
    }
  }

  private makeCheckpointTextures(): void {
    const paintFlag = (g: Phaser.GameObjects.Graphics, flag: number, stripe: number): void => {
      g.fillStyle(0x5a3a1e).fillRect(2, 0, 4, 64);
      g.fillStyle(flag).fillTriangle(6, 4, 30, 12, 6, 20);
      g.fillStyle(stripe).fillRect(6, 11, 14, 3);
    };
    this.draw('checkpoint-off', 32, 64, (g) => paintFlag(g, 0x8a8a8a, 0x6e6e6e));
    this.draw('checkpoint-on', 32, 64, (g) => paintFlag(g, PALETTE.green, PALETTE.gold));
  }
}
