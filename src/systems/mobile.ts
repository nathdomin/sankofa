import Phaser from 'phaser';
import { TOUCH_TEXTS } from '../data/texts';

interface LockableOrientation {
  lock?: (orientation: 'landscape') => Promise<void>;
}

/**
 * Ajustes para o celular: liga o aviso "gire o celular" (CSS em index.html, classe `touch`)
 * e, a cada toque fora da tela cheia, tenta entrar nela e travar a tela deitada.
 * No iPhone a tela cheia não existe para páginas: o jogo roda com as barras do Safari.
 */
export function setupMobile(game: Phaser.Game): void {
  document.documentElement.classList.add('touch');
  const message = document.querySelector('#rotate p');
  if (message) message.textContent = TOUCH_TEXTS.rotate;

  // precisa vir de um gesto do usuário: por isso no pointerup
  window.addEventListener('pointerup', () => {
    const scale = game.scale;
    if (scale.isFullscreen || !scale.fullscreen.available) return;
    scale.startFullscreen();
    const orientation = screen.orientation as ScreenOrientation & LockableOrientation;
    orientation.lock?.('landscape').catch(() => undefined);
  });
}
