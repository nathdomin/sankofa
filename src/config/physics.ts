export const TILE_SIZE = 32;

export const WORLD = {
  gravity: 1300,
  maxFallSpeed: 700,
  // margem abaixo do mapa antes de considerar que o player caiu no buraco
  fallMargin: 64,
} as const;

export const PLAYER = {
  // sprite maior que a hitbox para caber rosto e braços abertos; a hitbox não muda
  sprite: { w: 40, h: 50 },
  hitbox: { w: 22, h: 40 },
  runSpeed: 230,
  acceleration: 1600,
  deceleration: 2000,
  maxSpeedX: 1000,
  jumpVelocity: -560,
  jumpCutFactor: 0.45,
  auVelocity: -480,
  auSpinMs: 300,
  coyoteMs: 100,
  jumpBufferMs: 120,
  // dano: empurrão para trás e perda de controle por um instante
  hurtMs: 350,
  hurtKnockbackX: 220,
  hurtKnockbackY: -280,
  hurtTint: 0xff6666,
  runFrameRate: 16,
  runAnimMinSpeed: 20,
  // squash & stretch do visual
  jumpStretchY: 1.15,
  landSquashY: 0.8,
  squashMs: 140,
  blinkEveryMs: 2800,
  blinkMs: 130,
} as const;

export const CAPOEIRA = {
  meiaLua: {
    durationMs: 300, activeFromMs: 80, activeToMs: 220, cooldownMs: 450,
    hitbox: { w: 44, h: 30 }, groundSpeedFactor: 0.3, hitStopMs: 60,
    shakeMs: 80, shakeIntensity: 0.004, score: 100,
    // rastro dourado em arco: raios das duas faixas, espessura e duração do fade
    trail: { radii: [26, 34], lineWidth: 4, fadeMs: 200 },
  },
  // squashY/tiltDeg: só visual; enterMs = tempo de abaixar
  esquiva: { speedFactor: 0.4, hitbox: { w: 22, h: 22 }, stepMs: 130, stepMinSpeed: 20 },
  role: { speed: 420, durationMs: 250, cooldownMs: 700 },
  // parado: ginga em quadros (o peso passa de uma perna para a outra); cada quadro dura frameMs
  ginga: { frameMs: 360 },
} as const;

export const ENEMY = {
  // body: hitbox menor que a textura (a arte tem sombra e pontas); ox/oy = offset a partir do canto da textura
  desinformacao: { speed: 55, stompable: true, body: { w: 24, h: 18, ox: 2, oy: 6 } },
  esquecimento: { speed: 95, stompable: false, body: { w: 24, h: 20, ox: 2, oy: 8 } },
  // quique do player ao pisar num inimigo
  stompBounce: -380,
  // quanto o pé do player pode estar abaixo do topo do inimigo para contar como pisão
  stompTolerance: 16,
  stompScore: 100,
  defeatMs: 200,
  // quadros por segundo da animação de andar e partículas ao ser derrotado
  animFps: { desinformacao: 5, esquecimento: 4 },
  defeatBurst: { count: 12, speed: { min: 40, max: 140 }, lifeMs: 520 },
} as const;

export const COLLECTIBLE = {
  score: 50,
  // flutuação suave: sobe e desce em torno da posição do tile
  floatPx: 3,
  floatMs: 900,
  pickMs: 250,
  pickRisePx: 22,
  // halo pulsando atrás do item e cintilho que passa de tempos em tempos
  haloAlpha: { min: 0.55, max: 1 },
  haloMs: 1100,
  glintEveryMs: { min: 1600, max: 3600 },
  glintMs: 420,
  // brilho ao coletar: anel que se expande, faíscas e pontos flutuando
  burstCount: 12,
  burstSpeed: { min: 60, max: 170 },
  burstLifeMs: 480,
  ringRadius: 30,
  ringMs: 340,
  scoreRisePx: 30,
  scoreMs: 700,
} as const;

export const NPC = {
  // pulinhos ao ser libertado e balão "Livre!"
  hopPx: 22,
  hopMs: 160,
  hops: 2,
  balloonMs: 1000,
  balloonRisePx: 14,
  // depois de libertada, balança de leve
  cheerPx: 2,
  cheerMs: 420,
  // brilho ao libertar: clarão, faíscas e elos da corrente caindo
  flashMs: 420,
  burstCount: 16,
  burstSpeed: { min: 70, max: 190 },
  burstLifeMs: 600,
  linkCount: 6,
  linkLifeMs: 800,
} as const;

export const GAME = {
  startLives: 3,
  // invencibilidade depois de levar dano ou renascer, com o sprite piscando
  invincibleMs: 1000,
  invincibleBlinkMs: 80,
  invincibleAlpha: 0.35,
  // tempo do fade ao morrer, antes de voltar ao checkpoint
  deathFadeMs: 250,
  // aviso na tela (portal trancado, portal aberto)
  noticeMs: 1500,
  // faixa "Fase concluída!" antes da carta histórica
  levelCompleteMs: 2400,
} as const;

export const CAMERA = {
  lerpX: 0.12,
  lerpY: 0.12,
  deadzoneW: 160,
  deadzoneH: 120,
  fadeMs: 300,
} as const;
