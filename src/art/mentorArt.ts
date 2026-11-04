import { PALETTE, darken } from '../config/palette';
import type { MentorId } from '../data/levels';
import type { Draw } from './tileArt';

export const PORTRAIT = { w: 200, h: 240 } as const;

// cor de destaque de cada retrato (a silhueta é igual; muda só o fundo e o contorno)
const MENTOR_COLORS: Record<MentorId, number> = {
  zumbi: PALETTE.gold,
  luizgama: 0x6b8cae,
  carolina: PALETTE.red,
};

export const mentorTextureKey = (id: MentorId): string => `mentor-${id}`;

/** Retratos placeholder: silhuetas estilizadas, sem rosto (não representam a aparência real) */
export function makeMentorTextures(draw: Draw): void {
  (Object.keys(MENTOR_COLORS) as MentorId[]).forEach((id) => {
    const color = MENTOR_COLORS[id];
    draw(mentorTextureKey(id), PORTRAIT.w, PORTRAIT.h, (g) => {
      g.fillStyle(darken(color, 65)).fillRect(0, 0, PORTRAIT.w, PORTRAIT.h);
      g.fillStyle(darken(color, 35)).fillCircle(100, 100, 92);
      // contorno na cor de destaque, depois a silhueta escura por cima
      g.fillStyle(color).fillCircle(100, 92, 46).fillRect(84, 126, 32, 26).fillEllipse(100, 252, 186, 150);
      g.fillStyle(PALETTE.black).fillCircle(100, 92, 42).fillRect(88, 126, 24, 26).fillEllipse(100, 254, 176, 144);
    });
  });
}
