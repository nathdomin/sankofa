import Phaser from 'phaser';
import { audio } from '../systems/audio/AudioManager';
import { BAND_H } from '../art/hudArt';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { MENU_TEXTS } from '../data/texts';
import { gameState } from '../systems/GameState';
import { addMenuBackdrop } from '../systems/MenuBackdrop';
import { OptionList } from '../systems/OptionList';
import { goToScene } from '../systems/transitions';
import type { StorySceneData } from './StoryScene';

const LEFT = 84;

/** Menu principal: título à esquerda, três opções e o símbolo Sankofa flutuando à direita */
export class MenuScene extends Phaser.Scene {
  private updateBackdrop!: (delta: number) => void;

  constructor() {
    super('Menu');
  }

  create(): void {
    const { height } = this.scale;
    this.cameras.main.fadeIn(CAMERA.fadeMs);
    this.updateBackdrop = addMenuBackdrop(this);
    audio.playMusic('roda');

    // símbolo Sankofa grande, com halo, à direita
    const cx = 715; // centro do espaço livre à direita do texto
    const cy = 272;
    const halo = this.add.graphics().setDepth(0);
    for (let r = 170; r > 36; r -= 14) halo.fillStyle(0xffd36a, 0.035).fillCircle(cx, cy, r);
    const heart = this.add.image(cx, cy, 'sankofa').setScale(10).setDepth(2);
    this.tweens.add({ targets: heart, y: cy - 12, duration: 1800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    this.tweens.add({ targets: halo, alpha: { from: 0.7, to: 1 }, duration: 2400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    // título e subtítulo, separados pela faixa de padrão geométrico
    this.add
      .text(LEFT, 128, MENU_TEXTS.title, {
        fontFamily: 'monospace',
        fontSize: '92px',
        fontStyle: 'bold',
        color: toCss(PALETTE.gold),
        stroke: toCss(PALETTE.black),
        strokeThickness: 10,
      })
      .setOrigin(0, 0.5)
      .setDepth(2);
    this.add.tileSprite(LEFT, 196, 330, BAND_H, 'hud-band').setOrigin(0, 0.5).setDepth(2);
    this.add
      .text(LEFT, 228, MENU_TEXTS.subtitle, { fontFamily: 'monospace', fontSize: '26px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 5 })
      .setOrigin(0, 0.5)
      .setDepth(2);

    new OptionList(
      this,
      LEFT + 22,
      326,
      [
        { label: MENU_TEXTS.play, action: () => this.play() },
        { label: MENU_TEXTS.levels, action: () => goToScene(this, 'LevelSelect') },
        { label: MENU_TEXTS.help, action: () => goToScene(this, 'Help') },
      ],
      { align: 'left', spacing: 56, fontSize: 32, depth: 3 },
    );

    this.add
      .text(LEFT, height - 44, MENU_TEXTS.tagline, { fontFamily: 'monospace', fontSize: '16px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 4 })
      .setOrigin(0, 0.5)
      .setDepth(6)
      .setAlpha(0.9);
  }

  update(_time: number, delta: number): void {
    this.updateBackdrop(delta);
  }

  private play(): void {
    gameState.reset();
    // o jogo começa pelo prólogo; a escolha de fase pula direto para a Intro
    goToScene(this, 'Story', { storyId: 'prologo', next: { scene: 'Intro', data: { levelIndex: 0 } } } satisfies StorySceneData);
  }
}
