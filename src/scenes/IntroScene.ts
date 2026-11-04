import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { PORTRAIT, mentorTextureKey } from '../art/mentorArt';
import { PALETTE, darken, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { LEVELS, type LevelConfig } from '../data/levels';
import { INTRO_TEXTS, MENTORS, type Mentor } from '../data/texts';
import { CONFIRM_KEYS, onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';

export interface IntroSceneData {
  levelIndex: number;
}

const TYPE_MS = 22; // tempo por letra da fala
const PANEL = { x: 300, y: 140, w: 620, h: 250 } as const;

/** O mentor apresenta a fase: retrato em silhueta e 2–3 falas avançadas com Enter/Espaço */
export class IntroScene extends Phaser.Scene {
  private levelIndex = 0;
  private config!: LevelConfig;
  private mentor!: Mentor;
  private lineIndex = 0;
  private speech!: Phaser.GameObjects.Text;
  private counter!: Phaser.GameObjects.Text;
  private typer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('Intro');
  }

  init(data: Partial<IntroSceneData>): void {
    this.levelIndex = data.levelIndex ?? 0;
    const config = LEVELS[this.levelIndex];
    if (!config) throw new Error(`Fase inexistente: ${this.levelIndex}`);
    this.config = config;
    this.mentor = MENTORS[config.mentorId];
    this.lineIndex = 0;
    this.typer = null;
  }

  create(): void {
    const { width, height } = this.scale;
    const { palette } = this.config;
    this.cameras.main.setBackgroundColor(palette.sky).fadeIn(CAMERA.fadeMs);

    // fundo na paleta da fase: morros e chão
    const bg = this.add.graphics();
    bg.fillStyle(darken(palette.accent, 35)).fillEllipse(180, height - 60, 520, 260).fillEllipse(720, height - 40, 640, 240);
    bg.fillStyle(palette.ground).fillRect(0, height - 90, width, 90);
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0);
    this.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0);

    const stroke = { stroke: toCss(PALETTE.black), strokeThickness: 6 };
    this.add
      .text(width / 2, 52, this.config.title, { fontFamily: 'monospace', fontSize: '40px', fontStyle: 'bold', color: toCss(PALETTE.gold), ...stroke })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 94, this.config.era, { fontFamily: 'monospace', fontSize: '22px', color: toCss(PALETTE.cream), ...stroke })
      .setOrigin(0.5);

    // retrato em moldura
    const px = 60;
    const py = 140;
    this.add.rectangle(px - 6, py - 6, PORTRAIT.w + 12, PORTRAIT.h + 12, PALETTE.gold).setOrigin(0);
    this.add.image(px, py, mentorTextureKey(this.config.mentorId)).setOrigin(0);

    // caixa de fala
    this.add.rectangle(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PALETTE.black, 0.7).setOrigin(0).setStrokeStyle(4, PALETTE.gold);
    this.add
      .text(PANEL.x + 24, PANEL.y + 18, this.mentor.name, { fontFamily: 'monospace', fontSize: '24px', fontStyle: 'bold', color: toCss(PALETTE.gold) })
      .setOrigin(0);
    this.speech = this.add
      .text(PANEL.x + 24, PANEL.y + 66, '', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: toCss(PALETTE.cream),
        wordWrap: { width: PANEL.w - 48 },
        lineSpacing: 8,
      })
      .setOrigin(0);
    this.counter = this.add
      .text(PANEL.x + PANEL.w - 20, PANEL.y + PANEL.h - 16, '', { fontFamily: 'monospace', fontSize: '16px', color: toCss(PALETTE.cream) })
      .setOrigin(1, 1);

    const hint = this.add
      .text(width / 2, height - 52, INTRO_TEXTS.hint, { fontFamily: 'monospace', fontSize: '18px', color: toCss(PALETTE.cream), ...stroke })
      .setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    onKeys(this, CONFIRM_KEYS, () => this.advance());
    this.input.on('pointerdown', () => this.advance());
    this.startLine();
  }

  /** Primeiro aperto completa a fala que está sendo digitada; o seguinte avança */
  private advance(): void {
    const full = this.mentor.lines[this.lineIndex];
    if (this.typer) {
      this.finishTyping(full);
      return;
    }
    if (this.lineIndex < this.mentor.lines.length - 1) {
      this.lineIndex++;
      this.startLine();
    } else {
      goToScene(this, 'Game', { levelIndex: this.levelIndex });
    }
  }

  private startLine(): void {
    const full = this.mentor.lines[this.lineIndex];
    this.counter.setText(`${this.lineIndex + 1}/${this.mentor.lines.length}`);
    this.speech.setText('');
    let shown = 0;
    this.typer = this.time.addEvent({
      delay: TYPE_MS,
      repeat: full.length - 1,
      callback: () => {
        shown++;
        this.speech.setText(full.slice(0, shown));
        if (shown >= full.length) this.typer = null;
      },
    });
  }

  private finishTyping(full: string): void {
    this.typer?.remove(false);
    this.typer = null;
    this.speech.setText(full);
  }
}
