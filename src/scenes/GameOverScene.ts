import Phaser from 'phaser';
import { audio } from '../systems/audio/AudioManager';
import { BAND_H } from '../art/hudArt';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA } from '../config/physics';
import { GAME_OVER_TEXTS } from '../data/texts';
import { gameState } from '../systems/GameState';
import { addMenuBackdrop } from '../systems/MenuBackdrop';
import { OptionList } from '../systems/OptionList';
import { goToScene } from '../systems/transitions';

export interface GameOverSceneData {
  levelIndex: number;
}

const LEFT = 84;

export class GameOverScene extends Phaser.Scene {
  private levelIndex = 0;
  private updateBackdrop!: (delta: number) => void;

  constructor() {
    super('GameOver');
  }

  init(data: Partial<GameOverSceneData>): void {
    this.levelIndex = data.levelIndex ?? 0;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(CAMERA.fadeMs);
    audio.stopMusic(0.2);
    audio.play('gameover');
    this.updateBackdrop = addMenuBackdrop(this);
    // o cenário do menu, mais escuro e sem cor: o momento é de pausa e recomeço, não de punição
    this.add.rectangle(0, 0, width, height, PALETTE.black, 0.5).setOrigin(0).setDepth(2);

    // o símbolo Sankofa apagado à direita: o caminho continua, é só voltar e buscar
    const heart = this.add.image(790, 270, 'sankofa').setScale(10).setTint(0x8a8a8a).setAlpha(0.55).setDepth(3);
    this.tweens.add({ targets: heart, y: 262, duration: 2200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    this.add
      .text(LEFT, 130, GAME_OVER_TEXTS.title, { fontFamily: 'monospace', fontSize: '72px', fontStyle: 'bold', color: toCss(PALETTE.gold), stroke: toCss(PALETTE.black), strokeThickness: 9 })
      .setOrigin(0, 0.5)
      .setDepth(4);
    this.add.tileSprite(LEFT, 186, 280, BAND_H, 'hud-band').setOrigin(0, 0.5).setDepth(4);
    this.add
      .text(LEFT, 222, GAME_OVER_TEXTS.subtitle, { fontFamily: 'monospace', fontSize: '20px', color: toCss(PALETTE.cream), stroke: toCss(PALETTE.black), strokeThickness: 4, wordWrap: { width: 560 } })
      .setOrigin(0, 0.5)
      .setDepth(4);

    new OptionList(
      this,
      LEFT + 22,
      330,
      [
        {
          label: GAME_OVER_TEXTS.retry,
          // recomeça a fase com as vidas cheias e a pontuação de quando ela começou
          action: () => {
            gameState.restoreLevelStart();
            goToScene(this, 'Intro', { levelIndex: this.levelIndex });
          },
        },
        { label: GAME_OVER_TEXTS.menu, action: () => goToScene(this, 'Menu') },
      ],
      { align: 'left', spacing: 56, fontSize: 28, depth: 4 },
    );
  }

  update(_time: number, delta: number): void {
    this.updateBackdrop(delta);
  }
}
