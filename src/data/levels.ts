export type MentorId = 'zumbi' | 'luizgama' | 'carolina';

export interface LevelPalette {
  sky: number;
  ground: number;
  block: number;
  accent: number;
}

export type SceneryTheme = 'quilombo' | 'saopaulo' | 'caninde';

export type LandmarkKind = 'palisade' | 'hut';

/** Elemento de cenário posicionado à mão; x em tiles, apoiado no chão daquela coluna */
export interface Landmark {
  kind: LandmarkKind;
  x: number;
  width?: number;
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
    // sem tema de cenário ainda (Marco 3): só a paleta; chão em cinza-pedra e blocos terracota (telhados)
    palette: { sky: 0x9fb3c8, ground: 0x8a8478, block: 0xb5603a, accent: 0x7d7d85 },
    theme: 'saopaulo',
    landmarks: [],
    map: [
      '....................XXXXXX..................................................................................................................',
      '....................XXXXXX..................................................................................................................',
      '....................XXXXXX..................................................................................................................',
      '....................XXXXXX..................................................................................................................',
      '....................XXXXXX..................................................................................................................',
      '....................XXXXXX..................................................................................................................',
      '....................XXXXXX..................................................................................................................',
      '....................XXXXXX....................................................................C.............................................',
      '....................XXXXXX............................................C........BBBBBB........BBB............................................',
      '....................XXXXXX...................................................K...C....N.....................................................',
      '............C.......XXXXXX........................................N....E....XXXXXXXXXXX....N....F...........................................',
      '...........BBB......XXXXXX......................................XXXXXXXXX...XXXXXXXXXXX...XXXXXXXXXXX.......E...........C...................',
      '....................XXXXXX......................................XXXXXXXXX...XXXXXXXXXXX...XXXXXXXXXXX...XXXXXXXXX......BBB..................',
      '...P....N.........................F.........K............E......XXXXXXXXX...XXXXXXXXXXX...XXXXXXXXXXX...XXXXXXXXX.....E......N.....F...G....',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXX...XXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXX...XXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXX...XXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
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
    // sem tema de cenário ainda (Marco 3): só a paleta; blocos laranja = barracos, cinza-azulado = cidade
    palette: { sky: 0xbfe3f5, ground: 0x6f7f8f, block: 0xe0562f, accent: 0x7f9bb0 },
    theme: 'caninde',
    landmarks: [],
    map: [
      '............................................................................................XXXXXX....................................................',
      '............................................................................................XXXXXX....................................................',
      '............................................................................................XXXXXX....................................................',
      '............................................................................................XXXXXX....................................................',
      '............................................................................................XXXXXX....................................................',
      '............................................................................................XXXXXX....................................................',
      '....................................................................................C.......XXXXXX..............................C.....................',
      '............................................................................................XXXXXX....................................................',
      '.................................................................C..........................XXXXXX....................................................',
      '..........................................................................XXXXXXXXXXX.......XXXXXX...........................XXXXXXX..................',
      '.........C....................................C...........................XXXXXXXXXXX.......XXXXXX..........C...........C....XXXXXXX..................',
      '........BBB..................................................XXXXXXXXXX...XXXXXXXXXXX.......XXXXXX...........................XXXXXXX........C.........',
      '....................BBBBBB...................................XXXXXXXXXX...XXXXXXXXXXX.......XXXXXX...........................XXXXXXX.......BBB........',
      '...P..................C.....E...........E...F....E..K........XXXXXXXXXX...XXXXXXXXXXX...F......C.......E..............K...F..XXXXXXX......E.....G.....',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    ],
  },
];
