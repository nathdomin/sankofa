import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { GAME_OVER_TEXTS } from '../data/texts';
import { gameState } from '../systems/GameState';
import { CONFIRM_KEYS, onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';

export interface GameOverSceneData {
  levelIndex: number;
}

interface Option {
  label: string;
  action: () => void;
  text?: Phaser.GameObjects.Text;
}

export class GameOverScene extends Phaser.Scene {
  private levelIndex = 0;
  private options: Option[] = [];
  private selected = 0;

  constructor() {
    super('GameOver');
  }

  init(data: Partial<GameOverSceneData>): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.selected = 0;
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

    this.options = [
      {
        label: GAME_OVER_TEXTS.retry,
        // recomeça a fase com as vidas cheias e a pontuação de quando ela começou
        action: () => {
          gameState.restoreLevelStart();
          goToScene(this, 'Intro', { levelIndex: this.levelIndex });
        },
      },
      { label: GAME_OVER_TEXTS.menu, action: () => goToScene(this, 'Menu') },
    ];
    this.options.forEach((option, i) => {
      const text = this.add
        .text(width / 2, 300 + i * 64, '', { fontFamily: 'monospace', fontSize: '30px' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.select(i));
      text.on('pointerdown', () => option.action());
      option.text = text;
    });
    this.select(0);

    onKeys(this, ['UP', 'W'], () => this.select(this.selected - 1));
    onKeys(this, ['DOWN', 'S'], () => this.select(this.selected + 1));
    onKeys(this, CONFIRM_KEYS, () => this.options[this.selected].action());
  }

  private select(index: number): void {
    this.selected = Phaser.Math.Wrap(index, 0, this.options.length);
    this.options.forEach((option, i) => {
      const active = i === this.selected;
      option.text?.setText(active ? `> ${option.label} <` : option.label);
      option.text?.setColor(toCss(active ? PALETTE.gold : PALETTE.cream));
    });
  }
}
