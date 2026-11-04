import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { VICTORY_TEXTS } from '../data/texts';
import { gameState } from '../systems/GameState';
import { CONFIRM_KEYS, onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';

const CREDITS_SCROLL_MS = 16000;

type Stage = 'message' | 'credits';

/** Final do jogo: significado do Sankofa e pontuação; depois, os créditos rolando */
export class VictoryScene extends Phaser.Scene {
  private stage: Stage = 'message';
  private messageGroup!: Phaser.GameObjects.Container;
  private creditsGroup!: Phaser.GameObjects.Container;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super('Victory');
  }

  init(): void {
    this.stage = 'message';
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.black).fadeIn(CAMERA.fadeMs);
    // tarjas pretas por cima dos créditos: o texto entra e sai por baixo delas, sem passar sobre a dica
    this.add.rectangle(0, 0, width, BAND_H + 8, PALETTE.black).setOrigin(0).setDepth(4);
    this.add.rectangle(0, height - 64, width, 64, PALETTE.black).setOrigin(0).setDepth(4);
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);
    this.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);

    const cream: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: toCss(PALETTE.cream),
      align: 'center',
      wordWrap: { width: 880 },
      lineSpacing: 10,
    };

    // etapa 1: o significado do Sankofa e a pontuação
    const heart = this.add.image(width / 2, 90, 'sankofa').setScale(4);
    this.tweens.add({ targets: heart, y: 82, duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    const title = this.add
      .text(width / 2, 170, VICTORY_TEXTS.title, {
        fontFamily: 'monospace',
        fontSize: '64px',
        fontStyle: 'bold',
        color: toCss(PALETTE.gold),
        stroke: toCss(PALETTE.black),
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    const message = this.add.text(width / 2, 300, VICTORY_TEXTS.message.join('\n\n'), cream).setOrigin(0.5);
    const score = this.add
      .text(width / 2, 420, `${VICTORY_TEXTS.score}: ${gameState.score}`, { ...cream, fontSize: '32px', color: toCss(PALETTE.gold) })
      .setOrigin(0.5);
    this.messageGroup = this.add.container(0, 0, [heart, title, message, score]);

    // etapa 2: créditos (começam abaixo da tela e sobem)
    const credits = this.add
      .text(width / 2, 0, [VICTORY_TEXTS.creditsTitle, '', ...VICTORY_TEXTS.credits].join('\n'), { ...cream, lineSpacing: 14 })
      .setOrigin(0.5, 0);
    this.creditsGroup = this.add.container(0, 0, [credits]).setVisible(false);
    this.creditsGroup.setData('text', credits);

    this.hint = this.add
      .text(width / 2, height - 44, VICTORY_TEXTS.hint, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: toCss(PALETTE.cream),
        stroke: toCss(PALETTE.black),
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.tweens.add({ targets: this.hint, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    onKeys(this, CONFIRM_KEYS, () => this.advance());
  }

  private advance(): void {
    if (this.stage === 'message') this.startCredits();
    else goToScene(this, 'Menu');
  }

  private startCredits(): void {
    this.stage = 'credits';
    this.messageGroup.setVisible(false);
    this.hint.setText(VICTORY_TEXTS.hintMenu);

    const { height } = this.scale;
    const credits = this.creditsGroup.getData('text') as Phaser.GameObjects.Text;
    this.creditsGroup.setVisible(true);
    credits.setY(height);
    this.tweens.add({ targets: credits, y: -credits.height, duration: CREDITS_SCROLL_MS, ease: 'Linear', onComplete: () => goToScene(this, 'Menu') });
  }
}
