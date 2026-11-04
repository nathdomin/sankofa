import { PLAYER } from '../config/physics';
import { PLAYER_COLORS } from '../config/palette';
import { createGrid, outline, rect, stamp, type ColorMap, type PixelGrid } from './pixel';

/*
 * Personagem montado por "esqueleto": cada pose define ângulos de coxa, canela,
 * braço e antebraço (graus a partir da vertical para baixo; positivo = para a frente).
 * Os membros são desenhados como traços grossos entre as juntas, então joelho e
 * cotovelo dobram de verdade e a animação não "quebra" a perna.
 */

const c = PLAYER_COLORS;
export const PLAYER_COLOR_MAP: ColorMap = {
  h: c.hair, H: c.hairLight,
  s: c.skin, S: c.skinShadow, l: c.skinLight,
  w: c.eyeWhite, p: c.pupil, b: c.brow, m: c.mouth, t: c.eyeWhite,
  y: c.shirt, Y: c.shirtShadow, L: c.shirtLight,
  g: c.cord, G: c.cordShadow,
  c: c.pants, C: c.pantsShadow, D: c.pantsFar,
  o: c.outline,
};

// Cabeça 14x16 olhando para a direita (o flipX espelha)
const HEAD = [
  '....hhhhhh....',
  '..hhhhHHhhhh..',
  '.hhhHHhhhhhhh.',
  '.hhhhhhhhhHHh.',
  'hhhhhhhhhhhhhh',
  'hhhhhhhhhhhhhh',
  'hhhhsllllllllh',
  'hhhssbbbssbbbs',
  'hhSsswwpsswwps',
  'hhSsswwpsswwps',
  '.hSssssssslsss',
  '.hSsssssssSSss',
  '..Ssssssmttms.',
  '..SSssssmmsss.',
  '...SSsssssss..',
  '.....SSSSSS...',
];

const HEAD_BLINK = HEAD.map((row, i) => {
  if (i === 8) return row.replace(/[wp]/g, 's');
  if (i === 9) return row.replace(/[wp]/g, 'b');
  return row;
});

const CHEST_PRINT = ['gg.gg', 'ggggg', '.ggg.', '..g..'];

// Medidas do esqueleto (canvas 40x50)
const BODY = {
  headX: 13, headY: 1,
  torsoX: 13, torsoY: 17, torsoW: 14, torsoH: 12,
  // quadris 1px à esquerda do centro: o pé aponta para a frente e precisa de espaço
  hipY: 31, nearHipX: 21, farHipX: 17,
  shoulderY: 19, nearShoulderX: 25, farShoulderX: 14,
  thigh: 8, shin: 8, foot: 6,
  upperArm: 6, foreArm: 5,
  groundY: 48, // última linha do pé encostando no chão
} as const;

interface Leg { thigh: number; shin: number }
interface Arm { upper: number; fore: number }

interface PoseSpec {
  near: Leg;
  far: Leg;
  nearArm: Arm;
  farArm: Arm;
  /** desloca o pé mais baixo até o chão (poses no chão) */
  grounded: boolean;
  lean?: number;
  blink?: boolean;
}

interface Point { x: number; y: number }

const toward = (from: Point, len: number, deg: number): Point => {
  const r = (deg * Math.PI) / 180;
  return { x: from.x + len * Math.sin(r), y: from.y + len * Math.cos(r) };
};

/** Traço grosso entre dois pontos, carimbando quadrados w×w ao longo da linha */
function limb(g: PixelGrid, a: Point, b: Point, w: number, ch: string, dx: number, dy: number): void {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t + dx;
    const y = a.y + (b.y - a.y) * t + dy;
    rect(g, Math.round(x - w / 2), Math.round(y - w / 2), w, w, ch);
  }
}

interface LegGeometry { hip: Point; knee: Point; ankle: Point; heel: Point; toe: Point; footDeg: number; shinDeg: number }

function legGeometry(hipX: number, leg: Leg): LegGeometry {
  const hip = { x: hipX, y: BODY.hipY };
  const knee = toward(hip, BODY.thigh, leg.thigh);
  const ankle = toward(knee, BODY.shin, leg.shin);
  // o pé aponta para a frente, perpendicular à canela, com o calcanhar um pouco atrás
  const footDeg = leg.shin + 90;
  const heel = toward(ankle, -1.5, footDeg);
  const toe = toward(ankle, BODY.foot, footDeg);
  return { hip, knee, ankle, heel, toe, footDeg, shinDeg: leg.shin };
}

/** Pé descalço: sola escura embaixo, peito do pé claro em cima e dedos marcados */
function drawFoot(g: PixelGrid, geo: LegGeometry, far: boolean, extra: number, dx: number, dy: number): void {
  if (extra > 0) {
    limb(g, geo.heel, geo.toe, 3 + extra, 'o', dx, dy);
    return;
  }
  const up = (p: Point, d: number): Point => toward(p, -d, geo.shinDeg);
  limb(g, geo.heel, geo.toe, 3, far ? 'S' : 's', dx, dy);
  limb(g, up(geo.heel, 1), up(geo.toe, 1), 1, far ? 's' : 'l', dx, dy);
  limb(g, toward(geo.heel, 1, geo.shinDeg), toward(geo.toe, 1, geo.shinDeg), 1, 'S', dx, dy);
  // dedos: um pixel escuro perto da ponta
  limb(g, toward(geo.toe, -1.5, geo.footDeg), toward(geo.toe, -1.5, geo.footDeg), 1, 'S', dx, dy);
}

function drawLeg(g: PixelGrid, geo: LegGeometry, far: boolean, dx: number, dy: number): void {
  const pants = far ? 'D' : 'c';
  // barra mais larga da calça de capoeira, sem passar da linha do tornozelo
  const hem = toward(geo.knee, BODY.shin - 2.5, angleOf(geo.knee, geo.ankle));
  const paint = (extra: number, pantsCh: string): void => {
    drawFoot(g, geo, far, extra, dx, dy);
    limb(g, geo.hip, geo.knee, 5 + extra, pantsCh, dx, dy);
    limb(g, geo.knee, geo.ankle, 4 + extra, pantsCh, dx, dy);
    limb(g, hem, hem, 6 + extra, pantsCh, dx, dy);
  };
  // a perna da frente ganha contorno próprio para se destacar da de trás
  if (!far) paint(2, 'o');
  paint(0, pants);
}

const angleOf = (a: Point, b: Point): number => (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;

function drawArm(g: PixelGrid, shoulderX: number, arm: Arm, far: boolean, dx: number, dy: number): void {
  const shoulder = { x: shoulderX, y: BODY.shoulderY };
  const elbow = toward(shoulder, BODY.upperArm, arm.upper);
  const hand = toward(elbow, BODY.foreArm, arm.fore);
  limb(g, shoulder, toward(shoulder, 3, arm.upper), 4, far ? 'Y' : 'L', dx, dy); // manga
  limb(g, toward(shoulder, 3, arm.upper), elbow, 3, far ? 'S' : 's', dx, dy);
  limb(g, elbow, hand, 3, far ? 'S' : 's', dx, dy);
  limb(g, hand, hand, 3, far ? 's' : 'l', dx, dy);
}

function drawTorso(g: PixelGrid, dx: number, dy: number): void {
  const { torsoX: x, torsoY: y, torsoW: w, torsoH: h } = BODY;
  rect(g, x + dx, y + dy, w, h, 'y');
  rect(g, x + dx, y + dy, 2, h, 'L');
  rect(g, x + w - 3 + dx, y + dy, 3, h, 'Y');
  rect(g, x + dx, y + h - 1 + dy, w, 1, 'Y');
  rect(g, x + 4 + dx, y + dy, 6, 1, 's');
  rect(g, x + 5 + dx, y + 1 + dy, 4, 1, 's');
  rect(g, x + 6 + dx, y + 2 + dy, 2, 1, 'S');
  stamp(g, CHEST_PRINT, x + 4 + dx, y + 4 + dy);
  // gancho da calça e cordão verde com o nó na lateral
  rect(g, x + 2 + dx, y + h + 2 + dy, w - 4, 2, 'c');
  rect(g, x + dx, y + h + dy, w, 2, 'g');
  rect(g, x + dx, y + h + 1 + dy, w, 1, 'G');
  rect(g, x + w - 4 + dx, y + h - 1 + dy, 3, 4, 'g');
  rect(g, x + w - 3 + dx, y + h + 1 + dy, 1, 2, 'G');
}

const SPARE_ROWS = 12;

export function buildPoseGrid(pose: PoseSpec): PixelGrid {
  const { w, h } = PLAYER.sprite;
  // desenha numa grade mais alta para nada ser cortado antes de aterrar
  const work = createGrid(w, h + SPARE_ROWS);
  const dx = pose.lean ?? 0;

  // de trás para a frente: braço de trás, perna de trás, perna da frente, tronco, braço da frente, cabeça
  drawArm(work, BODY.farShoulderX, pose.farArm, true, dx, 0);
  drawLeg(work, legGeometry(BODY.farHipX, pose.far), true, 0, 0);
  drawLeg(work, legGeometry(BODY.nearHipX, pose.near), false, 0, 0);
  drawTorso(work, dx, 0);
  drawArm(work, BODY.nearShoulderX, pose.nearArm, false, dx, 0);
  stamp(work, pose.blink ? HEAD_BLINK : HEAD, BODY.headX + dx, BODY.headY);

  // no chão, desce o desenho até o pixel mais baixo tocar a linha do chão
  let shift = 0;
  if (pose.grounded) {
    let lowest = 0;
    work.forEach((row, y) => {
      // ignora o contorno: a linha abaixo do pé vira o contorno final
      if (row.some((ch) => ch !== '.' && ch !== 'o')) lowest = y;
    });
    shift = BODY.groundY - lowest;
  }

  const g = createGrid(w, h);
  work.forEach((row, y) => {
    const target = g[y + shift];
    if (target) row.forEach((ch, x) => (target[x] = ch));
  });
  outline(g, 'o');
  return g;
}

export const RUN_FRAMES = 8;

/** Ciclo de corrida: cada perna segue uma senoide, defasadas em meio ciclo */
function runPose(frame: number): PoseSpec {
  const phase = (frame / RUN_FRAMES) * Math.PI * 2;
  const leg = (p: number): Leg => {
    const thigh = 32 * Math.sin(p);
    // joelho dobra bastante quando a perna volta para a frente
    const shin = thigh - (6 + 50 * Math.max(0, Math.cos(p)));
    return { thigh, shin };
  };
  const arm = (p: number): Arm => {
    const upper = -40 * Math.sin(p);
    return { upper, fore: upper + 55 };
  };
  return {
    near: leg(phase),
    far: leg(phase + Math.PI),
    nearArm: arm(phase),
    farArm: arm(phase + Math.PI),
    grounded: true,
    lean: 1,
  };
}

// base da ginga: pernas afastadas, braço da frente protegendo o rosto
const IDLE: PoseSpec = {
  near: { thigh: 16, shin: 8 },
  far: { thigh: -16, shin: -8 },
  nearArm: { upper: 30, fore: 125 },
  farArm: { upper: -20, fore: -5 },
  grounded: true,
};

export const PLAYER_POSES: Readonly<Record<string, PoseSpec>> = {
  idle: IDLE,
  idleBlink: { ...IDLE, blink: true },
  // subindo: joelho da frente erguido, braços puxando para cima
  jumpUp: {
    near: { thigh: 75, shin: 5 },
    far: { thigh: -10, shin: -30 },
    nearArm: { upper: 150, fore: 165 },
    farArm: { upper: -35, fore: -15 },
    grounded: false,
  },
  // caindo: pernas se preparando para aterrissar, braços abertos para equilíbrio
  fall: {
    near: { thigh: 25, shin: 12 },
    far: { thigh: -18, shin: -35 },
    nearArm: { upper: 105, fore: 125 },
    farArm: { upper: -100, fore: -120 },
    grounded: false,
  },
  // aú: corpo em estrela (pernas e braços esticados) enquanto gira
  au: {
    near: { thigh: 38, shin: 38 },
    far: { thigh: -38, shin: -38 },
    nearArm: { upper: 155, fore: 155 },
    farArm: { upper: -155, fore: -155 },
    grounded: false,
  },
  ...Object.fromEntries(Array.from({ length: RUN_FRAMES }, (_, i) => [`run${i}`, runPose(i)])),
};

export const playerTextureKey = (pose: string): string => `player-${pose}`;
export const PLAYER_RUN_KEYS = Array.from({ length: RUN_FRAMES }, (_, i) => playerTextureKey(`run${i}`));
