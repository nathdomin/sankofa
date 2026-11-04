import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { PALETTE, toCss } from '../config/palette';
import { PAUSE_TEXTS } from '../data/texts';
import { OptionList } from '../systems/OptionList';
import { onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';

/** Pausa: fica por cima da GameScene (que fica parada embaixo) até Esc/P ou "Continuar" */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, PALETTE.black, 0.65).setOrigin(0);

    const panel = { w: 520, h: 300 };
    const left = (width - panel.w) / 2;
    const top = (height - panel.h) / 2;
    this.add.rectangle(left, top, panel.w, panel.h, PALETTE.black, 0.85).setOrigin(0).setStrokeStyle(4, PALETTE.gold);
    this.add.tileSprite(left + 4, top + 4, panel.w - 8, BAND_H, 'hud-band').setOrigin(0);

    this.add
      .text(width / 2, top + 72, PAUSE_TEXTS.title, {
        fontFamily: 'monospace',
        fontSize: '48px',
        fontStyle: 'bold',
        color: toCss(PALETTE.gold),
        stroke: toCss(PALETTE.black),
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    new OptionList(this, width / 2, top + 150, [
      { label: PAUSE_TEXTS.resume, action: () => this.resume() },
      { label: PAUSE_TEXTS.menu, action: () => this.toMenu() },
    ]);

    this.add
      .text(width / 2, top + panel.h - 28, PAUSE_TEXTS.hint, { fontFamily: 'monospace', fontSize: '16px', color: toCss(PALETTE.cream) })
      .setOrigin(0.5);

    onKeys(this, ['ESC', 'P'], () => this.resume());
  }

  private resume(): void {
    this.scene.resume('Game');
    this.scene.stop();
  }

  /** Sai da partida: encerra a GameScene (que encerra o HUD) e volta ao menu */
  private toMenu(): void {
    goToScene(this, 'Menu', undefined, () => this.scene.stop('Game'));
  }
}
