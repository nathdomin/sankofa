import Phaser from 'phaser';
import { CAMERA, CAPOEIRA, COLLECTIBLE, ENEMY, FEEL, GAME, TILE_SIZE, WORLD } from '../config/physics';
import { PALETTE, lighten, toCss } from '../config/palette';
import { LEVELS, type LevelConfig } from '../data/levels';
import { Checkpoint } from '../entities/Checkpoint';
import { Collectible } from '../entities/Collectible';
import { Enemy } from '../entities/Enemy';
import { Npc } from '../entities/Npc';
import { audio } from '../systems/audio/AudioManager';
import { DIARY_TEXTS, PORTAL_TEXTS } from '../data/texts';
import { Player } from '../entities/Player';
import { gameState } from '../systems/GameState';
import { buildLevel, type BuiltLevel, type SpawnPoint } from '../systems/LevelBuilder';
import { addParallax, decorateLevel, type ParallaxUpdater } from '../systems/Scenery';
import { onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';
import type { CardSceneData } from './CardScene';
import type { GameOverSceneData } from './GameOverScene';
import type { HudSceneData } from './HudScene';

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
  private npcs: Npc[] = [];
  private notice!: Phaser.GameObjects.Text;
  private noticeTween: Phaser.Tweens.Tween | null = null;
  private portal!: Phaser.Physics.Arcade.Image;
  private portalOpen = false;
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
    this.portalOpen = false;
    this.noticeTween = null;
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
    this.player = new Player(this, this.respawnPoint.x, this.respawnPoint.y, this.level.isSolidAt);
    this.player.setDustColor(lighten(this.config.palette.ground, 40));
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

    this.level.collectibles.forEach((point) => {
      // o spawn é a base do tile; o item fica no centro dele
      const item = new Collectible(this, point.x, point.y - TILE_SIZE / 2, this.config.collectible.texture);
      this.physics.add.overlap(this.player, item, () => this.collect(item));
    });

    this.npcs = this.level.npcs.map((point, i) => new Npc(this, point.x, point.y, i));

    const { goal } = this.level;
    this.portal = this.physics.add.staticImage(goal.x, goal.y, this.portalTexture(false)).setOrigin(0.5, 1).refreshBody();
    this.physics.add.overlap(this.player, this.portal, () => this.touchPortal());
    this.setPortalOpen(gameState.collected >= this.config.required, false);

    cam.setBounds(0, 0, widthPx, heightPx);
    cam.startFollow(this.player, true, CAMERA.lerpX, CAMERA.lerpY);
    cam.setDeadzone(CAMERA.deadzoneW, CAMERA.deadzoneH);
    cam.fadeIn(CAMERA.fadeMs);
    audio.playMusic(this.config.music);

    // avisos no alto da tela, logo abaixo do HUD
    this.notice = this.add
      .text(cam.width / 2, 90, '', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: toCss(PALETTE.gold),
        stroke: toCss(PALETTE.black),
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0);

    // Esc ou P pausa: a PauseScene fica por cima e esta cena para
    onKeys(this, ['ESC', 'P'], () => this.pauseGame());

    // o HUD roda em paralelo, por cima desta cena
    this.scene.launch('Hud', { levelIndex: this.levelIndex } satisfies HudSceneData);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('Hud'));
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.updateLookahead(delta);
    this.parallax(this.cameras.main, delta);

    if (!this.dying && this.player.arcadeBody.top > this.level.heightPx + WORLD.fallMargin) {
      this.die(gameState.loseLife());
    }
  }

  /** A câmera olha um pouco à frente de onde o jogador corre e, ao cair rápido, para baixo */
  private updateLookahead(delta: number): void {
    const body = this.player.arcadeBody;
    const running = Math.abs(body.velocity.x) > 40;
    const targetX = running ? -this.player.facingDir * CAMERA.lookaheadX : 0;
    const targetY = body.velocity.y > CAMERA.lookDownSpeed ? -CAMERA.lookDownY : 0;
    const k = 1 - Math.exp(-(delta / 1000) * CAMERA.lookaheadSmooth);
    const cam = this.cameras.main;
    cam.setFollowOffset(Phaser.Math.Linear(cam.followOffset.x, targetX, k), Phaser.Math.Linear(cam.followOffset.y, targetY, k));
  }

  /** Dano: tremor da câmera e clarão vermelho nas bordas */
  private hurtFeedback(): void {
    const cam = this.cameras.main;
    cam.shake(FEEL.hurtShake.ms, FEEL.hurtShake.intensity);
    const flash = this.add.rectangle(0, 0, cam.width, cam.height, PALETTE.red, FEEL.hurtFlash.alpha).setOrigin(0).setScrollFactor(0).setDepth(90);
    this.tweens.add({ targets: flash, alpha: 0, duration: FEEL.hurtFlash.ms, onComplete: () => flash.destroy() });
  }

  private pauseGame(): void {
    if (this.dying || this.finished) return;
    audio.setDuck(true);
    this.scene.launch('Pause');
    this.scene.pause();
  }

  /** Mostra um aviso no alto da tela e some depois de um tempo */
  private showNotice(text: string, ms: number = GAME.noticeMs): void {
    this.notice.setText(text).setAlpha(1);
    this.noticeTween?.stop();
    this.noticeTween = this.tweens.add({
      targets: this.notice,
      alpha: 0,
      delay: ms,
      duration: 300,
    });
  }

  private collect(item: Collectible): void {
    if (this.dying || this.finished || !item.collect()) return;
    gameState.addScore(COLLECTIBLE.score);
    gameState.addCollected();
    audio.collect(this.config.collectible.texture);
    this.freeNearestNpc();
    if (!this.portalOpen && gameState.collected >= this.config.required) this.setPortalOpen(true, true);
  }

  /** Cada coletável liberta a pessoa ainda presa que estiver mais perto do jogador */
  private freeNearestNpc(): void {
    const { x, y } = this.player;
    const free = this.npcs.filter((npc) => !npc.isFree);
    if (free.length === 0) return;
    const dist = (npc: Npc): number => Phaser.Math.Distance.Between(x, y, npc.x, npc.y);
    free.reduce((best, npc) => (dist(npc) < dist(best) ? npc : best)).free();
  }

  /** Portal do tema da fase (ex.: porta da faculdade); sem arte própria, usa o arco padrão */
  private portalTexture(open: boolean): string {
    const state = open ? 'open' : 'locked';
    const themed = `portal-${this.config.theme}-${state}`;
    return this.textures.exists(themed) ? themed : `portal-${state}`;
  }

  /** Portal apagado enquanto faltarem coletáveis obrigatórios */
  private setPortalOpen(open: boolean, announce: boolean): void {
    this.portalOpen = open;
    this.portal.setTexture(this.portalTexture(open));
    if (!announce) return;
    audio.play('portal');
    // na fase do diário, o aviso é o de diário completo, que precisa de mais tempo para ler
    if (this.config.diary) this.showNotice(DIARY_TEXTS.complete, GAME.noticeMs * 2);
    else this.showNotice(PORTAL_TEXTS.opened);
    this.tweens.add({ targets: this.portal, scale: { from: 1.15, to: 1 }, duration: 300, ease: 'Back.easeOut' });
  }

  private touchPortal(): void {
    if (this.portalOpen) {
      this.reachGoal();
      return;
    }
    const remaining = this.config.required - gameState.collected;
    this.showNotice(remaining === 1 ? 'Colete 1 restante' : `Colete ${remaining} restantes`);
  }

  /** Pisão de cima derrota (se o inimigo permitir); qualquer outro toque custa uma vida */
  private touchEnemy(enemy: Enemy): void {
    if (this.dying || this.finished || enemy.isDefeated) return;
    const body = this.player.arcadeBody;
    const stomp =
      enemy.canBeStomped && body.velocity.y > 0 && body.bottom <= enemy.arcadeBody.top + ENEMY.stompTolerance;

    if (stomp) {
      enemy.defeat();
      audio.play('stomp');
      this.cameras.main.shake(FEEL.stompShake.ms, FEEL.stompShake.intensity);
      this.hitStop(FEEL.stompHitStopMs);
      this.player.bounce(ENEMY.stompBounce);
      gameState.addScore(ENEMY.stompScore);
    } else if (!this.player.isInvincible) {
      // empurrão no dano; só volta ao checkpoint se foi a última vida
      if (gameState.loseLife()) this.player.hurt(enemy.x);
      else this.die(false);
      this.hurtFeedback();
    }
  }

  /** Meia-lua acertou: derrota qualquer inimigo, com hit-stop e tremor de câmera */
  private slashEnemy(enemy: Enemy): void {
    if (this.dying || this.finished || enemy.isDefeated) return;
    const m = CAPOEIRA.meiaLua;
    enemy.defeat();
    audio.play('hit');
    gameState.addScore(m.score);
    this.cameras.main.shake(m.shakeMs, m.shakeIntensity);

    this.hitStop(m.hitStopMs);
  }

  /** Congela a física por um instante, para o golpe "pesar" */
  private hitStop(ms: number): void {
    if (this.physics.world.isPaused) return;
    this.physics.world.pause();
    this.time.delayedCall(ms, () => this.physics.world.resume());
  }

  /** Faíscas douradas saindo do topo da bandeira ao ativar o checkpoint */
  private checkpointSparks(flag: Checkpoint): void {
    const sparks = this.add
      .particles(flag.x + 10, flag.y - flag.height + 12, 'spark', {
        lifespan: 600,
        speed: { min: 40, max: 120 },
        angle: { min: 200, max: 340 },
        gravityY: 120,
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [0xf2b705, 0x1e7a3c, 0xffe58a],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(9);
    sparks.explode(FEEL.checkpointSparks);
    this.time.delayedCall(700, () => sparks.destroy());
  }

  private reachCheckpoint(flag: Checkpoint, point: SpawnPoint): void {
    if (!flag.activate()) return;
    audio.play('checkpoint');
    this.checkpointSparks(flag);
    this.respawnPoint = point;
  }

  /** Fade e volta ao último checkpoint (buraco); sem vidas, recomeça a partida */
  private die(alive: boolean): void {
    if (this.dying || this.finished) return;
    this.dying = true;
    if (alive) audio.play('lose');
    this.player.setControlsEnabled(false);

    const cam = this.cameras.main;
    cam.fadeOut(GAME.deathFadeMs);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (!alive) {
        this.scene.start('GameOver', { levelIndex: this.levelIndex } satisfies GameOverSceneData);
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
    audio.stopMusic(0.4);
    audio.play('levelComplete');

    this.showLevelComplete();

    // depois da faixa, vai para a carta histórica da fase
    this.time.delayedCall(GAME.levelCompleteMs, () => goToScene(this, 'Card', { levelIndex: this.levelIndex } satisfies CardSceneData));
  }

  /** Faixa "FASE CONCLUÍDA!" entrando pelo lado, com chuva de faíscas douradas saindo do portal */
  private showLevelComplete(): void {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2 - 20;
    const depth = 100;

    // faísca dourada subindo do portal
    this.add
      .particles(this.portal.x, this.portal.y - 32, 'mote', {
        lifespan: { min: 900, max: 1800 },
        speed: { min: 60, max: 260 },
        angle: { min: 200, max: 340 },
        gravityY: 220,
        scale: { start: 2, end: 0.5 },
        alpha: { start: 1, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(depth - 1)
      .explode(60);

    const band = this.add.rectangle(cx, cy, cam.width, 132, PALETTE.black, 0.78).setScrollFactor(0).setDepth(depth);
    const edgeTop = this.add.tileSprite(cx, cy - 66 + 8, cam.width, 16, 'hud-band').setScrollFactor(0).setDepth(depth);
    const edgeBottom = this.add.tileSprite(cx, cy + 66 - 8, cam.width, 16, 'hud-band').setScrollFactor(0).setDepth(depth);
    const title = this.add
      .text(cx, cy - 8, PORTAL_TEXTS.levelComplete, { fontFamily: 'monospace', fontSize: '56px', fontStyle: 'bold', color: toCss(PALETTE.gold), stroke: toCss(PALETTE.black), strokeThickness: 8 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);
    const subtitle = this.add
      .text(cx, cy + 36, `${this.config.title} · ${this.config.era}`, { fontFamily: 'monospace', fontSize: '20px', color: toCss(PALETTE.cream) })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);

    // a faixa abre na vertical e o título cresce com um quique
    band.setScale(1, 0.05);
    for (const e of [edgeTop, edgeBottom, title, subtitle]) e.setAlpha(0);
    this.tweens.add({ targets: band, scaleY: 1, duration: 260, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: [edgeTop, edgeBottom, subtitle], alpha: 1, delay: 220, duration: 260 });
    title.setScale(0.4);
    this.tweens.add({ targets: title, alpha: 1, scale: 1, delay: 180, duration: 420, ease: 'Back.easeOut' });
    cam.flash(260, 255, 240, 200);
  }
}
