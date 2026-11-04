import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { PALETTE, toCss } from '../config/palette';
import { GAME } from '../config/physics';
import { LEVELS, type LevelConfig } from '../data/levels';
import { GAME_EVENTS, gameState } from '../systems/GameState';

export interface HudSceneData {
  levelIndex: number;
}

const PANEL_H = 56;
const ROW_Y = 36;

/** HUD em cena própria, rodando por cima da GameScene: lê o GameState e reage aos eventos dele */
export class HudScene extends Phaser.Scene {
  private config!: LevelConfig;
  private lifeIcons: Phaser.GameObjects.Image[] = [];
  private counterText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super('Hud');
  }

  init(data: Partial<HudSceneData>): void {
    const config = LEVELS[data.levelIndex ?? 0];
    if (!config) throw new Error(`Fase inexistente: ${data.levelIndex}`);
    this.config = config;
    this.lifeIcons = [];
  }

  create(): void {
    const { width } = this.scale;
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: toCss(PALETTE.cream),
      stroke: toCss(PALETTE.black),
      strokeThickness: 4,
    };

    // fundo translúcido para o texto ler bem sobre qualquer cenário, com a faixa decorativa no topo
    this.add.rectangle(0, 0, width, PANEL_H, PALETTE.black, 0.45).setOrigin(0).setDepth(0);
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0).setDepth(1);

    for (let i = 0; i < GAME.startLives; i++) {
      this.lifeIcons.push(this.add.image(16 + i * 26, ROW_Y, 'life-heart').setOrigin(0, 0.5).setDepth(2));
    }

    this.add.image(120, ROW_Y, this.config.collectible.texture).setDepth(2);
    this.counterText = this.add.text(138, ROW_Y, '', style).setOrigin(0, 0.5).setDepth(2);

    this.scoreText = this.add.text(width / 2, ROW_Y, '', style).setOrigin(0.5).setDepth(2);
    this.add
      .text(width - 16, ROW_Y, `${this.config.title} · ${this.config.era}`, style)
      .setOrigin(1, 0.5)
      .setDepth(2);

    this.refresh();
    const events = [GAME_EVENTS.lives, GAME_EVENTS.score, GAME_EVENTS.collected];
    events.forEach((name) => gameState.on(name, this.refresh, this));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      events.forEach((name) => gameState.off(name, this.refresh, this));
    });
  }

  private refresh(): void {
    const { required } = this.config;
    this.lifeIcons.forEach((icon, i) => icon.setAlpha(i < gameState.lives ? 1 : 0.25));

    const count = required > 0 ? `${gameState.collected}/${required}` : `${gameState.collected}`;
    this.setTextPop(this.counterText, count);
    this.setTextPop(this.scoreText, `Pontos: ${gameState.score}`);
  }

  /** Atualiza o texto e dá um pulinho quando o valor muda */
  private setTextPop(text: Phaser.GameObjects.Text, value: string): void {
    if (text.text === value) return;
    const first = text.text === '';
    text.setText(value);
    if (first) return;
    this.tweens.killTweensOf(text);
    text.setScale(1.25);
    this.tweens.add({ targets: text, scale: 1, duration: 200, ease: 'Back.easeOut' });
  }
}
