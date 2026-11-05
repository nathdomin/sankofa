import Phaser from 'phaser';
import { audio } from '../systems/audio/AudioManager';
import { BAND_H } from '../art/hudArt';
import { PALETTE, darken, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { MENTOR_ACCENT, PORTRAIT, mentorTextureKey } from '../art/mentorArt';
import { LEVELS } from '../data/levels';
import { MENTORS, VICTORY_TEXTS } from '../data/texts';
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
    audio.playMusic('vitoria');
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

    // etapa 1: a jornada (três mentores numa linha do tempo), o significado do Sankofa e a pontuação
    const title = this.add
      .text(width / 2, 58, VICTORY_TEXTS.title, {
        fontFamily: 'monospace',
        fontSize: '56px',
        fontStyle: 'bold',
        color: toCss(PALETTE.gold),
        stroke: toCss(PALETTE.black),
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    const items: Phaser.GameObjects.GameObject[] = [title];

    // linha dourada ligando os retratos, com um Sankofa entre cada par
    const centers = LEVELS.map((_l, i) => width / 2 + (i - (LEVELS.length - 1) / 2) * 250);
    items.push(this.add.rectangle(width / 2, 166, centers[centers.length - 1] - centers[0], 4, PALETTE.gold, 0.8));
    for (let i = 0; i < centers.length - 1; i++) items.push(this.add.image((centers[i] + centers[i + 1]) / 2, 166, 'sankofa').setScale(1.6));
    LEVELS.forEach((level, i) => {
      const cx = centers[i];
      const accent = MENTOR_ACCENT[level.mentorId];
      const w = PORTRAIT.w * 0.5;
      const h = PORTRAIT.h * 0.5;
      const top = 106;
      items.push(this.add.rectangle(cx, top + h / 2, w + 8, h + 8, PALETTE.gold));
      items.push(this.add.rectangle(cx, top + h / 2, w, h, darken(accent, 65)));
      items.push(this.add.image(cx, top + h, mentorTextureKey(level.mentorId)).setOrigin(0.5, 1).setScale(0.5));
      items.push(
        this.add.text(cx, top + h + 24, MENTORS[level.mentorId].name, { fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: toCss(PALETTE.gold), align: 'center', wordWrap: { width: 230 } }).setOrigin(0.5),
      );
      items.push(this.add.text(cx, top + h + 44, level.era, { fontFamily: 'monospace', fontSize: '14px', color: toCss(PALETTE.cream) }).setOrigin(0.5));
    });

    items.push(this.add.text(width / 2, 372, VICTORY_TEXTS.message.join('\n\n'), { ...cream, fontSize: '22px', lineSpacing: 8 }).setOrigin(0.5));
    items.push(
      this.add.text(width / 2, 452, `${VICTORY_TEXTS.score}: ${gameState.score}`, { ...cream, fontSize: '30px', color: toCss(PALETTE.gold) }).setOrigin(0.5),
    );
    this.messageGroup = this.add.container(0, 0, items);
    // entrada em sequência: título, cada mentor, depois o texto e a pontuação
    items.forEach((item, i) => {
      const target = item as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha;
      target.setAlpha(0);
      this.tweens.add({ targets: target, alpha: 1, delay: 150 + i * 70, duration: 420 });
    });

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
    audio.play('uiConfirm');
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
