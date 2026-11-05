import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { HILLS_H, MID_H, SUN } from '../art/themes/quilombo';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { MENU_TEXTS } from '../data/texts';
import { gameState } from '../systems/GameState';
import { CONFIRM_KEYS, onKeys } from '../systems/sceneInput';
import { goToScene } from '../systems/transitions';
import type { StorySceneData } from './StoryScene';

const CLOUD_DRIFT = 0.012; // px por ms

export class MenuScene extends Phaser.Scene {
  private clouds!: Phaser.GameObjects.TileSprite;

  constructor() {
    super('Menu');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(CAMERA.fadeMs);

    // cenário da fase 1 como pano de fundo
    this.add.image(0, 0, 'sky-quilombo').setOrigin(0);
    this.add.image(SUN.x, SUN.y, 'sunglow-quilombo');
    this.clouds = this.add.tileSprite(0, 0, width, 330, 'clouds-quilombo').setOrigin(0);
    this.add.image(0, height - HILLS_H, 'hills-quilombo').setOrigin(0);
    this.add.image(0, height - MID_H, 'mid-quilombo').setOrigin(0);

    // faixa decorativa no topo e na base
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);
    this.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);

    const heart = this.add.image(width / 2, 100, 'sankofa').setScale(4).setDepth(2);
    this.tweens.add({ targets: heart, y: 92, duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    this.add
      .text(width / 2, 200, MENU_TEXTS.title, {
        fontFamily: 'monospace',
        fontSize: '96px',
        fontStyle: 'bold',
        color: toCss(PALETTE.gold),
        stroke: toCss(PALETTE.black),
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(width / 2, 270, MENU_TEXTS.subtitle, {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: toCss(PALETTE.cream),
        stroke: toCss(PALETTE.black),
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.createPlayButton(width / 2, 355);

    const small: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: toCss(PALETTE.cream),
      stroke: toCss(PALETTE.black),
      strokeThickness: 4,
    };
    this.add.text(width / 2, 428, MENU_TEXTS.controls, small).setOrigin(0.5).setDepth(2);
    this.createLevelsButton(width / 2, 466);
    this.add.text(width / 2, height - 36, MENU_TEXTS.tagline, { ...small, fontSize: '18px' }).setOrigin(0.5).setDepth(6);

    onKeys(this, CONFIRM_KEYS, () => this.play());
    onKeys(this, ['F'], () => this.openLevels());
  }

  /** Botão secundário que abre a tela de escolha de fase */
  private createLevelsButton(x: number, y: number): void {
    const box = this.add
      .rectangle(x, y, 260, 34, PALETTE.black, 0.7)
      .setStrokeStyle(2, PALETTE.gold)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y, MENU_TEXTS.levels, { fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: toCss(PALETTE.cream) })
      .setOrigin(0.5)
      .setDepth(3);
    box.on('pointerover', () => {
      box.setFillStyle(PALETTE.gold, 1);
      label.setColor(toCss(PALETTE.black));
    });
    box.on('pointerout', () => {
      box.setFillStyle(PALETTE.black, 0.7);
      label.setColor(toCss(PALETTE.cream));
    });
    box.on('pointerdown', () => this.openLevels());
  }

  private openLevels(): void {
    goToScene(this, 'LevelSelect');
  }

  update(_time: number, delta: number): void {
    this.clouds.tilePositionX += CLOUD_DRIFT * delta;
  }

  private createPlayButton(x: number, y: number): void {
    const button = this.add
      .rectangle(x, y, 260, 60, PALETTE.gold)
      .setStrokeStyle(4, PALETTE.black)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y - 2, MENU_TEXTS.play, {
        fontFamily: 'monospace',
        fontSize: '34px',
        fontStyle: 'bold',
        color: toCss(PALETTE.black),
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.add
      .text(x, y + 48, MENU_TEXTS.hint, { fontFamily: 'monospace', fontSize: '16px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(2);

    this.tweens.add({ targets: [button, label], scale: 1.05, duration: 700, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    button.on('pointerdown', () => this.play());
  }

  private play(): void {
    gameState.reset();
    // o jogo começa pelo prólogo; a escolha de fase pula direto para a Intro
    goToScene(this, 'Story', { storyId: 'prologo', next: { scene: 'Intro', data: { levelIndex: 0 } } } satisfies StorySceneData);
  }
}
