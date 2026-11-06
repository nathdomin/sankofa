import Phaser from 'phaser';
import { forInput } from '../systems/TouchInput';
import { BAND_H } from '../art/hudArt';
import { PALETTE, toCss } from '../config/palette';
import { PAUSE_TEXTS, TOUCH_TEXTS } from '../data/texts';
import { addLeftScrim } from '../systems/MenuBackdrop';
import { audio } from '../systems/audio/AudioManager';
import { OptionList } from '../systems/OptionList';
import { onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';

const LEFT = 84;

/** Pausa: fica por cima da GameScene (que fica parada embaixo) até Esc/P ou "Continuar" */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(): void {
    const { width, height } = this.scale;
    // o jogo continua visível, escurecido; o véu mais forte à esquerda segura o texto, como nos menus
    this.add.rectangle(0, 0, width, height, PALETTE.black, 0.4).setOrigin(0);
    addLeftScrim(this, 1, 0.85);

    this.add
      .text(LEFT, 130, PAUSE_TEXTS.title, { fontFamily: 'monospace', fontSize: '72px', fontStyle: 'bold', color: toCss(PALETTE.gold), stroke: toCss(PALETTE.black), strokeThickness: 9 })
      .setOrigin(0, 0.5)
      .setDepth(2);
    this.add.tileSprite(LEFT, 186, 280, BAND_H, 'hud-band').setOrigin(0, 0.5).setDepth(2);

    new OptionList(
      this,
      LEFT + 22,
      262,
      [
        { label: PAUSE_TEXTS.resume, action: () => this.resume() },
        { label: PAUSE_TEXTS.menu, action: () => this.toMenu() },
      ],
      { align: 'left', spacing: 56, fontSize: 32, depth: 3 },
    );

    this.add
      .text(LEFT, height - 44, forInput(PAUSE_TEXTS.hint, TOUCH_TEXTS.pause), { fontFamily: 'monospace', fontSize: '16px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 4 })
      .setOrigin(0, 0.5)
      .setDepth(3);

    onKeys(this, ['ESC', 'P'], () => this.resume());
  }

  private resume(): void {
    audio.setDuck(false);
    audio.play('uiBack');
    this.scene.resume('Game');
    this.scene.stop();
  }

  /** Sai da partida: encerra a GameScene (que encerra o HUD) e volta ao menu */
  private toMenu(): void {
    goToScene(this, 'Menu', undefined, () => this.scene.stop('Game'));
  }
}
