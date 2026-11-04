import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { CONFIRM_KEYS, onKeys } from './sceneInput';

export interface MenuOption {
  label: string;
  action: () => void;
}

/** Lista vertical de opções: ↑/↓ (ou W/S) escolhem, Enter/Espaço confirmam, o mouse também funciona */
export class OptionList {
  private selected = 0;
  private readonly texts: Phaser.GameObjects.Text[];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly options: readonly MenuOption[],
    spacing = 64,
    depth = 0,
  ) {
    this.texts = options.map((option, i) => {
      const text = scene.add
        .text(x, y + i * spacing, '', { fontFamily: 'monospace', fontSize: '30px' })
        .setOrigin(0.5)
        .setDepth(depth)
        .setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.select(i));
      text.on('pointerdown', () => option.action());
      return text;
    });
    this.select(0);

    onKeys(scene, ['UP', 'W'], () => this.select(this.selected - 1));
    onKeys(scene, ['DOWN', 'S'], () => this.select(this.selected + 1));
    onKeys(scene, CONFIRM_KEYS, () => this.options[this.selected].action());
  }

  private select(index: number): void {
    this.selected = Phaser.Math.Wrap(index, 0, this.options.length);
    this.texts.forEach((text, i) => {
      const active = i === this.selected;
      text.setText(active ? `> ${this.options[i].label} <` : this.options[i].label);
      text.setColor(toCss(active ? PALETTE.gold : PALETTE.cream));
    });
  }
}
