import Phaser from 'phaser';
import { ENEMY, TILE_SIZE } from '../config/physics';
import { enemyTextureKey } from '../art/enemyArt';
import type { EnemyKind } from '../systems/LevelBuilder';

/** Inimigo que patrulha: anda até bater numa parede ou chegar à beira da plataforma e vira */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: EnemyKind;
  private dir: 1 | -1 = -1;
  private defeated = false;
  private readonly isSolidAt: (tx: number, ty: number) => boolean;

  /** x, y = posição dos pés */
  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind, isSolidAt: (tx: number, ty: number) => boolean) {
    super(scene, x, y, enemyTextureKey(kind, 0));
    this.kind = kind;
    this.isSolidAt = isSolidAt;

    // origem antes do corpo: o Arcade calcula a posição do corpo a partir dela
    this.setOrigin(0.5, 1).setDepth(8);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.play(`enemy-${kind}-walk`);

    const { body: box } = ENEMY[kind];
    this.arcadeBody.setSize(box.w, box.h, false).setOffset(box.ox, box.oy).setCollideWorldBounds(true);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get canBeStomped(): boolean {
    return ENEMY[this.kind].stompable;
  }

  get isDefeated(): boolean {
    return this.defeated;
  }

  /** Chamado pelo grupo a cada frame (runChildUpdate) */
  update(): void {
    if (this.defeated) return;
    const body = this.arcadeBody;

    if (body.blocked.left) this.dir = 1;
    else if (body.blocked.right) this.dir = -1;
    else if (body.blocked.down && (this.edgeAhead() || this.lowCeilingAhead())) this.dir = this.dir === 1 ? -1 : 1;

    body.setVelocityX(this.dir * ENEMY[this.kind].speed);
  }

  /** Derrotado: some com um achatamento rápido e uma nuvem de pixels (ruído da desinformação ou poeira do esquecimento) */
  defeat(): void {
    if (this.defeated) return;
    this.defeated = true;
    this.arcadeBody.enable = false;
    this.anims.stop();
    this.burst();
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      scaleX: 1.3,
      alpha: 0,
      duration: ENEMY.defeatMs,
      ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    });
  }

  private burst(): void {
    const { count, speed, lifeMs } = ENEMY.defeatBurst;
    const noise = this.kind === 'desinformacao';
    const emitter = this.scene.add
      .particles(this.x, this.y - this.height / 2, 'pixel', {
        lifespan: lifeMs,
        speed,
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        // desinformação estoura em ruído magenta e ciano; esquecimento vira poeira pálida que sobe
        tint: noise ? [0xe0409a, 0x40d8e8, 0x7a6a94] : [0xa8e6ff, 0x8a84a0, 0x6e6a80],
        gravityY: noise ? 200 : -60,
        emitting: false,
      })
      .setDepth(9);
    emitter.explode(count);
    this.scene.time.delayedCall(lifeMs + 100, () => emitter.destroy());
  }

  /**
   * Passagem baixa à frente (vão de 1 tile, como o túnel da esquiva): o inimigo cabe nela, mas não entra,
   * senão ficaria no caminho de quem está passando abaixado, sem como desviar
   */
  private lowCeilingAhead(): boolean {
    const body = this.arcadeBody;
    const aheadX = this.dir === 1 ? body.right + 1 : body.left - 1;
    const tx = Math.floor(aheadX / TILE_SIZE);
    const feetRow = Math.floor((body.bottom - 1) / TILE_SIZE);
    return this.isSolidAt(tx, feetRow - 1);
  }

  /** Não há chão logo à frente, na beira da plataforma */
  private edgeAhead(): boolean {
    const body = this.arcadeBody;
    const aheadX = this.dir === 1 ? body.right + 1 : body.left - 1;
    const tx = Math.floor(aheadX / TILE_SIZE);
    const ty = Math.floor((body.bottom + 1) / TILE_SIZE);
    return !this.isSolidAt(tx, ty);
  }
}
