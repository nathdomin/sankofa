import Phaser from 'phaser';
import { CAMERA, WORLD } from '../config/physics';
import { PALETTE, toCss } from '../config/palette';
import { LEVELS, type LevelConfig } from '../data/levels';
import { Player } from '../entities/Player';
import { buildLevel, type BuiltLevel, type SpawnPoint } from '../systems/LevelBuilder';
import { addParallax, decorateLevel, type ParallaxUpdater } from '../systems/Scenery';

export interface GameSceneData {
  levelIndex: number;
}

export class GameScene extends Phaser.Scene {
  private levelIndex = 0;
  private config!: LevelConfig;
  private level!: BuiltLevel;
  private player!: Player;
  private respawnPoint!: SpawnPoint;
  private finished = false;
  private parallax: ParallaxUpdater = () => undefined;

  constructor() {
    super('Game');
  }

  init(data: Partial<GameSceneData>): void {
    this.levelIndex = data.levelIndex ?? 0;
    const config = LEVELS[this.levelIndex];
    if (!config) throw new Error(`Fase inexistente: ${this.levelIndex}`);
    this.config = config;
    this.finished = false;
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setBackgroundColor(this.config.palette.sky);

    this.parallax = addParallax(this, this.config);
    this.level = buildLevel(this, this.config);
    decorateLevel(this, this.config);
    const { widthPx, heightPx } = this.level;

    // sem chão no limite inferior: cair no buraco sai do mundo
    this.physics.world.setBounds(0, 0, widthPx, heightPx + WORLD.fallMargin * 4);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.respawnPoint = this.level.playerSpawn;
    this.player = new Player(this, this.respawnPoint.x, this.respawnPoint.y);
    this.physics.add.collider(this.player, this.level.solids);

    const { goal } = this.level;
    const portal = this.physics.add.staticImage(goal.x, goal.y, 'portal-open').setOrigin(0.5, 1).refreshBody();
    this.physics.add.overlap(this.player, portal, () => this.reachGoal());

    cam.setBounds(0, 0, widthPx, heightPx);
    cam.startFollow(this.player, true, CAMERA.lerpX, CAMERA.lerpY);
    cam.setDeadzone(CAMERA.deadzoneW, CAMERA.deadzoneH);
    cam.fadeIn(CAMERA.fadeMs);

    // título provisório até a HudScene (Marco 2)
    this.add
      .text(16, 12, `${this.config.title} · ${this.config.era}`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: toCss(PALETTE.cream),
        stroke: toCss(PALETTE.black),
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.parallax(this.cameras.main, delta);

    if (this.player.arcadeBody.top > this.level.heightPx + WORLD.fallMargin) {
      this.player.respawn(this.respawnPoint.x, this.respawnPoint.y);
    }
  }

  private reachGoal(): void {
    if (this.finished) return;
    this.finished = true;
    this.player.setControlsEnabled(false);

    const cam = this.cameras.main;
    this.add
      .text(cam.width / 2, cam.height / 2, 'Fase concluída!', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: toCss(PALETTE.gold),
        stroke: toCss(PALETTE.black),
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);

    // por enquanto reinicia a fase; o fluxo Card → próxima fase entra no Marco 2
    this.time.delayedCall(1500, () => {
      cam.fadeOut(CAMERA.fadeMs);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.restart({ levelIndex: this.levelIndex } satisfies GameSceneData);
      });
    });
  }
}
