import Phaser from 'phaser';
import { GAME } from '../config/physics';

export const GAME_EVENTS = {
  lives: 'lives-changed',
  score: 'score-changed',
  collected: 'collected-changed',
} as const;

/**
 * Estado da partida, compartilhado entre cenas (GameScene, HudScene, GameOver...).
 * Emite eventos para a HUD reagir sem precisar consultar a cada frame.
 */
class GameState extends Phaser.Events.EventEmitter {
  lives: number = GAME.startLives;
  score = 0;
  levelIndex = 0;
  /** Coletáveis pegos na fase atual */
  collected = 0;

  /** Nova partida do zero */
  reset(): void {
    this.lives = GAME.startLives;
    this.score = 0;
    this.levelIndex = 0;
    this.collected = 0;
    this.emit(GAME_EVENTS.lives, this.lives);
    this.emit(GAME_EVENTS.score, this.score);
    this.emit(GAME_EVENTS.collected, this.collected);
  }

  /** Entra numa fase: mantém vidas e pontos, zera os coletáveis da fase */
  startLevel(levelIndex: number): void {
    this.levelIndex = levelIndex;
    this.collected = 0;
    this.emit(GAME_EVENTS.collected, this.collected);
  }

  /** Retorna true se ainda restam vidas */
  loseLife(): boolean {
    this.lives = Math.max(0, this.lives - 1);
    this.emit(GAME_EVENTS.lives, this.lives);
    return this.lives > 0;
  }

  addScore(points: number): void {
    this.score += points;
    this.emit(GAME_EVENTS.score, this.score);
  }

  addCollected(): void {
    this.collected += 1;
    this.emit(GAME_EVENTS.collected, this.collected);
  }
}

export const gameState = new GameState();
