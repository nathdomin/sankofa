import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { gradientAt, type GradientStop } from '../art/colors';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { INTRO_TEXTS, MENTORS, SPEAKER_NAMES, STORIES, type Speaker, type StoryId, type StoryMood, type StoryScript } from '../data/texts';
import { DialogueBox, type DialogueLine } from '../systems/DialogueBox';
import { Portrait } from '../systems/Portrait';
import { goToScene } from '../systems/transitions';

export interface StorySceneData {
  storyId: StoryId;
  /** Cena que vem depois da história */
  next: { scene: string; data?: object };
}

const PANEL = { x: 300, y: 140, w: 620, h: 250 } as const;
const PORTRAIT_POS = { x: 60, y: 140 } as const;

// céu de cada clima da história
const SKIES: Record<StoryMood, readonly GradientStop[]> = {
  'present-dusk': [
    { at: 0, color: 0x151a3d },
    { at: 0.5, color: 0x4a3a78 },
    { at: 0.78, color: 0xc9657a },
    { at: 1, color: 0xf2a65a },
  ],
  time: [
    { at: 0, color: 0x0e0a1e },
    { at: 1, color: 0x2a1442 },
  ],
  'present-dawn': [
    { at: 0, color: 0x7fb8e6 },
    { at: 0.6, color: 0xf4d6a0 },
    { at: 1, color: 0xf6a96a },
  ],
};

/**
 * Cena de história: o protagonista (e o Sankofa, ou um mentor) falam numa caixa de diálogo, sobre um
 * fundo que muda conforme o momento (presente ao entardecer, viagem no tempo, presente ao amanhecer).
 */
export class StoryScene extends Phaser.Scene {
  private script!: StoryScript;
  private next!: StorySceneData['next'];

  constructor() {
    super('Story');
  }

  init(data: Partial<StorySceneData>): void {
    const script = data.storyId ? STORIES[data.storyId] : undefined;
    if (!script || !data.next) throw new Error('StoryScene precisa de storyId e next');
    this.script = script;
    this.next = data.next;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PALETTE.black).fadeIn(CAMERA.fadeMs);
    this.paintBackground(this.script.mood);
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);
    this.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);

    const stroke = { stroke: toCss(PALETTE.black), strokeThickness: 6 };
    this.add
      .text(width / 2, 52, this.script.title, { fontFamily: 'monospace', fontSize: '40px', fontStyle: 'bold', color: toCss(PALETTE.gold), ...stroke })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(width / 2, 94, this.script.subtitle, { fontFamily: 'monospace', fontSize: '22px', color: toCss(PALETTE.cream), ...stroke })
      .setOrigin(0.5)
      .setDepth(2);

    // retrato animado, trocado conforme quem fala
    const portrait = new Portrait(this, PORTRAIT_POS.x, PORTRAIT_POS.y);

    new DialogueBox(
      this,
      PANEL,
      this.script.lines.map((line) => ({ speaker: this.speakerName(line.speaker), text: line.text })),
      (_line: DialogueLine, index: number) => portrait.show(this.script.lines[index].speaker),
      () => goToScene(this, this.next.scene, this.next.data),
      (typing) => portrait.setTalking(typing),
    );

    const hint = this.add
      .text(width / 2, height - 52, INTRO_TEXTS.hint, { fontFamily: 'monospace', fontSize: '18px', color: toCss(PALETTE.cream), ...stroke })
      .setOrigin(0.5)
      .setDepth(6);
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
  }

  private speakerName(speaker: Speaker): string {
    return speaker === 'protagonista' || speaker === 'sankofa' ? SPEAKER_NAMES[speaker] : MENTORS[speaker].name;
  }

  private paintBackground(mood: StoryMood): void {
    const { width, height } = this.scale;
    const g = this.add.graphics().setDepth(0);
    const band = 6;
    for (let y = 0; y < height; y += band) g.fillStyle(gradientAt(SKIES[mood], y / height)).fillRect(0, y, width, band);

    if (mood === 'time') {
      // símbolo gigante e apagado girando devagar, com poeira dourada subindo
      const big = this.add.image(width / 2, height / 2, 'sankofa').setScale(22).setAlpha(0.14).setDepth(0);
      this.tweens.add({ targets: big, angle: 360, duration: 24000, repeat: -1 });
      this.add
        .particles(0, 0, 'mote', {
          x: { min: 0, max: width },
          y: { min: height, max: height + 20 },
          lifespan: { min: 4000, max: 7000 },
          speedY: { min: -70, max: -30 },
          speedX: { min: -12, max: 12 },
          scale: { start: 1.4, end: 0.4 },
          alpha: { start: 0.9, end: 0 },
          frequency: 90,
          blendMode: Phaser.BlendModes.ADD,
        })
        .setDepth(1);
      return;
    }

    const dusk = mood === 'present-dusk';
    const rng = new Phaser.Math.RandomDataGenerator([`story-${mood}`]);
    if (dusk) {
      for (let i = 0; i < 70; i++) g.fillStyle(0xffffff, rng.realInRange(0.25, 0.9)).fillRect(rng.between(0, width), rng.between(0, 280), 2, 2);
      g.fillStyle(0xf4ecd0).fillCircle(790, 120, 28);
      g.fillStyle(0x151a3d).fillCircle(802, 112, 26);
    } else {
      g.fillStyle(0xfff3c0, 0.45).fillCircle(780, 400, 78);
      g.fillStyle(0xfffbe6).fillCircle(780, 400, 46);
    }
    // silhueta da cidade e do chão
    const skyline = dusk ? 0x1d1936 : 0x7a6a80;
    let x = 0;
    while (x < width) {
      const w = rng.between(50, 110);
      const h = rng.between(60, 190);
      g.fillStyle(skyline).fillRect(x, height - 90 - h, w, h);
      for (let wy = height - 90 - h + 10; wy < height - 100; wy += 18) {
        for (let wx = x + 8; wx < x + w - 10; wx += 16) {
          if (rng.frac() < (dusk ? 0.3 : 0.08)) g.fillStyle(0xf2c879, dusk ? 0.85 : 0.5).fillRect(wx, wy, 6, 8);
        }
      }
      x += w + rng.between(0, 6);
    }
    g.fillStyle(dusk ? 0x120f1f : 0x3d5a40).fillRect(0, height - 90, width, 90);
    g.fillStyle(dusk ? 0x2a2440 : 0x56795a).fillRect(0, height - 90, width, 4);
  }
}
