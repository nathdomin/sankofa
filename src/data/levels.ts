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
      { kind: 'hut', x: 9 },
      { kind: 'palisade', x: 0, width: 5 },
      { kind: 'palisade', x: 45, width: 6 },
      { kind: 'hut', x: 75 },
      { kind: 'palisade', x: 70, width: 3 },
      { kind: 'palisade', x: 78, width: 2 },
      { kind: 'hut', x: 101 },
      { kind: 'palisade', x: 136, width: 5 },
    ],
    map: [
      '......................................................................................................................................................',
      '......................................................................................................................................................',
      '......................................................................................................................................................',
      '......................................................................................................................................................',
      '.........................................................................................C.....................................C......................',
      '........................................................................................BBB...........................C...............................',
      '...............................................CC...............C.................................................C...................................',
      '..............................................BBBB..................................C.........................C......XXXX...XXXXXXX...................',
      '..............................C.C.......................................K..........BBB....................C......XXXXXXXX...XXXXXXX...................',
      '.............................................................XXXXXX...XXXXXXXXXX.............................XXXXXXXXXXXX...XXXXXXXXXXX...............',
      '...................................E.........................XXXXXX...XXXXXXXXXX............E............XXXXXXXXXXXXXXXX...XXXXXXXXXXX.........G.....',
      '........C.C.C...............XXXXXXXXXXXX...XXXXXXXXXX........XXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX',
      '........................XXXXXXXXXXXXXXXX...XXXXXXXXXX....E...XXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX',
      '...P................XXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXX...XXXXXXXXXXXXXXXXXXXXXXXXXX',
    ],
  },
];
