import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { HILLS_H, MID_H, SUN } from '../art/themes/quilombo';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { LEVELS } from '../data/levels';
import { LEVEL_SELECT_TEXTS } from '../data/texts';
import { gameState } from '../systems/GameState';
import { OptionList, type MenuOption } from '../systems/OptionList';
import { onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';

const DIGIT_KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;

/** Tela de escolha de fase: todas liberadas; segurar Shift ao escolher pula a introdução */
export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(CAMERA.fadeMs);

    // mesmo pano de fundo do menu
    this.add.image(0, 0, 'sky-quilombo').setOrigin(0);
    this.add.image(SUN.x, SUN.y, 'sunglow-quilombo');
    this.add.image(0, height - HILLS_H, 'hills-quilombo').setOrigin(0);
    this.add.image(0, height - MID_H, 'mid-quilombo').setOrigin(0);
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);
    this.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);

    // painel central
    this.add.rectangle(width / 2, 276, 760, 428,PALETTE.black, 0.72).setStrokeStyle(3, PALETTE.gold).setDepth(1);
    this.add
      .text(width / 2, 110, LEVEL_SELECT_TEXTS.title, {
        fontFamily: 'monospace',
        fontSize: '48px',
        fontStyle: 'bold',
        color: toCss(PALETTE.gold),
        stroke: toCss(PALETTE.black),
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(2);

    const shift = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    const start = (levelIndex: number): void => {
      gameState.reset();
      goToScene(this, shift?.isDown ? 'Game' : 'Intro', { levelIndex });
    };

    const options: MenuOption[] = LEVELS.map((level, i) => ({
      label: `${i + 1}  ${level.title}  ·  ${level.era}`,
      action: () => start(i),
    }));
    options.push({ label: LEVEL_SELECT_TEXTS.back, action: () => this.back() });
    new OptionList(this, width / 2, 210, options, 62, 2);

    LEVELS.forEach((_level, i) => {
      const digit = DIGIT_KEYS[i];
      if (digit) onKeys(this, [digit, `NUMPAD_${digit}`], () => start(i));
    });
    onKeys(this, ['ESC'], () => this.back());

    const small: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'monospace', fontSize: '16px', color: toCss(PALETTE.cream) };
    this.add.text(width / 2, 438, LEVEL_SELECT_TEXTS.hint, small).setOrigin(0.5).setDepth(2);
    this.add.text(width / 2, 462, LEVEL_SELECT_TEXTS.shortcut, small).setOrigin(0.5).setDepth(2);
  }

  private back(): void {
    goToScene(this, 'Menu');
  }
}
