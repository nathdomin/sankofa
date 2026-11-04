import { PALETTE, darken } from '../config/palette';
import type { Draw } from './tileArt';

export const BAND_H = 16;

/** Texturas do HUD: faixa de padrão geométrico (inspirada em tecidos africanos) e ícone de vida */
export function makeHudTextures(draw: Draw): void {
  // Faixa que se repete a cada 32 px: zigue-zague de triângulos dourados e vermelhos entre filetes
  draw('hud-band', 32, BAND_H, (g) => {
    g.fillStyle(PALETTE.black).fillRect(0, 0, 32, BAND_H);
    g.fillStyle(PALETTE.gold).fillRect(0, 0, 32, 1).fillRect(0, BAND_H - 1, 32, 1);
    g.fillStyle(PALETTE.gold).fillTriangle(0, 13, 16, 13, 8, 3);
    g.fillStyle(PALETTE.red).fillTriangle(16, 3, 32, 3, 24, 13);
    // pontos verdes no centro de cada triângulo
    g.fillStyle(PALETTE.green).fillRect(7, 8, 2, 2).fillRect(23, 6, 2, 2);
  });

  // Coração de vida cheio. A vida perdida é o mesmo ícone com alpha reduzido
  draw('life-heart', 18, 16, (g) => {
    const dark = darken(PALETTE.red, 30);
    g.fillStyle(dark).fillCircle(5, 5, 5).fillCircle(13, 5, 5).fillTriangle(0, 7, 18, 7, 9, 16);
    g.fillStyle(PALETTE.red).fillCircle(5, 5, 4).fillCircle(13, 5, 4).fillTriangle(2, 7, 16, 7, 9, 14);
    g.fillStyle(0xffffff).fillRect(3, 3, 2, 2);
  });
}
