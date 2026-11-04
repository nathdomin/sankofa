// Checagem de alcance dos mapas: BFS sobre posições em que o player pode ficar parado, expandindo
// por pulos simulados (corrida, pulo variável e aú) com as constantes reais de physics.ts.
// Uso: node tools/reachability.mjs <índice da fase, a partir de 0>
//   NOAU=1   desliga o aú (mostra o que sai só com pulo simples)
//   EXTRA="col,linha;col,linha"   testa coletáveis hipotéticos
// Ignora inimigos e não simula esquiva/rolê. Pouso e toque são aproximações: use como alerta.
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const src = fs.readFileSync(new URL('src/data/levels.ts', root), 'utf8');
const phys = fs.readFileSync(new URL('src/config/physics.ts', root), 'utf8');
const num = (re) => Number(phys.match(re)[1]);
const G = num(/gravity: (\d+)/), MAXFALL = num(/maxFallSpeed: (\d+)/);
const RUN = num(/runSpeed: (\d+)/), ACC = num(/acceleration: (\d+)/), DEC = num(/deceleration: (\d+)/);
const JV = num(/jumpVelocity: (-\d+)/), AUV = num(/auVelocity: (-\d+)/), CUT = Number(phys.match(/jumpCutFactor: ([\d.]+)/)[1]);
const T = 32, W = 22, H = 40, DT = 1 / 60;

const levelIdx = Number(process.argv[2] ?? 0);
const mapsrc = [...src.matchAll(/map: \[([\s\S]*?)\n    \],/g)][levelIdx][1];
const map = [...mapsrc.matchAll(/'([.XBPCEFKNG]+)'/g)].map((m) => m[1]);
const rows = map.length, cols = map[0].length;
const solid = (tx, ty) => tx >= 0 && tx < cols && ty >= 0 && ty < rows && (map[ty][tx] === 'X' || map[ty][tx] === 'B');
const coins = [], goal = {}; let spawn;
map.forEach((r, y) => [...r].forEach((c, x) => {
  if (c === 'C') coins.push({ x, y, cx: x * T + 16, cy: y * T + 16 });
  if (c === 'P') spawn = { x: x * T + 16, feet: (y + 1) * T };
  if (c === 'G') { goal.x = x * T + 16; goal.feet = (y + 1) * T; }
}));

for (const e of (process.env.EXTRA ?? '').split(';').filter(Boolean)) { const [x, y] = e.split(',').map(Number); coins.push({ x, y, cx: x * T + 16, cy: y * T + 16 }); }
// corpo: x = centro, y = pés
const hits = (x, feet) => {
  const l = x - W / 2, r = x + W / 2, t = feet - H, b = feet;
  for (let ty = Math.floor(t / T); ty <= Math.floor((b - 0.001) / T); ty++)
    for (let tx = Math.floor(l / T); tx <= Math.floor((r - 0.001) / T); tx++) if (solid(tx, ty)) return true;
  return false;
};
const touches = (x, feet, c) => Math.abs(x - c.cx) < W / 2 + 10 && feet - H < c.cy + 10 && feet > c.cy - 10;
const grounded = (x, feet) => hits(x, feet + 0.5);
const worldW = cols * T;

function step(s, dir) {
  // horizontal: acelera/desacelera como no Player
  const target = dir * RUN;
  const rate = dir === 0 || s.vx * dir < 0 ? DEC : ACC;
  const diff = target - s.vx, st = rate * DT;
  s.vx = Math.abs(diff) <= st ? target : s.vx + Math.sign(diff) * st;
  s.vy = Math.min(MAXFALL, s.vy + G * DT);
  let nx = s.x + s.vx * DT;
  if (nx - W / 2 < 0 || nx + W / 2 > worldW) { nx = s.x; s.vx = 0; }
  if (hits(nx, s.feet)) { nx = s.x; s.vx = 0; }
  s.x = nx;
  let nf = s.feet + s.vy * DT;
  if (hits(s.x, nf)) {
    if (s.vy > 0) { nf = Math.floor(nf / T) * T; while (hits(s.x, nf)) nf -= T; s.landed = true; } else { nf = s.feet; }
    s.vy = 0;
  }
  s.feet = nf;
}

const key = (x, feet) => `${Math.round(x / 8)}:${Math.round(feet)}`;
const stand = new Map(); // posições onde dá para ficar parado
const queue = [];
const reachedCoins = new Set();
const add = (x, feet) => { const k = key(x, feet); if (!stand.has(k)) { stand.set(k, { x, feet }); queue.push({ x, feet }); } };
add(spawn.x, spawn.feet);
let goalReached = false;

function simulate(p, vx0, d1, hold, auAt, d2) {
  const s = { x: p.x, feet: p.feet, vx: vx0, vy: JV, landed: false };
  let au = false, cut = false;
  for (let f = 0; f < 150; f++) {
    const tsec = f * DT;
    if (!cut && tsec >= hold && s.vy < 0) { s.vy *= CUT; cut = true; }
    let dir = au ? d2 : d1;
    if (!au && auAt !== null && tsec >= auAt) { au = true; s.vy = AUV; dir = d2; }
    step(s, dir);
    for (const c of coins) if (touches(s.x, s.feet, c)) reachedCoins.add(`${c.x},${c.y}`);
    if (Math.abs(s.x - goal.x) < 20 && Math.abs(s.feet - goal.feet) < 40) goalReached = true;
    if (s.landed && grounded(s.x, s.feet)) { add(s.x, s.feet); return; }
    if (s.feet > rows * T + 100) return; // caiu no buraco
  }
}

while (queue.length) {
  const p = queue.shift();
  // andar pelo chão em ambos os lados até a beira (e cair dela)
  for (const d of [-1, 1]) {
    const s = { x: p.x, feet: p.feet, vx: 0, vy: 0, landed: false };
    for (let f = 0; f < 400; f++) {
      step(s, d);
      for (const c of coins) if (touches(s.x, s.feet, c)) reachedCoins.add(`${c.x},${c.y}`);
      if (Math.abs(s.x - goal.x) < 20 && Math.abs(s.feet - goal.feet) < 40) goalReached = true;
      if (grounded(s.x, s.feet)) { if (f % 4 === 0) add(s.x, s.feet); } else if (s.feet > p.feet + 2) { if (s.landed) add(s.x, s.feet); }
      if (s.feet > rows * T + 100) break;
      if (!grounded(s.x, s.feet) && s.vy > 0 && s.feet > p.feet + T * 8) break;
    }
  }
  for (const vx0 of [0, -RUN, RUN])
    for (const d1 of [-1, 0, 1])
      for (const hold of [0.12, 0.22, 0.34, 1])
        for (const auAt of process.env.NOAU ? [null] : [null, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6])
          for (const d2 of auAt === null ? [d1] : [-1, 0, 1]) simulate(p, vx0, d1, hold, auAt, d2);
}

const label = (c) => `col ${c.x}, linha ${c.y}`;
const missing = coins.filter((c) => !reachedCoins.has(`${c.x},${c.y}`));
console.log(`fase ${levelIdx + 1}: ${cols}x${rows} tiles, ${coins.length} coletáveis, ${stand.size} posições de pouso`);
console.log('portal alcançável:', goalReached);
console.log('alcançáveis:', coins.filter((c) => reachedCoins.has(`${c.x},${c.y}`)).map(label).join(' | '));
console.log('INALCANÇÁVEIS:', missing.length ? missing.map(label).join(' | ') : 'nenhum');
