import Phaser from 'phaser';
import { audio } from '../systems/audio/AudioManager';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { HELP_TEXTS } from '../data/texts';
import { addMenuBackdrop } from '../systems/MenuBackdrop';
import { CONFIRM_KEYS, onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';

const LEFT = 84;
const ROW_H = 40;

/** "Como jogar": os controles em teclas desenhadas e duas dicas curtas */
export class HelpScene extends Phaser.Scene {
  private updateBackdrop!: (delta: number) => void;

  constructor() {
    super('Help');
  }

  create(): void {
    const { height } = this.scale;
    this.cameras.main.fadeIn(CAMERA.fadeMs);
    this.updateBackdrop = addMenuBackdrop(this);
    audio.playMusic('roda');

    this.add
      .text(LEFT, 100, HELP_TEXTS.title, { fontFamily: 'monospace', fontSize: '56px', fontStyle: 'bold', color: toCss(PALETTE.gold), stroke: toCss(PALETTE.black), strokeThickness: 8 })
      .setOrigin(0, 0.5)
      .setDepth(2);

    HELP_TEXTS.controls.forEach((row, i) => {
      const y = 170 + i * ROW_H;
      this.add
        .text(LEFT, y, row.action, { fontFamily: 'monospace', fontSize: '20px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 4 })
        .setOrigin(0, 0.5)
        .setDepth(2);
      // teclas desenhadas à direita da coluna de ações
      let x = LEFT + 392;
      for (const key of row.keys) x += this.keyCap(x, y, key) + 8;
    });

    HELP_TEXTS.tips.forEach((tip, i) => {
      this.add
        .text(LEFT, 424 + i * 24, tip, { fontFamily: 'monospace', fontSize: '15px', color: toCss(PALETTE.gold), stroke: toCss(PALETTE.black), strokeThickness: 4, wordWrap: { width: 800 } })
        .setOrigin(0, 0.5)
        .setDepth(2);
    });

    const hint = this.add
      .text(LEFT, height - 44, HELP_TEXTS.back, { fontFamily: 'monospace', fontSize: '16px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 4 })
      .setOrigin(0, 0.5)
      .setDepth(6);
    this.tweens.add({ targets: hint, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });

    onKeys(this, [...CONFIRM_KEYS, 'ESC'], () => {
      audio.play('uiBack');
      goToScene(this, 'Menu');
    });
    this.input.on('pointerdown', () => goToScene(this, 'Menu'));
  }

  update(_time: number, delta: number): void {
    this.updateBackdrop(delta);
  }

  /** Tecla desenhada: devolve a largura ocupada */
  private keyCap(x: number, y: number, label: string): number {
    const text = this.add
      .text(0, 0, label, { fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: toCss(PALETTE.gold) })
      .setOrigin(0.5)
      .setDepth(3);
    const w = Math.max(34, text.width + 20);
    this.add.rectangle(x + w / 2, y, w, 34, PALETTE.black, 0.72).setStrokeStyle(2, PALETTE.gold).setDepth(2);
    this.add.rectangle(x + w / 2, y + 14, w - 4, 3, PALETTE.gold, 0.5).setDepth(2);
    text.setPosition(x + w / 2, y - 1);
    return w;
  }
}
