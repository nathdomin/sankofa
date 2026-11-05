import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { PALETTE, darken, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { LEVELS, type LevelConfig } from '../data/levels';
import { CARDS, CARD_TEXTS, LINK_STORY, type HistoricalCard } from '../data/texts';
import { gameState } from '../systems/GameState';
import { Portrait } from '../systems/Portrait';
import { CONFIRM_KEYS, onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';
import type { StorySceneData } from './StoryScene';

export interface CardSceneData {
  levelIndex: number;
}

const CARD = { x: 50, y: 40, w: 860, h: 430 } as const;
const TEXT_X = 330;

/** Carta histórica ao fim de cada fase. Enter leva à próxima fase ou, na última, ao epílogo */
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
    this.cameras.main.setBackgroundColor(darken(this.config.palette.sky, 60)).fadeIn(CAMERA.fadeMs);
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);
    this.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);

    // tudo o que compõe a carta entra num contêiner, que sobe com um quique ao abrir a cena
    const card = this.add.container(0, 0).setDepth(1);
    card.add(this.add.rectangle(CARD.x + 8, CARD.y + 10, CARD.w, CARD.h, PALETTE.black, 0.35).setOrigin(0)); // sombra
    card.add(this.add.rectangle(CARD.x, CARD.y, CARD.w, CARD.h, PALETTE.cream).setOrigin(0).setStrokeStyle(6, PALETTE.gold));
    card.add(this.add.tileSprite(CARD.x + 6, CARD.y + 6, CARD.w - 12, BAND_H, 'hud-band').setOrigin(0));
    card.add(this.add.tileSprite(CARD.x + 6, CARD.y + CARD.h - 6 - BAND_H, CARD.w - 12, BAND_H, 'hud-band').setOrigin(0));

    // nome e datas: "Luiz Gama (1830–1882)" vira nome grande e datas pequenas
    const match = /^(.*?)\s*\((.*)\)$/.exec(this.card.title);
    const name = match ? match[1] : this.card.title;
    const dates = match ? match[2] : this.config.era;
    card.add(
      this.add
        .text(TEXT_X, CARD.y + 56, name, { fontFamily: 'monospace', fontSize: '34px', fontStyle: 'bold', color: toCss(PALETTE.black), wordWrap: { width: CARD.x + CARD.w - 40 - TEXT_X } })
        .setOrigin(0, 0.5),
    );
    card.add(this.add.text(TEXT_X, CARD.y + 90, dates, { fontFamily: 'monospace', fontSize: '18px', color: toCss(darken(PALETTE.earth, 20)) }).setOrigin(0, 0.5));
    card.add(this.add.rectangle(TEXT_X, CARD.y + 112, 120, 4, PALETTE.gold).setOrigin(0, 0.5));
    card.add(
      this.add
        .text(TEXT_X, CARD.y + 128, this.card.body, {
          fontFamily: 'monospace',
          fontSize: '19px',
          color: toCss(darken(PALETTE.earth, 40)),
          wordWrap: { width: CARD.x + CARD.w - 40 - TEXT_X },
          lineSpacing: 6,
        })
        .setOrigin(0),
    );

    // placar da fase: coletáveis e pontos
    const total = this.config.map.join('').split('C').length - 1;
    const statsY = CARD.y + CARD.h - 80;
    card.add(this.add.rectangle(TEXT_X, statsY, CARD.x + CARD.w - 40 - TEXT_X, 2, darken(PALETTE.cream, 25)).setOrigin(0, 0.5));
    card.add(this.add.image(TEXT_X + 14, statsY + 26, this.config.collectible.texture).setScale(1.4));
    card.add(
      this.add
        .text(TEXT_X + 38, statsY + 26, `${gameState.collected} de ${total} ${this.config.collectible.namePlural}`, { fontFamily: 'monospace', fontSize: '20px', fontStyle: 'bold', color: toCss(darken(PALETTE.earth, 40)) })
        .setOrigin(0, 0.5),
    );
    card.add(
      this.add
        .text(CARD.x + CARD.w - 40, statsY + 26, `Pontos: ${gameState.score}`, { fontFamily: 'monospace', fontSize: '20px', fontStyle: 'bold', color: toCss(darken(PALETTE.earth, 40)) })
        .setOrigin(1, 0.5),
    );

    // progresso da jornada: um coração por fase, dourado até a fase que acabou de terminar
    LEVELS.forEach((_level, i) => {
      const heart = this.add.image(CARD.x + CARD.w - 40 - (LEVELS.length - 1 - i) * 34, CARD.y + 56, 'sankofa').setScale(1.4);
      if (i > this.levelIndex) heart.setTint(0x8a8a8a).setAlpha(0.45);
      card.add(heart);
    });

    // retrato do mentor, com a mesma animação das falas (respira e pisca)
    const portrait = new Portrait(this, CARD.x + 40, CARD.y + 70, 2);
    portrait.show(this.config.mentorId);

    const hint = this.add
      .text(width / 2, CARD.y + CARD.h + 32, CARD_TEXTS.hint, { fontFamily: 'monospace', fontSize: '20px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(3);
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    // entrada: a carta sobe e o retrato aparece junto
    card.setY(50).setAlpha(0);
    this.tweens.add({ targets: card, y: 0, alpha: 1, duration: 520, ease: 'Back.easeOut' });

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
