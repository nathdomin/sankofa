import type { TouchCommand } from '../config/touch';

const COMMANDS: readonly TouchCommand[] = ['left', 'right', 'jump', 'down', 'attack'];

interface CommandState {
  down: boolean;
  pressed: boolean; // apertou desde a última leitura
  released: boolean; // soltou desde a última leitura
}

/** Liga os controles de toque: celular/tablet (ponteiro "grosso") ou `?touch` na URL, para testar no PC */
function detectTouch(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has('notouch')) return false;
  if (params.has('touch')) return true;
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
}

/**
 * Estado dos botões de toque, lido pelo Player junto com o teclado.
 * Quem escreve é a TouchControlsScene; `justDown`/`justUp` são consumidos na leitura, como o JustDown do Phaser.
 */
class TouchInput {
  readonly enabled = detectTouch();
  private readonly state = new Map<TouchCommand, CommandState>(COMMANDS.map((c) => [c, { down: false, pressed: false, released: false }]));

  isDown(command: TouchCommand): boolean {
    return this.get(command).down;
  }

  justDown(command: TouchCommand): boolean {
    const s = this.get(command);
    const value = s.pressed;
    s.pressed = false;
    return value;
  }

  justUp(command: TouchCommand): boolean {
    const s = this.get(command);
    const value = s.released;
    s.released = false;
    return value;
  }

  /** Recebe os comandos seguros agora e gera as bordas de apertar/soltar */
  setHeld(held: ReadonlySet<TouchCommand>): void {
    for (const command of COMMANDS) {
      const s = this.get(command);
      const now = held.has(command);
      if (now && !s.down) s.pressed = true;
      if (!now && s.down) s.released = true;
      s.down = now;
    }
  }

  /** Solta tudo e esquece apertos pendentes (ao pausar ou trocar de fase) */
  reset(): void {
    for (const s of this.state.values()) {
      s.down = false;
      s.pressed = false;
      s.released = false;
    }
  }

  private get(command: TouchCommand): CommandState {
    const s = this.state.get(command);
    if (!s) throw new Error(`Comando de toque inválido: ${command}`);
    return s;
  }
}

export const touchInput = new TouchInput();

/** Escolhe o aviso de teclado ou o de toque, conforme o aparelho */
export function forInput(keyboard: string, touch: string): string {
  return touchInput.enabled ? touch : keyboard;
}

/** No toque, tira dos textos as teclas entre parênteses, como "(J)" e "(↓)" */
export function withoutKeys(text: string): string {
  return touchInput.enabled ? text.replace(/ \((J|↓|M)\)/g, '') : text;
}
