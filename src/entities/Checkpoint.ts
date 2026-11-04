import Phaser from 'phaser';

/** Bandeira de checkpoint. x, y = base da haste */
export class Checkpoint extends Phaser.GameObjects.Image {
  private reached = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'checkpoint-off');
    this.setOrigin(0.5, 1);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  get isActivated(): boolean {
    return this.reached;
  }

  /** Retorna true só na primeira ativação */
  activate(): boolean {
    if (this.reached) return false;
    this.reached = true;
    this.setTexture('checkpoint-on');
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1.25, to: 1 },
      duration: 250,
      ease: 'Back.easeOut',
    });
    return true;
  }
}
