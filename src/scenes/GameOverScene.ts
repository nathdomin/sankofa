import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { GAME_OVER_TEXTS } from '../data/texts';
import { gameState } from '../systems/GameState';
import { OptionList } from '../systems/OptionList';
import { goToScene } from '../systems/transitions';

export interface GameOverSceneData {
  levelIndex: number;
}

export class GameOverScene extends Phaser.Scene {
  private levelIndex = 0;

  constructor() {
    super('GameOver');
  }

  init(data: Partial<GameOverSceneData>): void {
    this.levelIndex = data.levelIndex ?? 0;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.black).fadeIn(CAMERA.fadeMs);
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0);
    this.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0);

    this.add
      .text(width / 2, 130, GAME_OVER_TEXTS.title, { fontFamily: 'monospace', fontSize: '64px', fontStyle: 'bold', color: toCss(PALETTE.gold), stroke: toCss(PALETTE.black), strokeThickness: 8 })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 200, GAME_OVER_TEXTS.subtitle, { fontFamily: 'monospace', fontSize: '22px', color: toCss(PALETTE.cream) })
      .setOrigin(0.5);

    new OptionList(this, width / 2, 300, [
      {
        label: GAME_OVER_TEXTS.retry,
        // recomeça a fase com as vidas cheias e a pontuação de quando ela começou
        action: () => {
          gameState.restoreLevelStart();
          goToScene(this, 'Intro', { levelIndex: this.levelIndex });
        },
      },
      { label: GAME_OVER_TEXTS.menu, action: () => goToScene(this, 'Menu') },
    ]);
  }
}
