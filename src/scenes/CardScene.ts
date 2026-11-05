import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { PALETTE, darken, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { LEVELS, type LevelConfig } from '../data/levels';
import { CARDS, CARD_TEXTS, LINK_STORY, type HistoricalCard } from '../data/texts';
import { CONFIRM_KEYS, onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';
import type { StorySceneData } from './StoryScene';

export interface CardSceneData {
  levelIndex: number;
}

const CARD = { x: 120, y: 60, w: 720, h: 380 } as const;

/** Carta histórica ao fim de cada fase. Enter leva à próxima fase ou, na última, à tela final */
export class CardScene extends Phaser.Scene {
  private levelIndex = 0;
  private config!: LevelConfig;
  private card!: HistoricalCard;

  constructor() {
    super('Card');
  }

  init(data: Partial<CardSceneData>): void {
    this.levelIndex = data.levelIndex ?? 0;
    const config = LEVELS[this.levelIndex];
    if (!config) throw new Error(`Fase inexistente: ${this.levelIndex}`);
    this.config = config;
    this.card = CARDS[config.mentorId];
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(darken(this.config.palette.sky, 55)).fadeIn(CAMERA.fadeMs);
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0);
    this.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0);

    // cartão centralizado, com a faixa decorativa no alto
    this.add.rectangle(CARD.x, CARD.y, CARD.w, CARD.h, PALETTE.cream).setOrigin(0).setStrokeStyle(6, PALETTE.gold);
    this.add.tileSprite(CARD.x + 6, CARD.y + 6, CARD.w - 12, BAND_H, 'hud-band').setOrigin(0);

    this.add
      .text(width / 2, CARD.y + 56, this.card.title, {
        fontFamily: 'monospace',
        fontSize: '32px',
        fontStyle: 'bold',
        color: toCss(PALETTE.black),
        align: 'center',
        wordWrap: { width: CARD.w - 80 },
      })
      .setOrigin(0.5);
    this.add
      .text(CARD.x + 40, CARD.y + 100, this.card.body, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: toCss(darken(PALETTE.earth, 40)),
        wordWrap: { width: CARD.w - 80 },
        lineSpacing: 8,
      })
      .setOrigin(0);

    const hint = this.add
      .text(width / 2, CARD.y + CARD.h + 38, CARD_TEXTS.hint, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: toCss(PALETTE.cream),
        stroke: toCss(PALETTE.black),
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    onKeys(this, CONFIRM_KEYS, () => this.next());
  }

  private next(): void {
    const nextLevel = this.levelIndex + 1;
    const hasNext = nextLevel < LEVELS.length;
    // entre as fases passa uma cena de história; depois da última, o epílogo
    const storyId = hasNext ? LINK_STORY[this.levelIndex] : 'epilogo';
    const next = hasNext ? { scene: 'Intro', data: { levelIndex: nextLevel } } : { scene: 'Victory' };
    if (storyId) goToScene(this, 'Story', { storyId, next } satisfies StorySceneData);
    else goToScene(this, next.scene, next.data);
  }
}
