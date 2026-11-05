import Phaser from 'phaser';
import { audio } from '../systems/audio/AudioManager';
import { BAND_H } from '../art/hudArt';
import { GINGA_FRAMES, playerTextureKey } from '../art/playerArt';
import { PALETTE, toCss } from '../config/palette';
import { CAMERA, CAPOEIRA } from '../config/physics';
import { LEVELS, type LevelConfig } from '../data/levels';
import { INTRO_TEXTS, MENTORS, type Mentor } from '../data/texts';
import { DialogueBox } from '../systems/DialogueBox';
import { Portrait } from '../systems/Portrait';
import { buildLevel } from '../systems/LevelBuilder';
import { addParallax, decorateLevel, type ParallaxUpdater } from '../systems/Scenery';
import { goToScene } from '../systems/transitions';

export interface IntroSceneData {
  levelIndex: number;
}

// acima do cenário da fase (o primeiro plano fica em 50)
const UI_DEPTH = 60;
const PANEL = { x: 300, y: 140, w: 620, h: 250, depth: UI_DEPTH } as const;

/**
 * O mentor apresenta a fase: o fundo é o começo da própria fase (céu, camadas, chão e marcos do mapa de
 * verdade, com o protagonista parado no ponto de partida), o retrato animado do mentor e as falas
 * avançadas com Enter/Espaço.
 */
export class IntroScene extends Phaser.Scene {
  private levelIndex = 0;
  private config!: LevelConfig;
  private mentor!: Mentor;
  private parallax!: ParallaxUpdater;

  constructor() {
    super('Intro');
  }

  init(data: Partial<IntroSceneData>): void {
    this.levelIndex = data.levelIndex ?? 0;
    const config = LEVELS[this.levelIndex];
    if (!config) throw new Error(`Fase inexistente: ${this.levelIndex}`);
    this.config = config;
    this.mentor = MENTORS[config.mentorId];
  }

  create(): void {
    const { width, height } = this.scale;
    const cam = this.cameras.main;
    cam.setBackgroundColor(this.config.palette.sky).fadeIn(CAMERA.fadeMs);
    audio.playMusic(this.config.music);

    // o cenário é o da fase: monta o mapa de verdade e enquadra o ponto de partida, como no jogo
    this.parallax = addParallax(this, this.config);
    const level = buildLevel(this, this.config);
    decorateLevel(this, this.config);
    cam.setScroll(0, Math.max(0, level.heightPx - height));
    this.showHero(level.playerSpawn);
    this.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0).setDepth(100);
    this.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0).setDepth(100);

    const stroke = { stroke: toCss(PALETTE.black), strokeThickness: 6 };
    this.add
      .text(width / 2, 52, this.config.title, { fontFamily: 'monospace', fontSize: '40px', fontStyle: 'bold', color: toCss(PALETTE.gold), ...stroke })
      .setOrigin(0.5)
      .setDepth(101);
    this.add
      .text(width / 2, 94, this.config.era, { fontFamily: 'monospace', fontSize: '22px', color: toCss(PALETTE.cream), ...stroke })
      .setOrigin(0.5)
      .setDepth(101);

    // retrato animado do mentor: respira, pisca e mexe a boca enquanto fala
    const portrait = new Portrait(this, 60, 140, UI_DEPTH);
    portrait.show(this.config.mentorId);

    // caixa de fala do mentor
    new DialogueBox(
      this,
      PANEL,
      this.mentor.lines.map((text) => ({ speaker: this.mentor.name, text })),
      undefined,
      () => goToScene(this, 'Game', { levelIndex: this.levelIndex }),
      (typing) => portrait.setTalking(typing),
    );

    const hint = this.add
      .text(width / 2, height - 52, INTRO_TEXTS.hint, { fontFamily: 'monospace', fontSize: '18px', color: toCss(PALETTE.cream), ...stroke })
      .setOrigin(0.5)
      .setDepth(101);
    this.tweens.add({ targets: hint, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });
  }

  update(_time: number, delta: number): void {
    this.parallax(this.cameras.main, delta);
  }

  /** O protagonista espera no ponto de partida da fase, na ginga */
  private showHero(spawn: { x: number; y: number }): void {
    const hero = this.add.sprite(spawn.x, spawn.y, playerTextureKey(GINGA_FRAMES[0])).setOrigin(0.5, 1).setDepth(10);
    this.time.addEvent({
      delay: CAPOEIRA.ginga.frameMs,
      loop: true,
      callback: () => hero.setTexture(playerTextureKey(GINGA_FRAMES[Math.floor(this.time.now / CAPOEIRA.ginga.frameMs) % GINGA_FRAMES.length])),
    });
  }
}
