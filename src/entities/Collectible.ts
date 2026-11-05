import Phaser from 'phaser';
import { COLLECTIBLE } from '../config/physics';
import { PALETTE, toCss } from '../config/palette';

// cor do brilho de cada coletável (halo, anel e faíscas)
const GLOW_TINT: Readonly<Record<string, number>> = {
  sankofa: 0xffd36a,
  alforria: 0xffe3a6,
  papel: 0xcfe4ff,
};
const DEFAULT_TINT = 0xffd36a;

/** Coletável da fase (Sankofa, carta de alforria, folha de papel). x, y = centro do tile */
export class Collectible extends Phaser.GameObjects.Image {
  private taken = false;
  private readonly glowColor: number;
  private readonly halo: Phaser.GameObjects.Image;
  private readonly glint: Phaser.GameObjects.Image;
  private glintTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.glowColor = GLOW_TINT[texture] ?? DEFAULT_TINT;
    this.setDepth(5);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // halo atrás do item (pulsa) e cintilho por cima (aparece de vez em quando)
    this.halo = scene.add.image(x, y, 'collect-glow').setTint(this.glowColor).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    this.glint = scene.add.image(x + 5, y - 6, 'spark').setDepth(6).setAlpha(0).setScale(0.2);
    scene.tweens.add({
      targets: this.halo,
      alpha: { from: COLLECTIBLE.haloAlpha.min, to: COLLECTIBLE.haloAlpha.max },
      duration: COLLECTIBLE.haloMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.scheduleGlint();

    // o corpo estático fica no tile; só o visual flutua (item, halo e cintilho juntos)
    scene.tweens.add({
      targets: [this, this.halo, this.glint],
      y: `-=${COLLECTIBLE.floatPx}`,
      duration: COLLECTIBLE.floatMs,
      delay: Phaser.Math.Between(0, COLLECTIBLE.floatMs),
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private scheduleGlint(): void {
    const { min, max } = COLLECTIBLE.glintEveryMs;
    this.glintTimer = this.scene.time.delayedCall(Phaser.Math.Between(min, max), () => {
      if (this.taken || !this.active) return;
      this.glint.setAlpha(1).setScale(0.2).setAngle(0);
      this.scene.tweens.add({
        targets: this.glint,
        scale: { from: 0.2, to: 0.9 },
        alpha: { from: 1, to: 0 },
        angle: 45,
        duration: COLLECTIBLE.glintMs,
        ease: 'Sine.easeOut',
        onComplete: () => this.scheduleGlint(),
      });
    });
  }

  /** Retorna true só na primeira coleta */
  collect(): boolean {
    if (this.taken) return false;
    this.taken = true;
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.halo);
    this.scene.tweens.killTweensOf(this.glint);
    this.glintTimer?.remove();
    this.halo.destroy();
    this.glint.destroy();
    this.celebrate();
    this.scene.tweens.add({
      targets: this,
      y: this.y - COLLECTIBLE.pickRisePx,
      scale: 1.6,
      alpha: 0,
      duration: COLLECTIBLE.pickMs,
      ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    });
    return true;
  }

  /** Brilho ao coletar: clarão, anel se expandindo, faíscas e a pontuação subindo */
  private celebrate(): void {
    const { scene, x, y } = this;

    const flash = scene.add.image(x, y, 'collect-glow').setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD).setDepth(7).setScale(0.6);
    scene.tweens.add({ targets: flash, scale: 1.8, alpha: 0, duration: COLLECTIBLE.ringMs, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });

    const ring = scene.add.graphics().setDepth(7).setPosition(x, y).setBlendMode(Phaser.BlendModes.ADD);
    ring.lineStyle(3, this.glowColor, 1).strokeCircle(0, 0, COLLECTIBLE.ringRadius);
    ring.setScale(0.2);
    scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: COLLECTIBLE.ringMs, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });

    const sparks = scene.add
      .particles(x, y, 'spark', {
        lifespan: COLLECTIBLE.burstLifeMs,
        speed: COLLECTIBLE.burstSpeed,
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: this.glowColor,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(7);
    sparks.explode(COLLECTIBLE.burstCount);
    scene.time.delayedCall(COLLECTIBLE.burstLifeMs + 100, () => sparks.destroy());

    const points = scene.add
      .text(x, y - 14, `+${COLLECTIBLE.score}`, { fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: toCss(PALETTE.gold), stroke: toCss(PALETTE.black), strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(8);
    scene.tweens.add({ targets: points, y: points.y - COLLECTIBLE.scoreRisePx, alpha: 0, duration: COLLECTIBLE.scoreMs, ease: 'Quad.easeOut', onComplete: () => points.destroy() });
  }
}
