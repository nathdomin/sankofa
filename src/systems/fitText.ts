import Phaser from 'phaser';

export interface FitBox {
  maxWidth?: number;
  maxHeight?: number;
  /** Menor tamanho de fonte aceito, em px */
  minSize?: number;
}

/**
 * Diminui a fonte até o texto caber na caixa. A fonte `monospace` muda de aparelho para aparelho
 * (no Android é mais larga e mais alta que no PC), então posições fixas não bastam.
 */
export function fitText(text: Phaser.GameObjects.Text, box: FitBox): Phaser.GameObjects.Text {
  const { maxWidth = Infinity, maxHeight = Infinity, minSize = 11 } = box;
  let size = parseFloat(String(text.style.fontSize));
  while ((text.width > maxWidth || text.height > maxHeight) && size > minSize) {
    size -= 1;
    text.setFontSize(size);
  }
  return text;
}
