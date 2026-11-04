import Phaser from 'phaser';
import { CAMERA, CAPOEIRA, ENEMY, GAME, WORLD } from '../config/physics';
import { PALETTE, toCss } from '../config/palette';
import { LEVELS, type LevelConfig } from '../data/levels';
import { Checkpoint } from '../entities/Checkpoint';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { GAME_EVENTS, gameState } from '../systems/GameState';
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
  private dying = false;
  private enemies!: Phaser.GameObjects.Group;
  private livesText!: Phaser.GameObjects.Text;
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
    this.dying = false;
    gameState.startLevel(this.levelIndex);
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
    // garante que um hit-stop interrompido por restart não deixe a física pausada
    this.physics.world.resume();

    this.respawnPoint = this.level.playerSpawn;
    this.player = new Player(this, this.respawnPoint.x, this.respawnPoint.y);
    this.physics.add.collider(this.player, this.level.solids);

    this.level.checkpoints.forEach((point) => {
      const flag = new Checkpoint(this, point.x, point.y);
      this.physics.add.overlap(this.player, flag, () => this.reachCheckpoint(flag, point));
    });

    this.enemies = this.add.group({ runChildUpdate: true });
    this.level.enemies.forEach((spawn) => {
      this.enemies.add(new Enemy(this, spawn.x, spawn.y, spawn.kind, this.level.isSolidAt));
    });
    this.physics.add.collider(this.enemies, this.level.solids);
    // o golpe vem antes do toque: se os dois acontecem no mesmo frame, o inimigo cai antes de causar dano
    this.physics.add.overlap(this.player.attackZone, this.enemies, (_zone, enemy) => {
      if (enemy instanceof Enemy) this.slashEnemy(enemy);
    });
    this.physics.add.overlap(this.player, this.enemies, (_player, enemy) => {
      if (enemy instanceof Enemy) this.touchEnemy(enemy);
    });

    const { goal } = this.level;
    const portal = this.physics.add.staticImage(goal.x, goal.y, 'portal-open').setOrigin(0.5, 1).refreshBody();
    this.physics.add.overlap(this.player, portal, () => this.reachGoal());

    cam.setBounds(0, 0, widthPx, heightPx);
    cam.startFollow(this.player, true, CAMERA.lerpX, CAMERA.lerpY);
    cam.setDeadzone(CAMERA.deadzoneW, CAMERA.deadzoneH);
    cam.fadeIn(CAMERA.fadeMs);

    // textos provisórios até a HudScene
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: toCss(PALETTE.cream),
      stroke: toCss(PALETTE.black),
      strokeThickness: 4,
    };
    this.add.text(16, 12, `${this.config.title} · ${this.config.era}`, style).setScrollFactor(0).setDepth(100);
    this.livesText = this.add.text(16, 38, '', style).setScrollFactor(0).setDepth(100);
    this.updateLivesText(gameState.lives);
    gameState.on(GAME_EVENTS.lives, this.updateLivesText, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => gameState.off(GAME_EVENTS.lives, this.updateLivesText, this));
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.parallax(this.cameras.main, delta);

    if (!this.dying && this.player.arcadeBody.top > this.level.heightPx + WORLD.fallMargin) {
      this.die(gameState.loseLife());
    }
  }

  private updateLivesText(lives: number): void {
    this.livesText.setText(`Vidas: ${lives}`);
  }

  /** Pisão de cima derrota (se o inimigo permitir); qualquer outro toque custa uma vida */
  private touchEnemy(enemy: Enemy): void {
    if (this.dying || this.finished || enemy.isDefeated) return;
    const body = this.player.arcadeBody;
    const stomp =
      enemy.canBeStomped && body.velocity.y > 0 && body.bottom <= enemy.arcadeBody.top + ENEMY.stompTolerance;

    if (stomp) {
      enemy.defeat();
      this.player.bounce(ENEMY.stompBounce);
      gameState.addScore(ENEMY.stompScore);
    } else if (!this.player.isInvincible) {
      // empurrão no dano; só volta ao checkpoint se foi a última vida
      if (gameState.loseLife()) this.player.hurt(enemy.x);
      else this.die(false);
    }
  }

  /** Meia-lua acertou: derrota qualquer inimigo, com hit-stop e tremor de câmera */
  private slashEnemy(enemy: Enemy): void {
    if (this.dying || this.finished || enemy.isDefeated) return;
    const m = CAPOEIRA.meiaLua;
    enemy.defeat();
    gameState.addScore(m.score);
    this.cameras.main.shake(m.shakeMs, m.shakeIntensity);

    if (this.physics.world.isPaused) return;
    this.physics.world.pause();
    this.time.delayedCall(m.hitStopMs, () => this.physics.world.resume());
  }

  private reachCheckpoint(flag: Checkpoint, point: SpawnPoint): void {
    if (!flag.activate()) return;
    this.respawnPoint = point;
  }

  /** Fade e volta ao último checkpoint (buraco); sem vidas, recomeça a partida */
  private die(alive: boolean): void {
    if (this.dying || this.finished) return;
    this.dying = true;
    this.player.setControlsEnabled(false);

    const cam = this.cameras.main;
    cam.fadeOut(GAME.deathFadeMs);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (!alive) {
        // provisório: a GameOverScene entra mais adiante no Marco 2
        gameState.reset();
        this.scene.restart({ levelIndex: this.levelIndex } satisfies GameSceneData);
        return;
      }
      this.player.respawn(this.respawnPoint.x, this.respawnPoint.y);
      this.player.setInvincible(GAME.invincibleMs);
      this.player.setControlsEnabled(true);
      cam.centerOn(this.player.arcadeBody.center.x, this.player.arcadeBody.center.y);
      cam.fadeIn(GAME.deathFadeMs);
      this.dying = false;
    });
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
