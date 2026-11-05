import Phaser from 'phaser';
import { WORLD } from './config/physics';
import { BootScene } from './scenes/BootScene';
import { CardScene } from './scenes/CardScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { IntroScene } from './scenes/IntroScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';
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
  scene: [BootScene, MenuScene, LevelSelectScene, IntroScene, GameScene, HudScene, CardScene, VictoryScene, GameOverScene, PauseScene],
};

declare global {
  interface Window {
    __sankofa?: Phaser.Game;
  }
}

const game = new Phaser.Game(config);
// acesso pelo console para testes, só em desenvolvimento
if (import.meta.env.DEV) window.__sankofa = game;
