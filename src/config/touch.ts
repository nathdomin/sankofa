// Botões de toque (celular), em coordenadas do jogo (960×540)
export type TouchCommand = 'left' | 'right' | 'jump' | 'down' | 'attack';

export interface TouchButtonSpec {
  command: TouchCommand;
  x: number;
  y: number;
  r: number;
}

export const TOUCH = {
  buttons: [
    { command: 'left', x: 78, y: 462, r: 46 },
    { command: 'right', x: 192, y: 462, r: 46 },
    { command: 'down', x: 300, y: 478, r: 36 },
    { command: 'attack', x: 760, y: 474, r: 42 },
    { command: 'jump', x: 872, y: 440, r: 54 },
  ] satisfies TouchButtonSpec[],
  /** O toque vale até esta distância do centro (× raio): dá para errar um pouco e deslizar entre ◀ e ▶ */
  hitFactor: 1.45,
  pause: { x: 872, y: 86, r: 24 },
  /** No celular o alto-falante sobe para o canto de cima, ao lado da pausa */
  speaker: { x: 928, y: 86 },
  alpha: { idle: 0.55, pressed: 0.95 },
  fill: { idle: 0.35, pressed: 0.55 },
  activePointers: 4,
} as const;
