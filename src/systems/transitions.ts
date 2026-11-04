import Phaser from 'phaser';
import { CAMERA } from '../config/physics';

/**
 * Troca de cena com fade-out da câmera; ignora chamadas enquanto já está em transição.
 * `beforeStart` roda ao fim do fade, antes de iniciar a próxima cena (ex.: encerrar outra cena).
 */
export function goToScene(scene: Phaser.Scene, key: string, data?: object, beforeStart?: () => void): void {
  const cam = scene.cameras.main;
  if (cam.fadeEffect.isRunning) return;
  cam.fadeOut(CAMERA.fadeMs);
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    beforeStart?.();
    scene.scene.start(key, data);
  });
}
