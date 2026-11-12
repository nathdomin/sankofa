import Phaser from 'phaser';
import { TOUCH_TEXTS } from '../data/texts';

interface LockableOrientation {
  lock?: (orientation: 'landscape') => Promise<void>;
}

const TIP_KEY = 'sankofa.iosTipClosed';

/** iPhone/iPad (o iPad novo se diz "Mac", mas tem toque) */
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Aberto pela Tela de Início, como app: já roda sem as barras do navegador */
function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches;
}

/**
 * Ajustes para o celular: liga o aviso "gire o celular" (CSS em index.html, classe `touch`) e cuida da tela cheia.
 * - Android: a cada toque fora da tela cheia, tenta entrar nela e travar a tela deitada (para de tentar se falhar).
 * - iPhone: o Safari não deixa páginas entrarem em tela cheia (só vídeos). O jeito é abrir pela Tela de Início,
 *   que roda sem as barras do Safari; um aviso ensina como, e o ícone da Tela de Início é o pássaro Sankofa.
 */
export function setupMobile(game: Phaser.Game): void {
  document.documentElement.classList.add('touch');
  const message = document.querySelector('#rotate p');
  if (message) message.textContent = TOUCH_TEXTS.rotate;

  if (isIOS()) {
    addHomeScreenIcon(game);
    // embutido (ex.: itch.io) a dica não serve: a Tela de Início guardaria a página de fora, não o jogo
    if (!isStandalone() && window.self === window.top) showIosTip();
    return;
  }

  let failed = false;
  game.scale.on(Phaser.Scale.Events.FULLSCREEN_FAILED, () => (failed = true));
  game.scale.on(Phaser.Scale.Events.FULLSCREEN_UNSUPPORTED, () => (failed = true));
  // precisa vir de um gesto do usuário: por isso no pointerup
  window.addEventListener('pointerup', () => {
    const scale = game.scale;
    if (failed || scale.isFullscreen || !scale.fullscreen.available || isStandalone()) return;
    try {
      scale.startFullscreen();
    } catch {
      failed = true;
      return;
    }
    const orientation = screen.orientation as ScreenOrientation & LockableOrientation;
    try {
      orientation.lock?.('landscape').catch(() => undefined);
    } catch {
      // alguns navegadores não deixam travar a orientação
    }
  });
}

/** Faixa no alto ensinando a abrir pela Tela de Início; some ao tocar e não volta mais */
function showIosTip(): void {
  if (readFlag(TIP_KEY)) return;
  const tip = document.getElementById('ios-tip');
  const text = tip?.querySelector('p');
  if (!tip || !text) return;
  text.textContent = TOUCH_TEXTS.iosTip;
  tip.classList.add('show');
  tip.addEventListener('pointerup', (event) => {
    event.stopPropagation();
    tip.classList.remove('show');
    try {
      window.localStorage.setItem(TIP_KEY, '1');
    } catch {
      // sem armazenamento: o aviso volta na próxima visita
    }
  });
}

/** Ícone da Tela de Início (180×180): o pássaro Sankofa sobre fundo escuro, desenhado com a textura do jogo */
function addHomeScreenIcon(game: Phaser.Game): void {
  const tryAdd = (): void => {
    if (!game.textures.exists('sankofa-big')) {
      window.setTimeout(tryAdd, 300);
      return;
    }
    const source = game.textures.get('sankofa-big').getSourceImage() as CanvasImageSource & { width: number; height: number };
    const size = 180;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    const scale = Math.floor((size * 0.8) / source.width);
    const w = source.width * scale;
    const h = source.height * scale;
    ctx.drawImage(source, (size - w) / 2, (size - h) / 2, w, h);
    const link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    link.href = canvas.toDataURL('image/png');
    document.head.appendChild(link);
  };
  tryAdd();
}

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
