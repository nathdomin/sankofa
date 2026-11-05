import Phaser from 'phaser';
import { PALETTE, toCss } from '../config/palette';
import { audio } from './audio/AudioManager';
import { CONFIRM_KEYS, onKeys } from './sceneInput';

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface DialoguePanel {
  x: number;
  y: number;
  w: number;
  h: number;
}

const TYPE_MS = 22; // tempo por letra da fala

/**
 * Caixa de fala com texto digitado: Enter/Espaço/clique completam a fala que está sendo digitada
 * e, no aperto seguinte, avançam. Usada pela Intro (mentor) e pela Story (protagonista e ligações).
 */
export class DialogueBox {
  private index = 0;
  private typer: Phaser.Time.TimerEvent | null = null;
  private readonly name: Phaser.GameObjects.Text;
  private readonly speech: Phaser.GameObjects.Text;
  private readonly counter: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    panel: DialoguePanel,
    private readonly lines: readonly DialogueLine[],
    private readonly onLine: ((line: DialogueLine, index: number) => void) | undefined,
    private readonly onDone: () => void,
    /** Avisa quando o texto começa e termina de ser digitado (o retrato mexe a boca nesse intervalo) */
    private readonly onTyping?: (typing: boolean) => void,
  ) {
    scene.add.rectangle(panel.x, panel.y, panel.w, panel.h, PALETTE.black, 0.7).setOrigin(0).setStrokeStyle(4, PALETTE.gold);
    this.name = scene.add
      .text(panel.x + 24, panel.y + 18, '', { fontFamily: 'monospace', fontSize: '24px', fontStyle: 'bold', color: toCss(PALETTE.gold) })
      .setOrigin(0);
    this.speech = scene.add
      .text(panel.x + 24, panel.y + 66, '', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: toCss(PALETTE.cream),
        wordWrap: { width: panel.w - 48 },
        lineSpacing: 8,
      })
      .setOrigin(0);
    this.counter = scene.add
      .text(panel.x + panel.w - 20, panel.y + panel.h - 16, '', { fontFamily: 'monospace', fontSize: '16px', color: toCss(PALETTE.cream) })
      .setOrigin(1, 1);

    onKeys(scene, CONFIRM_KEYS, () => this.advance());
    scene.input.on('pointerdown', () => this.advance());
    this.startLine();
  }

  private advance(): void {
    if (this.typer) {
      this.finishTyping();
      return;
    }
    audio.play('uiConfirm');
    if (this.index < this.lines.length - 1) {
      this.index++;
      this.startLine();
    } else {
      this.onDone();
    }
  }

  private startLine(): void {
    const line = this.lines[this.index];
    this.onLine?.(line, this.index);
    this.name.setText(line.speaker);
    this.counter.setText(`${this.index + 1}/${this.lines.length}`);
    this.speech.setText('');
    this.onTyping?.(true);
    let shown = 0;
    this.typer = this.scene.time.addEvent({
      delay: TYPE_MS,
      repeat: line.text.length - 1,
      callback: () => {
        shown++;
        if (shown % 3 === 0) audio.play('type');
        this.speech.setText(line.text.slice(0, shown));
        if (shown >= line.text.length) {
          this.typer = null;
          this.onTyping?.(false);
        }
      },
    });
  }

  private finishTyping(): void {
    this.typer?.remove(false);
    this.typer = null;
    this.onTyping?.(false);
    this.speech.setText(this.lines[this.index].text);
  }
}
