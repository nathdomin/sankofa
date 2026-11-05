/*
 * Trilhas do jogo: composições originais no espírito da capoeira e do samba, em versão "chiptune"
 * (ondas quadradas e triangulares no lugar de cavaquinho e violão, ruído filtrado no lugar do
 * pandeiro e do tamborim). Cada trilha é um ciclo de 4 compassos de 16 passos (semicolcheias).
 *
 * Notação das melodias: tokens separados por espaço; "A4/3" = nota A4 por 3 passos, "." = pausa
 * de 1 passo, ".4" = pausa de 4 passos. Cada compasso soma 16 passos.
 * Notação da percussão: um padrão de 16 caracteres que se repete a cada compasso;
 * "." silêncio, "o" golpe fraco, "x" normal, "X" forte.
 * Berimbau: "d" dong (grave), "g" ding (agudo), "c" caxixi.
 */

export type MusicId = 'roda' | 'palmares' | 'saopaulo' | 'caninde' | 'vitoria';

export interface TrackLine {
  wave: OscillatorType;
  vol: number;
  notes: string;
}

export interface Track {
  bpm: number;
  /** raiz do berimbau, em Hz (a nota da corda solta) */
  berimbauRoot: number;
  lead?: TrackLine;
  bass?: TrackLine;
  /** cavaquinho: um acorde por compasso, tocado nos passos do padrão */
  chords?: { wave: OscillatorType; vol: number; bars: readonly string[]; pattern: string };
  perc: Partial<Record<'surdo' | 'atabaque' | 'tamborim' | 'pandeiro' | 'agogo' | 'palmas' | 'caxixi' | 'berimbau', string>>;
  /** volume de cada instrumento de percussão (0 a 1) */
  mix?: Partial<Record<'surdo' | 'atabaque' | 'tamborim' | 'pandeiro' | 'agogo' | 'palmas' | 'caxixi' | 'berimbau', number>>;
}

export const BARS = 4;
export const STEPS_PER_BAR = 16;

export const TRACKS: Readonly<Record<MusicId, Track>> = {
  // menu, histórias e cartas: uma roda lenta, só berimbau, atabaque, palmas e uma melodia suave
  roda: {
    bpm: 84,
    berimbauRoot: 196,
    lead: { wave: 'triangle', vol: 0.16, notes: 'A4/6 C5/2 D5/8  C5/6 A4/2 G4/8  A4/6 C5/2 E5/8  D5/4 C5/4 A4/8' },
    bass: { wave: 'triangle', vol: 0.2, notes: 'A2/6 .2 E3/6 .2  A2/6 .2 E3/6 .2  G2/6 .2 D3/6 .2  A2/6 .2 E3/6 .2' },
    perc: { berimbau: 'd...d...g...g.c.', atabaque: 'x.....o.X.....o.', palmas: '....x.......x...' },
    mix: { berimbau: 0.8, atabaque: 0.7, palmas: 0.55 },
  },

  // fase 1, Palmares: capoeira de roda, com berimbau à frente, atabaque, pandeiro e agogô
  palmares: {
    bpm: 104,
    berimbauRoot: 196,
    lead: { wave: 'square', vol: 0.08, notes: 'A4/3 .1 C5/3 .1 D5/2 E5/4 .2  D5/3 .1 C5/3 .1 A4/4 G4/4  A4/3 .1 C5/3 .1 D5/2 E5/2 G5/4  E5/3 .1 D5/3 .1 C5/4 A4/4' },
    bass: { wave: 'triangle', vol: 0.22, notes: 'A2/4 .4 A2/2 .2 E3/4  A2/4 .4 A2/2 .2 E3/4  G2/4 .4 G2/2 .2 D3/4  A2/4 .4 A2/2 .2 E3/4' },
    perc: {
      berimbau: 'd..d..g.d..d..g.',
      atabaque: 'X..x..o.x..x..o.',
      pandeiro: 'XxoxXxoxXxoxXxox',
      agogo: 'x..x..x...x.x...',
      palmas: '....x.......x...',
    },
    mix: { berimbau: 0.85, atabaque: 0.8, pandeiro: 0.5, agogo: 0.7, palmas: 0.5 },
  },

  // fase 2, São Paulo do século XIX: samba de roda, com cavaquinho, violão de sete cordas e pandeiro
  saopaulo: {
    bpm: 100,
    berimbauRoot: 196,
    lead: { wave: 'square', vol: 0.075, notes: 'D5/3 .1 F#5/3 .1 A5/4 F#5/2 .2  E5/3 .1 F#5/3 .1 E5/4 D5/4  B4/3 .1 D5/3 .1 F#5/4 E5/2 D5/2  D5/3 .1 B4/3 .1 A4/8' },
    bass: { wave: 'triangle', vol: 0.22, notes: 'D3/4 A2/4 D3/4 A2/4  A2/4 E3/4 A2/4 E3/4  G2/4 D3/4 G2/4 D3/4  A2/4 E3/4 A2/4 E3/4' },
    chords: { wave: 'square', vol: 0.035, bars: ['D4 F#4 A4', 'C#4 E4 G4', 'D4 G4 B4', 'C#4 E4 G4'], pattern: 'x..x.x..x..x.x..' },
    perc: {
      surdo: 'o...X...o...X...',
      tamborim: 'x.xx.x.xx.xx.x.x',
      pandeiro: 'XxoxXxoxXxoxXxox',
      agogo: 'x.x.x..x.x.x.x..',
    },
    mix: { surdo: 0.85, tamborim: 0.55, pandeiro: 0.5, agogo: 0.55 },
  },

  // fase 3, Canindé até a cidade: samba urbano, mais rápido e esperançoso
  caninde: {
    bpm: 112,
    berimbauRoot: 196,
    lead: { wave: 'square', vol: 0.075, notes: 'E5/2 G5/2 B5/4 A5/4 G5/4  A5/2 G5/2 E5/4 D5/4 E5/4  G5/2 A5/2 B5/4 D6/4 B5/4  A5/4 G5/4 E5/8' },
    bass: { wave: 'triangle', vol: 0.22, notes: 'E2/4 B2/4 E2/4 G2/4  A2/4 E3/4 A2/4 C3/4  C3/4 G3/4 C3/4 E3/4  B2/4 F#3/4 B2/4 D#3/4' },
    chords: { wave: 'square', vol: 0.035, bars: ['E4 G4 B4', 'A3 C4 E4 G4', 'C4 E4 G4', 'B3 D#4 F#4 A4'], pattern: 'x.x..xx.x.x..xx.' },
    perc: {
      surdo: 'o...X...o...X...',
      tamborim: 'x.xx.x.xx.xx.x.x',
      pandeiro: 'XxoxXxoxXxoxXxox',
      agogo: 'x..x..x.x..x.x..',
      caxixi: '.x.x.x.x.x.x.x.x',
    },
    mix: { surdo: 0.85, tamborim: 0.6, pandeiro: 0.5, agogo: 0.55, caxixi: 0.45 },
  },

  // vitória: samba em festa, tudo junto e em tom maior
  vitoria: {
    bpm: 116,
    berimbauRoot: 196,
    lead: { wave: 'square', vol: 0.085, notes: 'C5/2 E5/2 G5/4 E5/2 G5/2 C6/4  A5/4 G5/4 E5/4 D5/4  C5/2 E5/2 G5/4 A5/2 G5/2 E5/4  D5/4 E5/4 C5/8' },
    bass: { wave: 'triangle', vol: 0.22, notes: 'C3/4 G2/4 C3/4 G2/4  F2/4 C3/4 F2/4 C3/4  C3/4 G2/4 C3/4 G2/4  G2/4 D3/4 G2/4 B2/4' },
    chords: { wave: 'square', vol: 0.035, bars: ['C4 E4 G4', 'A3 C4 F4', 'C4 E4 G4', 'B3 D4 F4 G4'], pattern: 'x.xx.x.xx.xx.x.x' },
    perc: {
      surdo: 'o...X...o...X...',
      tamborim: 'x.xx.x.xx.xx.x.x',
      pandeiro: 'XxoxXxoxXxoxXxox',
      agogo: 'x.x.x..x.x.x.x..',
      palmas: '....x.......x...',
    },
    mix: { surdo: 0.85, tamborim: 0.6, pandeiro: 0.5, agogo: 0.55, palmas: 0.5 },
  },
};
