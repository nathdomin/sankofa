import Phaser from 'phaser';
import { forInput, touchInput } from '../systems/TouchInput';
import { audio } from '../systems/audio/AudioManager';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { LEVELS } from '../data/levels';
import { LEVEL_SELECT_TEXTS, TOUCH_TEXTS } from '../data/texts';
import { gameState } from '../systems/GameState';
import { addMenuBackdrop } from '../systems/MenuBackdrop';
import { OptionList, type MenuOption } from '../systems/OptionList';
import { onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';

const DIGIT_KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'] as const;
const LEFT = 84;

/** Tela de escolha de fase: todas liberadas; segurar Shift ao escolher pula a introdução */
export class LevelSelectScene extends Phaser.Scene {
  private updateBackdrop!: (delta: number) => void;

  constructor() {
    super('LevelSelect');
  }

  create(): void {
    const { height } = this.scale;
    this.cameras.main.fadeIn(CAMERA.fadeMs);
    this.updateBackdrop = addMenuBackdrop(this);
    audio.playMusic('roda');

    this.add
      .text(LEFT, 100, LEVEL_SELECT_TEXTS.title, { fontFamily: 'monospace', fontSize: '56px', fontStyle: 'bold', color: toCss(PALETTE.gold), stroke: toCss(PALETTE.black), strokeThickness: 8 })
      .setOrigin(0, 0.5)
      .setDepth(2);

    const shift = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    const start = (levelIndex: number): void => {
      gameState.reset();
      goToScene(this, shift?.isDown ? 'Game' : 'Intro', { levelIndex });
    };

    const options: MenuOption[] = LEVELS.map((level, i) => ({
      label: `${i + 1}  ${level.title}`,
      action: () => start(i),
    }));
    options.push({ label: LEVEL_SELECT_TEXTS.back, action: () => this.back() });
    new OptionList(this, LEFT + 22, 190, options, { align: 'left', spacing: 62, fontSize: 28, depth: 3 });

    // época de cada fase, em letras pequenas ao lado do nome
    LEVELS.forEach((level, i) => {
      this.add
        .text(LEFT + 22, 190 + i * 62 + 24, level.era, { fontFamily: 'monospace', fontSize: '14px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 3 })
        .setOrigin(0, 0.5)
        .setDepth(3)
        .setAlpha(0.8);
    });

    LEVELS.forEach((_level, i) => {
      const digit = DIGIT_KEYS[i];
      if (digit) onKeys(this, [digit, `NUMPAD_${digit}`], () => { audio.play('uiConfirm'); start(i); });
    });
    onKeys(this, ['ESC'], () => this.back());

    const small: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'monospace', fontSize: '15px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 4 };
    this.add.text(LEFT, height - 70, forInput(LEVEL_SELECT_TEXTS.hint, TOUCH_TEXTS.levelSelect), small).setOrigin(0, 0.5).setDepth(6);
    // o atalho Shift só existe no teclado
    if (!touchInput.enabled) this.add.text(LEFT, height - 46, LEVEL_SELECT_TEXTS.shortcut, small).setOrigin(0, 0.5).setDepth(6);
  }

  update(_time: number, delta: number): void {
    this.updateBackdrop(delta);
  }

  private back(): void {
    audio.play('uiBack');
    goToScene(this, 'Menu');
  }
}
