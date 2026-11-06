import Phaser from 'phaser';
import { WORLD } from './config/physics';
import { TOUCH } from './config/touch';
import { audio } from './systems/audio/AudioManager';
import { setupMobile } from './systems/mobile';
import { touchInput } from './systems/TouchInput';
import { TouchControlsScene } from './scenes/TouchControlsScene';
import { AudioUiScene } from './scenes/AudioUiScene';
import { BootScene } from './scenes/BootScene';
import { CardScene } from './scenes/CardScene';
import { EnemiesScene } from './scenes/EnemiesScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HelpScene } from './scenes/HelpScene';
import { HudScene } from './scenes/HudScene';
import { IntroScene } from './scenes/IntroScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';
import { StoryScene } from './scenes/StoryScene';
import { VictoryScene } from './scenes/VictoryScene';

// ?debug na URL mostra as hitboxes do Arcade
const debug = new URLSearchParams(window.location.search).has('debug');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#1a1a1a',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: WORLD.gravity },
      debug,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // vários dedos ao mesmo tempo (correr e pular) nos botões de toque
  input: { activePointers: TOUCH.activePointers },
  // TouchControls fica acima do jogo e do HUD, abaixo da Pausa
  scene: [BootScene, MenuScene, LevelSelectScene, HelpScene, StoryScene, EnemiesScene, IntroScene, GameScene, HudScene, TouchControlsScene, CardScene, VictoryScene, GameOverScene, PauseScene, AudioUiScene],
};

declare global {
  interface Window {
    __sankofa?: Phaser.Game;
    __audio?: typeof audio;
  }
}

audio.init();
const game = new Phaser.Game(config);
if (touchInput.enabled) setupMobile(game);
// acesso pelo console para testes, só em desenvolvimento
if (import.meta.env.DEV) {
  window.__sankofa = game;
  window.__audio = audio;
}
