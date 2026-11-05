import Phaser from 'phaser';
import { NPC } from '../config/physics';
import { npcTextureKey } from '../art/npcArt';
import { PALETTE, toCss } from '../config/palette';
import { NPC_TEXTS } from '../data/texts';
import { audio } from '../systems/audio/AudioManager';

/** Pessoa a ser libertada (fase 2): silhueta cinza que vira colorida, pula e mostra um balão. x, y = pés */
export class Npc extends Phaser.GameObjects.Image {
  private freed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly variant: number) {
    super(scene, x, y, npcTextureKey(variant, false));
    this.setOrigin(0.5, 1).setDepth(4);
    scene.add.existing(this);
  }

  get isFree(): boolean {
    return this.freed;
  }

  /** Clarão, faíscas douradas e os elos da corrente caindo */
  private celebrate(): void {
    const { scene, x } = this;
    const y = this.y - this.height / 2;
    const flash = scene.add.image(x, y, 'collect-glow').setTint(0xffd36a).setBlendMode(Phaser.BlendModes.ADD).setDepth(8).setScale(0.8);
    scene.tweens.add({ targets: flash, scale: 2.4, alpha: 0, duration: NPC.flashMs, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });

    const sparks = scene.add
      .particles(x, y, 'spark', {
        lifespan: NPC.burstLifeMs,
        speed: NPC.burstSpeed,
        scale: { start: 0.9, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: 0xffd36a,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(8);
    sparks.explode(NPC.burstCount);

    // elos soltos dos pulsos, caindo com gravidade
    const links = scene.add
      .particles(x, y - 10, 'chain-link', {
        lifespan: NPC.linkLifeMs,
        speed: { min: 30, max: 90 },
        angle: { min: 200, max: 340 },
        gravityY: 600,
        rotate: { min: 0, max: 360 },
        emitting: false,
      })
      .setDepth(8);
    links.explode(NPC.linkCount);
    scene.time.delayedCall(Math.max(NPC.burstLifeMs, NPC.linkLifeMs) + 100, () => {
      sparks.destroy();
      links.destroy();
    });
  }

  free(): void {
    if (this.freed) return;
    this.freed = true;
    this.setTexture(npcTextureKey(this.variant, true));
    this.celebrate();
    audio.play('free');

    const baseY = this.y;
    this.scene.tweens.add({
      targets: this,
      y: baseY - NPC.hopPx,
      duration: NPC.hopMs,
      ease: 'Quad.easeOut',
      yoyo: true,
      repeat: NPC.hops - 1,
      // depois dos pulos, balança de leve, comemorando
      onComplete: () => this.scene.tweens.add({ targets: this, y: baseY - NPC.cheerPx, duration: NPC.cheerMs, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 }),
    });

    const balloon = this.scene.add
      .text(this.x, this.y - this.height - 10, NPC_TEXTS.freed, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: toCss(PALETTE.black),
        backgroundColor: toCss(PALETTE.cream),
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(9);
    this.scene.tweens.add({
      targets: balloon,
      y: balloon.y - NPC.balloonRisePx,
      alpha: 0,
      delay: NPC.balloonMs,
      duration: 500,
      onComplete: () => balloon.destroy(),
    });
  }
}
