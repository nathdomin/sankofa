export type MentorId = 'zumbi' | 'luizgama' | 'carolina';

export interface LevelPalette {
  sky: number;
  ground: number;
  block: number;
  accent: number;
}

export type SceneryTheme = 'quilombo' | 'saopaulo' | 'caninde';

export type LandmarkKind = 'palisade' | 'hut' | 'townhouse' | 'lamp' | 'faculty' | 'building' | 'barraco' | 'varal' | 'library';

/** Elemento de cenário posicionado à mão; x em tiles, apoiado no chão daquela coluna */
export interface Landmark {
  kind: LandmarkKind;
  x: number;
  /** palisade: largura em tiles; building: largura do prédio em tiles (a altura vem do mapa) */
  width?: number;
  /** Variação de cor/forma do mesmo marco (textura `<tipo>-<tema>-<variante>`) */
  variant?: number;
}

export interface LevelConfig {
  id: number;
  title: string;
  era: string;
  mentorId: MentorId;
  collectible: { texture: string; name: string; namePlural: string };
  required: number;
  /** HUD mostra o coletável como um diário ("Diário: 5/8 páginas") */
  diary?: boolean;
  palette: LevelPalette;
  theme: SceneryTheme;
  /** Trecho do mapa (em tiles, pela posição da câmera) em que o fundo vira de um cenário para o outro (favela → cidade) */
  transition?: { from: number; to: number };
  landmarks: Landmark[];
  map: string[];
}

// Legenda: . vazio | X chão | B bloco | P player | C coletável | E Desinformação
// F Esquecimento | K checkpoint | N NPC | G portal
export const LEVELS: readonly LevelConfig[] = [
  {
    id: 1,
    title: 'Serra da Barriga',
    era: 'Século XVII',
    mentorId: 'zumbi',
    collectible: { texture: 'sankofa', name: 'Sankofa', namePlural: 'Sankofas' },
    required: 0,
    palette: { sky: 0xf4a259, ground: 0x7a4a2a, block: 0x8b5a2b, accent: 0x3f8f3a },
    theme: 'quilombo',
    landmarks: [
      { kind: 'palisade', x: 0, width: 5 },
      { kind: 'hut', x: 9 },
      { kind: 'hut', x: 36 },
      { kind: 'palisade', x: 57, width: 6 },
      { kind: 'hut', x: 103 },
      { kind: 'palisade', x: 87, width: 4 },
      { kind: 'palisade', x: 127, width: 4 },
      { kind: 'palisade', x: 140, width: 6 },
    ],
    map: [
      '......................................................................................................................................................',
      '......................................................................................................................................................',
      '......................................................................................................................................................',
      '......................................................................................................................................................',
      '......................................................................................................................................................',
      '................................................C........................................C.................................C..........................',
      '...............................................BBBB.....................................BBB...........................................................',
      '.........................................C.............................................................................C..............................',
      '................................................................................C..........................................XXXXXXXXXX.................',
      '...................................E..............E...............K.............E............E...........................XXXXXXXXXXXXXXXX.............',
      '...........................XXXXXXXXXXXXX...XXXXXXXXXXXX.........XXXXXXXXXBBB..BBBB.BBBXXXXXXXXXX.............C........EXXXXXXXXXXXXXXXXXX...E...G.....',
      '........C.C.C...........XXXXXXXXXXXXXXXX...XXXXXXXXXXXX.........XXXXXXXXX.............XXXXXXXXXX.....................XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      '.....................XXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXX.........XXXXXXXXX.............XXXXXXXXXXXXXXX..............XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      '...P..............XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXX....E....XXXXXXXXX.............XXXXXXXXXXXXXXXK....E......XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.............XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.............XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.............XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    ],
  },
  {
    id: 2,
    title: 'São Paulo',
    era: 'Século XIX',
    mentorId: 'luizgama',
    collectible: { texture: 'alforria', name: 'carta de alforria', namePlural: 'cartas de alforria' },
    required: 5,
    // chão em cinza-pedra (rua de pedra) e blocos terracota (telhados e sacadas)
    palette: { sky: 0x9fb3c8, ground: 0x8a8478, block: 0xb5603a, accent: 0x7d7d85 },
    theme: 'saopaulo',
    landmarks: [
      { kind: 'building', x: 20, width: 8, variant: 1 },
      { kind: 'building', x: 67, width: 9, variant: 0 },
      { kind: 'building', x: 79, width: 10, variant: 2 },
      { kind: 'building', x: 93, width: 9, variant: 3 },
      { kind: 'building', x: 105, width: 8, variant: 1 },
      { kind: 'building', x: 121, width: 6, variant: 0 },
      { kind: 'lamp', x: 5 },
      { kind: 'townhouse', x: 14, variant: 0 },
      { kind: 'townhouse', x: 33, variant: 1 },
      { kind: 'lamp', x: 31 },
      { kind: 'lamp', x: 40 },
      { kind: 'townhouse', x: 56, variant: 2 },
      { kind: 'lamp', x: 52 },
      { kind: 'lamp', x: 64 },
      { kind: 'townhouse', x: 115, variant: 1 },
      { kind: 'lamp', x: 113 },
      { kind: 'lamp', x: 130 },
      { kind: 'lamp', x: 135 },
      { kind: 'faculty', x: 146 },
    ],
    map: [
      '....................XXXXXXXX.............................................................................................XXXXXX.......................',
      '....................XXXXXXXX.............................................................................................XXXXXX.......................',
      '....................XXXXXXXX.............................................................................................XXXXXX.......................',
      '....................XXXXXXXX.............................................................................................XXXXXX.......................',
      '....................XXXXXXXX.............................................................................................XXXXXX.......................',
      '....................XXXXXXXX.............................................................................................XXXXXX.......................',
      '....................XXXXXXXX.....................................................................C.......................XXXXXX.......................',
      '....................XXXXXXXX......................................................BBBBBB........BBB......................XXXXXX.......................',
      '....................XXXXXXXX..........................................C.........N....C...................................XXXXXX.......................',
      '....................XXXXXXXX.................BBB...............................XXXXXXXXXX....K.N...F.....................XXXXXX.......................',
      '...........C........XXXXXXXX........................................N...E......XXXXXXXXXX....XXXXXXXXX..............C....XXXXXX...................G...',
      '..........BBB.......XXXXXXXX.............BBB.......................XXXXXXXXX...XXXXXXXXXX....XXXXXXXXX......E......BBB...XXXXXX..............XXXXXXXXX',
      '....................XXXXXXXX.......................................XXXXXXXXX...XXXXXXXXXX....XXXXXXXXX...XXXXXXXX........XXXXXX............XXXXXXXXXXX',
      '...P....N.............................F.....K...........E.....E....XXXXXXXXX...XXXXXXXXXX....XXXXXXXXX...XXXXXXXX.....N.............E..F.XXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXX....XXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXX....XXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXX....XXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    ],
  },
  {
    id: 3,
    title: 'Canindé → cidade moderna',
    era: 'Século XX',
    mentorId: 'carolina',
    collectible: { texture: 'papel', name: 'página', namePlural: 'páginas' },
    required: 8,
    diary: true,
    // chão de concreto com mato nas frestas; os blocos são telhas de zinco com viga laranja
    palette: { sky: 0xbfe3f5, ground: 0x7a7f86, block: 0xe0562f, accent: 0x6f9a62 },
    theme: 'caninde',
    transition: { from: 60, to: 94 },
    landmarks: [
      { kind: 'barraco', x: 5, variant: 0 },
      { kind: 'varal', x: 14 },
      { kind: 'barraco', x: 19, variant: 2 },
      { kind: 'barraco', x: 33, variant: 1 },
      { kind: 'varal', x: 38 },
      { kind: 'barraco', x: 41, variant: 3 },
      { kind: 'barraco', x: 53, variant: 0 },
      { kind: 'barraco', x: 63, variant: 2 },
      { kind: 'building', x: 70, width: 6, variant: 0 },
      { kind: 'lamp', x: 77 },
      { kind: 'lamp', x: 88 },
      { kind: 'building', x: 94, width: 8, variant: 1 },
      { kind: 'building', x: 105, width: 7, variant: 3 },
      { kind: 'building', x: 116, width: 8, variant: 2 },
      { kind: 'lamp', x: 128 },
      { kind: 'building', x: 133, width: 6, variant: 1 },
      { kind: 'lamp', x: 140 },
      { kind: 'library', x: 145 },
    ],
    map: [
      '......................................................................XXXXXX..........................................................................',
      '......................................................................XXXXXX..........................................................................',
      '......................................................................XXXXXX..........................................................................',
      '......................................................................XXXXXX..........................................................................',
      '......................................................................XXXXXX..........................................................................',
      '......................................................................XXXXXX..........................................................................',
      '......................................................................XXXXXX..........................................................................',
      '......................................................................XXXXXX...........................................C...............C..............',
      '....................................................C.................XXXXXX.....................................C....BBBB............................',
      '...................................................BBBB...............XXXXXX...........................C....F........................XXXXXX...........',
      '.........C............................................................XXXXXX................C............XXXXXXX........E............XXXXXX...........',
      '........BBB.................C.........................E...............XXXXXX.....................E.......XXXXXXX....XXXXXXXX.........XXXXXX......G....',
      '......................BBBBB...................K.XXXXXXXXXX............XXXXXX..................XXXXXXXX...XXXXXXX....XXXXXXXX.........XXXXXX...XXXXXXXX',
      '...P....................C..........E......F..XXXXXXXXXXXXX........F.....C......K..E...F.......XXXXXXXX...XXXXXXX....XXXXXXXX.....K...XXXXXX..XXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXX...XXXXXXX....XXXXXXXX...XXXXXX......XXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXX...XXXXXXX....XXXXXXXX...XXXXXX......XXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXX...XXXXXXX....XXXXXXXX...XXXXXX......XXXXXXXXXXX',
    ],
  },
];
