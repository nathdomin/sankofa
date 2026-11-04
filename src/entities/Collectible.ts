import Phaser from 'phaser';
import { COLLECTIBLE } from '../config/physics';

/** Coletável da fase (Sankofa, carta de alforria, folha de papel). x, y = centro do tile */
export class Collectible extends Phaser.GameObjects.Image {
  private taken = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.setDepth(5);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // o corpo estático fica no tile; só o visual flutua
    scene.tweens.add({
      targets: this,
      y: y - COLLECTIBLE.floatPx,
      duration: COLLECTIBLE.floatMs,
      delay: Phaser.Math.Between(0, COLLECTIBLE.floatMs),
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  /** Retorna true só na primeira coleta */
  collect(): boolean {
    if (this.taken) return false;
    this.taken = true;
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.scene.tweens.killTweensOf(this);
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
}
