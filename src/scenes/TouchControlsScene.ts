import Phaser from 'phaser';
import { drawTouchButton } from '../art/touchIcons';
import { TOUCH, type TouchButtonSpec, type TouchCommand } from '../config/touch';
import { touchInput } from '../systems/TouchInput';

export interface TouchControlsData {
  /** Chamado pelo botão de pausa */
  onPause: () => void;
}

interface Button {
  spec: TouchButtonSpec;
  g: Phaser.GameObjects.Graphics;
  pressed: boolean;
}

/**
 * Botões na tela para o celular, por cima da GameScene (só quando `touchInput.enabled`).
 * A cada frame lê todos os dedos na tela e diz ao `touchInput` quais comandos estão seguros:
 * assim o multitoque funciona e um botão nunca fica "grudado" se o dedo escorregar para fora.
 */
export class TouchControlsScene extends Phaser.Scene {
  private buttons: Button[] = [];
  private root!: Phaser.GameObjects.Container;
  private onPause: () => void = () => undefined;

  constructor() {
    super('TouchControls');
  }

  init(data: Partial<TouchControlsData>): void {
    this.onPause = data.onPause ?? (() => undefined);
    this.buttons = [];
  }

  create(): void {
    touchInput.reset();
    this.root = this.add.container(0, 0);
    for (const spec of TOUCH.buttons) {
      const g = this.add.graphics().setPosition(spec.x, spec.y);
      this.root.add(g);
      const button: Button = { spec, g, pressed: false };
      this.paint(button);
      this.buttons.push(button);
    }

    const { x, y, r } = TOUCH.pause;
    const pause = this.add.graphics().setPosition(x, y).setAlpha(TOUCH.alpha.idle);
    drawTouchButton(pause, 'pause', r, false, TOUCH.fill.idle);
    pause.setInteractive(new Phaser.Geom.Circle(0, 0, r * TOUCH.hitFactor), Phaser.Geom.Circle.Contains);
    pause.on('pointerdown', () => this.onPause());
    this.root.add(pause);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => touchInput.reset());
  }

  update(): void {
    // com o jogo pausado (ou ainda não rodando) nada vale: evita apertos "guardados" para depois
    if (!this.scene.isActive('Game')) {
      this.root.setVisible(false);
      touchInput.reset();
      this.buttons.forEach((b) => this.setPressed(b, false));
      return;
    }
    this.root.setVisible(true);

    const held = new Set<TouchCommand>();
    for (const pointer of this.input.manager.pointers) {
      if (!pointer.isDown) continue;
      const hit = this.buttonAt(pointer.x, pointer.y);
      if (hit) held.add(hit.spec.command);
    }
    touchInput.setHeld(held);
    this.buttons.forEach((b) => this.setPressed(b, held.has(b.spec.command)));
  }

  /** O botão mais perto do dedo, se estiver dentro da área de toque (maior que o desenho) */
  private buttonAt(x: number, y: number): Button | null {
    let best: Button | null = null;
    let bestDist = Infinity;
    for (const b of this.buttons) {
      const d = Phaser.Math.Distance.Between(x, y, b.spec.x, b.spec.y);
      if (d <= b.spec.r * TOUCH.hitFactor && d < bestDist) {
        best = b;
        bestDist = d;
      }
    }
    return best;
  }

  private setPressed(button: Button, pressed: boolean): void {
    if (button.pressed === pressed) return;
    button.pressed = pressed;
    this.paint(button);
  }

  private paint(button: Button): void {
    const { pressed, g, spec } = button;
    drawTouchButton(g, spec.command, spec.r, pressed, pressed ? TOUCH.fill.pressed : TOUCH.fill.idle);
    g.setAlpha(pressed ? TOUCH.alpha.pressed : TOUCH.alpha.idle).setScale(pressed ? 0.94 : 1);
  }
}
