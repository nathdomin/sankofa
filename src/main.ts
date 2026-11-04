import Phaser from 'phaser';
import { WORLD } from './config/physics';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { IntroScene } from './scenes/IntroScene';
import { MenuScene } from './scenes/MenuScene';

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
  scene: [BootScene, MenuScene, IntroScene, GameScene, HudScene, GameOverScene],
};

declare global {
  interface Window {
    __sankofa?: Phaser.Game;
  }
}

const game = new Phaser.Game(config);
// acesso pelo console para testes, só em desenvolvimento
if (import.meta.env.DEV) window.__sankofa = game;
