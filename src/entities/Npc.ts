import Phaser from 'phaser';
import { NPC } from '../config/physics';
import { PALETTE, toCss } from '../config/palette';
import { NPC_TEXTS } from '../data/texts';

/** Pessoa a ser libertada (fase 2): silhueta cinza que vira colorida, pula e mostra um balão. x, y = pés */
export class Npc extends Phaser.GameObjects.Image {
  private freed = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'npc-preso');
    this.setOrigin(0.5, 1).setDepth(4);
    scene.add.existing(this);
  }

  get isFree(): boolean {
    return this.freed;
  }

  free(): void {
    if (this.freed) return;
    this.freed = true;
    this.setTexture('npc-livre');

    this.scene.tweens.add({
      targets: this,
      y: this.y - NPC.hopPx,
      duration: NPC.hopMs,
      ease: 'Quad.easeOut',
      yoyo: true,
      repeat: NPC.hops - 1,
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
