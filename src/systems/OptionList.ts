import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { audio } from './audio/AudioManager';
import { CONFIRM_KEYS, onKeys } from './sceneInput';

export interface MenuOption {
  label: string;
  action: () => void;
}

export interface OptionListStyle {
  spacing?: number;
  depth?: number;
  fontSize?: number;
  /**
   * `center`: texto centrado em x, a opção ativa entre "> <" (Pausa, Game Over).
   * `left`: texto alinhado à esquerda em x, com uma barra dourada que acompanha a opção ativa (menus).
   */
  align?: 'center' | 'left';
}

const SLIDE_PX = 10; // quanto a opção ativa avança, no alinhamento à esquerda

/** Lista vertical de opções: ↑/↓ (ou W/S) escolhem, Enter/Espaço confirmam, o mouse também funciona */
export class OptionList {
  private selected = 0;
  private readonly texts: Phaser.GameObjects.Text[];
  private readonly marker?: Phaser.GameObjects.Rectangle;
  private readonly spacing: number;
  private readonly align: 'center' | 'left';
  private readonly x: number;
  private readonly y: number;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly options: readonly MenuOption[],
    style: OptionListStyle = {},
  ) {
    const { spacing = 64, depth = 0, fontSize = 30, align = 'center' } = style;
    this.spacing = spacing;
    this.align = align;
    this.x = x;
    this.y = y;

    if (align === 'left') {
      this.marker = scene.add.rectangle(x - 22, y, 6, fontSize + 4, PALETTE.gold).setOrigin(0.5).setDepth(depth);
    }
    this.texts = options.map((option, i) => {
      const text = scene.add
        .text(x, y + i * spacing, '', {
          fontFamily: 'monospace',
          fontSize: `${fontSize}px`,
          fontStyle: align === 'left' ? 'bold' : 'normal',
          // nos menus com cenário ao fundo, o contorno garante a leitura
          ...(align === 'left' ? { stroke: toCss(PALETTE.black), strokeThickness: 5 } : {}),
        })
        .setOrigin(align === 'left' ? 0 : 0.5, 0.5)
        .setDepth(depth)
        .setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.select(i));
      text.on('pointerdown', () => {
        audio.play('uiConfirm');
        option.action();
      });
      return text;
    });
    this.select(0, false);

    onKeys(scene, ['UP', 'W'], () => this.select(this.selected - 1));
    onKeys(scene, ['DOWN', 'S'], () => this.select(this.selected + 1));
    onKeys(scene, CONFIRM_KEYS, () => {
      audio.play('uiConfirm');
      this.options[this.selected].action();
    });
  }

  private select(index: number, animate = true): void {
    const previous = this.selected;
    this.selected = Phaser.Math.Wrap(index, 0, this.options.length);
    if (animate && this.selected !== previous) audio.play('uiMove');
    this.texts.forEach((text, i) => {
      const active = i === this.selected;
      if (this.align === 'center') {
        text.setText(active ? `> ${this.options[i].label} <` : this.options[i].label);
        text.setColor(toCss(active ? PALETTE.gold : PALETTE.cream));
        return;
      }
      text.setText(this.options[i].label);
      text.setColor(toCss(active ? PALETTE.gold : PALETTE.cream));
      text.setAlpha(active ? 1 : 0.72);
      const targetX = this.x + (active ? SLIDE_PX : 0);
      if (animate) this.scene.tweens.add({ targets: text, x: targetX, duration: 120, ease: 'Quad.easeOut' });
      else text.setX(targetX);
    });
    if (this.marker) {
      const targetY = this.y + this.selected * this.spacing;
      if (animate) this.scene.tweens.add({ targets: this.marker, y: targetY, duration: 120, ease: 'Quad.easeOut' });
      else this.marker.setY(targetY);
    }
  }
}
