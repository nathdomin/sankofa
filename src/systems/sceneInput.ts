import Phaser from 'phaser';

/** Chama `handler` quando qualquer uma das teclas é pressionada (ignora o repeat de tecla segurada) */
export function onKeys(scene: Phaser.Scene, keys: readonly string[], handler: () => void): void {
  const kb = scene.input.keyboard;
  if (!kb) throw new Error('Teclado indisponível');
  keys.forEach((key) => {
    kb.on(`keydown-${key}`, (event: KeyboardEvent) => {
      if (!event.repeat) handler();
    });
  });
}

export const CONFIRM_KEYS = ['ENTER', 'SPACE'] as const;
