import Phaser from 'phaser';
import { CAPOEIRA, GAME, PLAYER, WORLD } from '../config/physics';

export type PlayerState = 'idle' | 'run' | 'jump' | 'au' | 'meiaLua' | 'esquiva' | 'role' | 'hurt';

type Key = Phaser.Input.Keyboard.Key;

interface PlayerKeys {
  left: Key[];
  right: Key[];
  jump: Key[];
  down: Key[];
  attack: Key[];
  roll: Key[];
}

// Estados que só terminam por conta própria (timer/animação), sem a entrada do jogador
const LOCKED_STATES: ReadonlySet<PlayerState> = new Set<PlayerState>(['meiaLua', 'role', 'hurt']);

const anyDown = (keys: Key[]): boolean => keys.some((k) => k.isDown);
// map (e não some) para consumir o JustDown de todas as teclas do mesmo comando
const anyJustDown = (keys: Key[]): boolean => keys.map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean);
const anyJustUp = (keys: Key[]): boolean => keys.map((k) => Phaser.Input.Keyboard.JustUp(k)).some(Boolean);

/**
 * A Zone carrega só o corpo Arcade (hitbox exata). O visual é um sprite separado,
 * porque no Arcade o corpo acompanha o scale do sprite e os tweens mudariam a hitbox.
 */
export class Player extends Phaser.GameObjects.Zone {
  readonly visual: Phaser.GameObjects.Sprite;
  private readonly keys: PlayerKeys;
  private current: PlayerState = 'idle';
  private facing: 1 | -1 = 1;
  private lastGroundedAt = Number.NEGATIVE_INFINITY;
  private jumpBufferedAt = Number.NEGATIVE_INFINITY;
  private auAvailable = true;
  private stateTween: Phaser.Tweens.Tween | null = null;
  private squashTween: Phaser.Tweens.Tween | null = null;
  private auSpinning = false;
  private blinkElapsed = 0;
  private controlsEnabled = true;
  private invincibleUntil = Number.NEGATIVE_INFINITY;

  /** x, y = posição dos pés */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y - PLAYER.hitbox.h / 2, PLAYER.hitbox.w, PLAYER.hitbox.h);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.arcadeBody;
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(PLAYER.maxSpeedX, WORLD.maxFallSpeed);

    // origem nos pés: a ginga balança o corpo sobre os pés plantados
    this.visual = scene.add.sprite(x, y, 'player-idle').setOrigin(0.5, 1).setDepth(10);
    this.keys = this.createKeys();
    this.enterState('idle');
    this.syncVisual();
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get playerState(): PlayerState {
    return this.current;
  }

  setControlsEnabled(enabled: boolean): void {
    this.controlsEnabled = enabled;
  }

  get isInvincible(): boolean {
    return this.scene.time.now < this.invincibleUntil;
  }

  /** Invencível (e piscando) pelos próximos `ms` */
  setInvincible(ms: number): void {
    this.invincibleUntil = this.scene.time.now + ms;
  }

  /** Reposiciona com os pés em (x, y) e zera o movimento */
  respawn(x: number, y: number): void {
    this.arcadeBody.reset(x, y - PLAYER.hitbox.h / 2);
    this.lastGroundedAt = Number.NEGATIVE_INFINITY;
    this.jumpBufferedAt = Number.NEGATIVE_INFINITY;
    this.auAvailable = true;
    this.arcadeBody.setVelocity(0, 0);
    this.setState('idle');
    this.syncVisual();
  }

  update(time: number, delta: number): void {
    const body = this.arcadeBody;
    let onGround = body.blocked.down || body.touching.down;
    if (onGround) {
      this.lastGroundedAt = time;
      this.auAvailable = true;
    }

    const dir = this.controlsEnabled ? this.inputDir() : 0;

    if (!LOCKED_STATES.has(this.current)) {
      if (dir !== 0) this.facing = dir;
      this.applyHorizontal(dir, delta / 1000);
      if (this.controlsEnabled && this.handleJump(time, onGround)) onGround = false;
      this.resolveState(onGround, dir);
    }

    this.updateVisual(time, delta);
  }

  /** Única porta de entrada para trocar de estado */
  setState(next: PlayerState): this {
    if (next === this.current) return this;
    if (this.current === 'hurt' && next !== 'idle') return this;
    this.exitState();
    this.current = next;
    this.enterState(next);
    return this;
  }

  destroy(fromScene?: boolean): void {
    this.stateTween?.stop();
    this.squashTween?.stop();
    this.visual.destroy();
    super.destroy(fromScene);
  }

  private createKeys(): PlayerKeys {
    const kb = this.scene.input.keyboard;
    if (!kb) throw new Error('Teclado indisponível');
    const K = Phaser.Input.Keyboard.KeyCodes;
    const add = (...codes: number[]): Key[] => codes.map((code) => kb.addKey(code));
    return {
      left: add(K.LEFT, K.A),
      right: add(K.RIGHT, K.D),
      jump: add(K.SPACE, K.UP, K.W),
      down: add(K.DOWN, K.S),
      attack: add(K.J, K.X),
      roll: add(K.K, K.SHIFT),
    };
  }

  private inputDir(): -1 | 0 | 1 {
    const left = anyDown(this.keys.left);
    const right = anyDown(this.keys.right);
    if (left === right) return 0;
    return left ? -1 : 1;
  }

  private applyHorizontal(dir: -1 | 0 | 1, dt: number): void {
    const body = this.arcadeBody;
    const vx = body.velocity.x;
    const target = dir * PLAYER.runSpeed;
    // desacelera ao soltar ou ao inverter a direção, acelera no resto
    const rate = dir === 0 || vx * dir < 0 ? PLAYER.deceleration : PLAYER.acceleration;
    const diff = target - vx;
    const step = rate * dt;
    body.setVelocityX(Math.abs(diff) <= step ? target : vx + Math.sign(diff) * step);
  }

  /** Retorna true se saiu do chão neste frame */
  private handleJump(time: number, onGround: boolean): boolean {
    const body = this.arcadeBody;
    const pressed = anyJustDown(this.keys.jump);
    if (pressed) this.jumpBufferedAt = time;

    const canGroundJump = onGround || time - this.lastGroundedAt <= PLAYER.coyoteMs;
    const buffered = time - this.jumpBufferedAt <= PLAYER.jumpBufferMs;
    let leftGround = false;

    if (buffered && canGroundJump) {
      body.setVelocityY(PLAYER.jumpVelocity);
      this.jumpBufferedAt = Number.NEGATIVE_INFINITY;
      this.lastGroundedAt = Number.NEGATIVE_INFINITY; // gasta o coyote
      this.setState('jump');
      this.squash(PLAYER.jumpStretchY);
      leftGround = true;
    } else if (pressed && !onGround && this.auAvailable) {
      body.setVelocityY(PLAYER.auVelocity);
      this.auAvailable = false;
      this.jumpBufferedAt = Number.NEGATIVE_INFINITY;
      this.setState('au');
    }

    // pulo variável: soltar cedo corta a subida
    if (anyJustUp(this.keys.jump) && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER.jumpCutFactor);
    }
    return leftGround;
  }

  private resolveState(onGround: boolean, dir: -1 | 0 | 1): void {
    if (onGround) {
      const landing = this.current === 'jump' || this.current === 'au';
      const moving = dir !== 0 || Math.abs(this.arcadeBody.velocity.x) > PLAYER.runAnimMinSpeed;
      this.setState(moving ? 'run' : 'idle');
      if (landing) this.squash(PLAYER.landSquashY);
    } else if (this.current !== 'au') {
      this.setState('jump');
    }
  }

  /** Achata ou estica o visual na vertical e volta ao normal (squash & stretch) */
  private squash(scaleY: number): void {
    this.squashTween?.stop();
    this.visual.setScale(this.visual.scaleX, scaleY);
    this.squashTween = this.scene.tweens.add({
      targets: this.visual,
      scaleY: 1,
      duration: PLAYER.squashMs,
      ease: 'Quad.easeOut',
    });
  }

  private exitState(): void {
    this.stateTween?.stop();
    this.stateTween = null;
    this.auSpinning = false;
    this.visual.setAngle(0).setScale(1).setOrigin(0.5, 1);
  }

  private enterState(state: PlayerState): void {
    switch (state) {
      case 'idle':
        this.startBreathing();
        break;
      case 'au': {
        // gira no sentido do movimento: horário para a direita
        const vx = this.arcadeBody.velocity.x;
        const spin = Math.abs(vx) > PLAYER.runAnimMinSpeed ? Math.sign(vx) : this.facing;
        // gira em torno do centro do corpo, na pose de estrela
        this.auSpinning = true;
        this.visual.setOrigin(0.5, 0.5);
        this.stateTween = this.scene.tweens.add({
          targets: this.visual,
          angle: 360 * spin,
          duration: PLAYER.auSpinMs,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.auSpinning = false;
            this.visual.setAngle(0).setOrigin(0.5, 1);
          },
        });
        break;
      }
      // meiaLua, esquiva, role e hurt entram no Marco 2
      default:
        break;
    }
  }

  private startBreathing(): void {
    const g = CAPOEIRA.ginga;
    this.stateTween = this.scene.tweens.add({
      targets: this.visual,
      scaleY: g.breathScaleY,
      duration: g.breathCycleMs / 2,
      // espera o squash da aterrissagem terminar para não disputar o scaleY
      delay: PLAYER.squashMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private updateVisual(time: number, delta: number): void {
    this.blinkElapsed = (this.blinkElapsed + delta) % PLAYER.blinkEveryMs;
    const blinking = this.blinkElapsed < PLAYER.blinkMs;

    const v = this.visual;
    // pisca enquanto invencível
    const ghost = time < this.invincibleUntil && Math.floor(time / GAME.invincibleBlinkMs) % 2 === 0;
    v.setAlpha(ghost ? GAME.invincibleAlpha : 1);
    if (this.current === 'run') {
      v.play('player-run', true);
      // passada acompanha a velocidade: acelerando, as pernas também aceleram
      const speed = Math.abs(this.arcadeBody.velocity.x) / PLAYER.runSpeed;
      v.anims.timeScale = Phaser.Math.Clamp(speed, 0.5, 1.2);
    } else {
      if (v.anims.isPlaying) v.anims.stop();
      const texture = this.staticTexture(blinking);
      if (v.texture.key !== texture) v.setTexture(texture);
    }
    v.setFlipX(this.facing < 0);
    this.syncVisual();
  }

  private staticTexture(blinking: boolean): string {
    const rising = this.arcadeBody.velocity.y < 0;
    switch (this.current) {
      case 'au':
        if (this.auSpinning) return 'player-au';
        return rising ? 'player-jumpUp' : 'player-fall';
      case 'jump':
        return rising ? 'player-jumpUp' : 'player-fall';
      default:
        return blinking ? 'player-idleBlink' : 'player-idle';
    }
  }

  /** Mantém os pés do sprite alinhados com a base da hitbox */
  private syncVisual(): void {
    const body = this.arcadeBody;
    const v = this.visual;
    v.setPosition(body.center.x, body.bottom - PLAYER.sprite.h * (1 - v.originY));
  }
}
