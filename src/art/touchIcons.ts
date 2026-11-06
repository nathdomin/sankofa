import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import type { TouchCommand } from '../config/touch';

export type TouchIcon = TouchCommand | 'pause';

/** Desenha o ícone do botão centrado em (0, 0); `s` é o meio-tamanho do ícone */
export function drawTouchIcon(g: Phaser.GameObjects.Graphics, icon: TouchIcon, s: number, color: number = PALETTE.cream): void {
  g.fillStyle(color, 1);
  switch (icon) {
    case 'left':
      g.fillTriangle(-s * 0.7, 0, s * 0.5, -s * 0.75, s * 0.5, s * 0.75);
      break;
    case 'right':
      g.fillTriangle(s * 0.7, 0, -s * 0.5, -s * 0.75, -s * 0.5, s * 0.75);
      break;
    case 'down':
      g.fillTriangle(0, s * 0.7, -s * 0.75, -s * 0.5, s * 0.75, -s * 0.5);
      break;
    case 'jump':
      g.fillTriangle(0, -s * 0.75, -s * 0.75, s * 0.45, s * 0.75, s * 0.45);
      break;
    case 'attack': {
      // meia-lua: arco grosso aberto embaixo, com a ponta do pé
      g.lineStyle(Math.max(3, s * 0.3), color, 1);
      g.beginPath().arc(0, s * 0.15, s * 0.62, Math.PI * 0.95, Math.PI * 2.05).strokePath();
      g.fillCircle(s * 0.62, s * 0.2, s * 0.2);
      break;
    }
    case 'pause':
      g.fillRect(-s * 0.55, -s * 0.6, s * 0.38, s * 1.2).fillRect(s * 0.17, -s * 0.6, s * 0.38, s * 1.2);
      break;
  }
}

/** Botão redondo do toque: fundo escuro, borda dourada e o ícone no meio */
export function drawTouchButton(g: Phaser.GameObjects.Graphics, icon: TouchIcon, r: number, pressed: boolean, fillAlpha: number): void {
  g.clear();
  g.fillStyle(pressed ? PALETTE.gold : PALETTE.black, fillAlpha).fillCircle(0, 0, r);
  g.lineStyle(3, PALETTE.gold, 1).strokeCircle(0, 0, r);
  drawTouchIcon(g, icon, r * 0.55, pressed ? 0xffffff : PALETTE.cream);
}
