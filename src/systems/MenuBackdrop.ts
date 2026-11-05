import Phaser from 'phaser';
import { BAND_H } from '../art/hudArt';
import { HILLS_H, MID_H, SUN } from '../art/themes/quilombo';

// quanto cada camada anda sozinha, em px por ms
const DRIFT = { clouds: 0.012, hills: 0.004, mid: 0.009 } as const;

// véu escuro à esquerda, onde ficam o título e as opções
const SCRIM = { width: 620, maxAlpha: 0.82, step: 6 } as const;

/** Véu em degradê horizontal: opaco na borda esquerda e transparente à direita, onde ficam título e opções */
export function addLeftScrim(scene: Phaser.Scene, depth: number, maxAlpha: number = SCRIM.maxAlpha): void {
  const { height } = scene.scale;
  const scrim = scene.add.graphics().setDepth(depth);
  for (let x = 0; x < SCRIM.width; x += SCRIM.step) {
    const t = 1 - x / SCRIM.width;
    scrim.fillStyle(0x0d0a14, maxAlpha * t * t).fillRect(x, 0, SCRIM.step, height);
  }
}

/**
 * Pano de fundo comum dos menus (principal, fases, como jogar): o cenário da fase 1 em movimento lento,
 * um véu escuro à esquerda para o texto ler bem e a faixa decorativa no topo e na base.
 * Devolve a função de atualização, para chamar no `update` da cena.
 */
export function addMenuBackdrop(scene: Phaser.Scene): (delta: number) => void {
  const { width, height } = scene.scale;

  scene.add.image(0, 0, 'sky-quilombo').setOrigin(0);
  const glow = scene.add.image(SUN.x, SUN.y, 'sunglow-quilombo');
  scene.tweens.add({ targets: glow, alpha: { from: 0.7, to: 1 }, scale: { from: 0.95, to: 1.08 }, duration: 3200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
  const clouds = scene.add.tileSprite(0, 0, width, 330, 'clouds-quilombo').setOrigin(0);
  const hills = scene.add.tileSprite(0, height - HILLS_H, width, HILLS_H, 'hills-quilombo').setOrigin(0);
  const mid = scene.add.tileSprite(0, height - MID_H, width, MID_H, 'mid-quilombo').setOrigin(0);

  addLeftScrim(scene, 1);

  scene.add.tileSprite(0, 0, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);
  scene.add.tileSprite(0, height - BAND_H, width, BAND_H, 'hud-band').setOrigin(0).setDepth(5);

  return (delta) => {
    clouds.tilePositionX += DRIFT.clouds * delta;
    hills.tilePositionX += DRIFT.hills * delta;
    mid.tilePositionX += DRIFT.mid * delta;
  };
}
