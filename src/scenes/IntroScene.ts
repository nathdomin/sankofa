import Phaser from 'phaser';
import { audio } from '../systems/audio/AudioManager';
import { BAND_H } from '../art/hudArt';
import { PALETTE, darken, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { LEVELS, type LevelConfig } from '../data/levels';
import { INTRO_TEXTS, MENTORS, type Mentor } from '../data/texts';
import { DialogueBox } from '../systems/DialogueBox';
import { Portrait } from '../systems/Portrait';
import { goToScene } from '../systems/transitions';

export interface IntroSceneData {
  levelIndex: number;
}

const PANEL = { x: 300, y: 140, w: 620, h: 250 } as const;

/** O mentor apresenta a fase: retrato em silhueta e 2–3 falas avançadas com Enter/Espaço */
export class IntroScene extends Phaser.Scene {
  private levelIndex = 0;
  private config!: LevelConfig;
  private mentor!: Mentor;

  constructor() {
    super('Intro');
  }

  init(data: Partial<IntroSceneData>): void {
    this.levelIndex = data.levelIndex ?? 0;
    const config = LEVELS[this.levelIndex];
    if (!config) throw new Error(`Fase inexistente: ${this.levelIndex}`);
    this.config = config;
    this.mentor = MENTORS[config.mentorId];
  }

  create(): void {
    const { width, height } = this.scale;
    const { palette } = this.config;
    this.cameras.main.setBackgroundColor(palette.sky).fadeIn(CAMERA.fadeMs);
    audio.playMusic(this.config.music);

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

    // retrato animado do mentor: respira, pisca e mexe a boca enquanto fala
    const portrait = new Portrait(this, 60, 140);
    portrait.show(this.config.mentorId);

    // caixa de fala do mentor
    new DialogueBox(
      this,
      PANEL,
      this.mentor.lines.map((text) => ({ speaker: this.mentor.name, text })),
      undefined,
      () => goToScene(this, 'Game', { levelIndex: this.levelIndex }),
      (typing) => portrait.setTalking(typing),
    );

    const hint = this.add
      .text(width / 2, height - 52, INTRO_TEXTS.hint, { fontFamily: 'monospace', fontSize: '18px', color: toCss(PALETTE.cream), ...stroke })
      .setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
  }
}
