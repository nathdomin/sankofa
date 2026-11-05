import Phaser from 'phaser';
import { PLAYER } from '../config/physics';
import { PALETTE, darken } from '../config/palette';
import { LEVELS } from '../data/levels';
import { paintGrid } from '../art/pixel';
import { PLAYER_COLOR_MAP, PLAYER_POSES, PLAYER_RUN_KEYS, buildPoseGrid, playerTextureKey } from '../art/playerArt';
import { makeHudTextures } from '../art/hudArt';
import { makeMentorTextures } from '../art/mentorArt';
import { makeEdgeTextures, makeTileTextures } from '../art/tileArt';
import { makeQuilomboArt } from '../art/themes/quilombo';
import { makeCanindeArt } from '../art/themes/caninde';
import { makeSaoPauloArt } from '../art/themes/saopaulo';

type Painter = (g: Phaser.GameObjects.Graphics) => void;

// Gera todas as texturas placeholder. Assets reais podem substituir as mesmas chaves depois.
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
    this.makeCollectibleTextures();
    this.makeEnemyTextures();
    this.makeNpcTextures();
    this.makeCheckpointTextures();

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

  private makeCollectibleTextures(): void {
    // Sankofa: coração estilizado (aproximação do símbolo Adinkra)
    this.draw('sankofa', 20, 20, (g) => {
      g.fillStyle(darken(PALETTE.gold, 25)).fillCircle(6, 7, 6).fillCircle(14, 7, 6).fillTriangle(0, 9, 20, 9, 10, 20);
      g.fillStyle(PALETTE.gold).fillCircle(6, 7, 4).fillCircle(14, 7, 4).fillTriangle(3, 9, 17, 9, 10, 17);
      g.fillStyle(darken(PALETTE.gold, 25)).fillRect(9, 5, 2, 6);
    });

    this.draw('alforria', 18, 22, (g) => {
      g.fillStyle(0xb89b6a).fillRect(0, 0, 18, 22);
      g.fillStyle(0xe8d5a3).fillRect(1, 1, 16, 20);
      g.fillStyle(0x8a6a3a).fillRect(3, 5, 12, 1).fillRect(3, 9, 12, 1).fillRect(3, 13, 8, 1);
      g.fillStyle(PALETTE.red).fillCircle(13, 17, 3);
    });

    this.draw('papel', 18, 22, (g) => {
      g.fillStyle(PALETTE.white).fillRect(0, 0, 18, 22);
      g.fillStyle(0xb0c4de).fillRect(2, 7, 14, 1).fillRect(2, 11, 14, 1).fillRect(2, 15, 14, 1);
      g.fillStyle(0xc8c8c8).fillTriangle(12, 0, 18, 0, 18, 6);
      g.fillStyle(0x9a9a9a).fillTriangle(12, 0, 12, 6, 18, 6);
    });
  }

  private makeEnemyTextures(): void {
    const eyes = (g: Phaser.GameObjects.Graphics, y: number): void => {
      g.fillStyle(PALETTE.white).fillCircle(9, y, 4).fillCircle(19, y, 4);
      g.fillStyle(PALETTE.black).fillCircle(10, y + 1, 2).fillCircle(20, y + 1, 2);
    };

    this.draw('enemy-desinformacao', 28, 24, (g) => {
      const body = 0x4b3f5c;
      g.fillStyle(body).fillEllipse(14, 15, 28, 18).fillCircle(8, 9, 6).fillCircle(18, 8, 7);
      g.fillStyle(darken(body, 20)).fillRect(3, 21, 22, 3);
      eyes(g, 12);
    });

    this.draw('enemy-esquecimento', 28, 28, (g) => {
      const body = 0x2f2a3a;
      g.fillStyle(body);
      for (let x = 2; x < 26; x += 6) g.fillTriangle(x, 10, x + 6, 10, x + 3, 0);
      g.fillEllipse(14, 18, 28, 18);
      g.fillStyle(darken(body, 25)).fillRect(3, 25, 22, 3);
      eyes(g, 16);
    });
  }

  private makeNpcTextures(): void {
    const paintNpc = (g: Phaser.GameObjects.Graphics, skin: number, shirt: number, pants: number): void => {
      g.fillStyle(skin).fillRect(6, 0, 9, 10);
      g.fillStyle(shirt).fillRect(4, 11, 13, 14);
      g.fillStyle(skin).fillRect(1, 12, 3, 10).fillRect(17, 12, 3, 10);
      g.fillStyle(pants).fillRect(5, 25, 5, 15).fillRect(11, 25, 5, 15);
    };
    this.draw('npc-preso', 21, 40, (g) => paintNpc(g, 0x8a8a8a, 0x6e6e6e, 0x5a5a5a));
    this.draw('npc-livre', 21, 40, (g) => paintNpc(g, 0x5a3820, PALETTE.red, PALETTE.green));
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
