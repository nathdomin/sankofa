import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { ENEMY_ACCENT, ENEMY_SIZES, enemyTextureKey, type EnemyArtKind } from '../art/enemyArt';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { ENEMIES_TEXTS } from '../data/texts';
import { audio } from '../systems/audio/AudioManager';
import { addMenuBackdrop } from '../systems/MenuBackdrop';
import { CONFIRM_KEYS, onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';

export interface EnemiesSceneData {
  /** Cena que vem depois desta */
  next: { scene: string; data?: object };
}

const CARD = { y: 140, w: 410, h: 312, gap: 20 } as const;
const SPRITE_SCALE = 4;

/**
 * "Quem atravessa o caminho": apresenta os dois inimigos no começo do jogo, antes da fase 1 (o que são,
 * o que representam e como vencer). Eles são sempre ideias, nunca pessoas.
 */
export class EnemiesScene extends Phaser.Scene {
  private updateBackdrop!: (delta: number) => void;
  private next!: EnemiesSceneData['next'];

  constructor() {
    super('Enemies');
  }

  init(data: Partial<EnemiesSceneData>): void {
    if (!data.next) throw new Error('EnemiesScene precisa de next');
    this.next = data.next;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(CAMERA.fadeMs);
    this.updateBackdrop = addMenuBackdrop(this);
    audio.playMusic('roda');
    this.add.rectangle(0, BAND_H, width, height - BAND_H * 2, PALETTE.black, 0.45).setOrigin(0).setDepth(1);

    this.add
      .text(width / 2, 64, ENEMIES_TEXTS.title, { fontFamily: 'monospace', fontSize: '44px', fontStyle: 'bold', color: toCss(PALETTE.gold), stroke: toCss(PALETTE.black), strokeThickness: 8 })
      .setOrigin(0.5)
      .setDepth(3);
    this.add
      .text(width / 2, 108, ENEMIES_TEXTS.subtitle, { fontFamily: 'monospace', fontSize: '17px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(3);

    const x0 = (width - (CARD.w * 2 + CARD.gap)) / 2;
    this.card('desinformacao', x0);
    this.card('esquecimento', x0 + CARD.w + CARD.gap);

    const hint = this.add
      .text(width / 2, height - 44, ENEMIES_TEXTS.hint, { fontFamily: 'monospace', fontSize: '18px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(3);
    this.tweens.add({ targets: hint, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });

    const go = (): void => {
      audio.play('uiConfirm');
      goToScene(this, this.next.scene, this.next.data);
    };
    onKeys(this, CONFIRM_KEYS, go);
    this.input.on('pointerdown', go);
  }

  update(_time: number, delta: number): void {
    this.updateBackdrop(delta);
  }

  /** Cartão de um inimigo: retrato animado, nome, o que é e como vencer */
  private card(kind: EnemyArtKind, x: number): void {
    const text = ENEMIES_TEXTS[kind];
    const accent = ENEMY_ACCENT[kind];
    const y = CARD.y;

    this.add.rectangle(x, y, CARD.w, CARD.h, 0x0d0a14, 0.86).setOrigin(0).setStrokeStyle(3, accent).setDepth(2);
    this.add.rectangle(x, y, CARD.w, 6, accent).setOrigin(0).setDepth(2);

    // o inimigo andando, num círculo da cor dele
    const cx = x + 86;
    const cy = y + 84;
    this.add.circle(cx, cy, 58, accent, 0.16).setDepth(2);
    const { h } = ENEMY_SIZES[kind];
    const sprite = this.add.sprite(cx, cy + (h * SPRITE_SCALE) / 2 - 8, enemyTextureKey(kind, 0)).setOrigin(0.5, 1).setScale(SPRITE_SCALE).setDepth(3);
    sprite.play(`enemy-${kind}-walk`);
    this.tweens.add({ targets: sprite, y: sprite.y - 5, duration: 700, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    this.add
      .text(x + 168, y + 54, text.name, { fontFamily: 'monospace', fontSize: '28px', fontStyle: 'bold', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 5 })
      .setOrigin(0, 0.5)
      .setDepth(3);
    this.add
      .text(x + 168, y + 88, text.tag, { fontFamily: 'monospace', fontSize: '16px', color: toCss(accent), stroke: toCss(PALETTE.black), strokeThickness: 3, wordWrap: { width: 220 } })
      .setOrigin(0, 0.5)
      .setDepth(3);

    this.add.rectangle(x + 24, y + 150, CARD.w - 48, 2, accent, 0.6).setOrigin(0).setDepth(3);
    this.add
      .text(x + 24, y + 164, text.what, { fontFamily: 'monospace', fontSize: '15px', color: toCss(PALETTE.cream), wordWrap: { width: CARD.w - 48 }, lineSpacing: 4 })
      .setDepth(3);
    this.add
      .text(x + 24, y + CARD.h - 72, ENEMIES_TEXTS.howTitle, { fontFamily: 'monospace', fontSize: '15px', fontStyle: 'bold', color: toCss(PALETTE.gold) })
      .setDepth(3);
    this.add
      .text(x + 24, y + CARD.h - 50, text.how, { fontFamily: 'monospace', fontSize: '15px', color: toCss(PALETTE.gold), wordWrap: { width: CARD.w - 48 } })
      .setDepth(3);
  }
}
