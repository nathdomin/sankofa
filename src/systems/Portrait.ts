import Phaser from 'phaser';
import { MENTOR_ACCENT, PORTRAIT, mentorTextureKey } from '../art/mentorArt';
import { playerTextureKey } from '../art/playerArt';
import { PALETTE, darken } from '../config/palette';
import type { Speaker } from '../data/texts';

interface Look {
  idle: string;
  talk: string;
  blink: string;
  scale: number;
  accent: number;
  /** Base da imagem (os mentores e o protagonista ficam apoiados na borda de baixo; o símbolo, no centro) */
  anchor: 'bottom' | 'center';
  /** Ajuste em px para o anchor 'center': centra o peso visual do desenho no círculo do fundo, não a caixa dele */
  offset?: { x: number; y: number };
  /** Sem quadro de boca aberta: balança um pouco enquanto fala */
  bobWhenTalking?: boolean;
  /** Flutua devagar, em vez de respirar */
  float?: boolean;
}

const BREATH = { scale: 1.018, ms: 1700 } as const;
const BLINK = { minMs: 2400, maxMs: 5200, holdMs: 130 } as const;
const TALK_MS = 140;
const BOB_PX = 3;

function lookFor(speaker: Speaker): Look {
  if (speaker === 'protagonista') {
    return { idle: playerTextureKey('idle'), talk: playerTextureKey('idle'), blink: playerTextureKey('idleBlink'), scale: 4.8, accent: PALETTE.green, anchor: 'bottom', bobWhenTalking: true };
  }
  if (speaker === 'sankofa') {
    return { idle: 'sankofa-big', talk: 'sankofa-big', blink: 'sankofa-big', scale: 3, accent: 0xa090f0, anchor: 'center', offset: { x: 10, y: 3 }, float: true };
  }
  return {
    idle: mentorTextureKey(speaker),
    talk: mentorTextureKey(speaker, 'talk'),
    blink: mentorTextureKey(speaker, 'blink'),
    scale: 1,
    accent: MENTOR_ACCENT[speaker],
    anchor: 'bottom',
  };
}

/**
 * Retrato animado de quem fala, numa moldura dourada de 200x240: respira, pisca de tempos em tempos
 * e mexe a boca enquanto o texto está sendo digitado. `show()` troca de personagem.
 */
export class Portrait {
  private readonly backdrop: Phaser.GameObjects.Graphics;
  private readonly image: Phaser.GameObjects.Image;
  private look: Look | null = null;
  private talking = false;
  private mouthOpen = false;
  private blinking = false;
  private blinkTimer: Phaser.Time.TimerEvent | null = null;
  private holdTimer: Phaser.Time.TimerEvent | null = null;
  private restingY = 0;
  private talkTimer: Phaser.Time.TimerEvent | null = null;
  private readonly rng = new Phaser.Math.RandomDataGenerator(['portrait']);

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    depth = 1,
  ) {
    scene.add.rectangle(x - 6, y - 6, PORTRAIT.w + 12, PORTRAIT.h + 12, PALETTE.gold).setOrigin(0).setDepth(depth);
    this.backdrop = scene.add.graphics().setDepth(depth);
    this.image = scene.add.image(0, 0, 'sankofa').setDepth(depth + 1);
  }

  show(speaker: Speaker): void {
    this.look = lookFor(speaker);
    const { look } = this;
    this.scene.tweens.killTweensOf(this.image);
    this.talking = false;
    this.mouthOpen = false;
    this.blinking = false;
    this.talkTimer?.remove(false);
    this.talkTimer = null;
    this.holdTimer?.remove(false);
    this.holdTimer = null;

    // fundo na cor do personagem
    const { x, y } = this;
    this.backdrop.clear();
    this.backdrop.fillStyle(darken(look.accent, 65)).fillRect(x, y, PORTRAIT.w, PORTRAIT.h);
    this.backdrop.fillStyle(darken(look.accent, 35)).fillCircle(x + PORTRAIT.w / 2, y + PORTRAIT.h * 0.42, 92);

    this.image.setTexture(look.idle).setScale(look.scale).setAngle(0);
    if (look.anchor === 'bottom') this.image.setOrigin(0.5, 1).setPosition(x + PORTRAIT.w / 2, y + PORTRAIT.h);
    else this.image.setOrigin(0.5, 0.5).setPosition(x + PORTRAIT.w / 2 + (look.offset?.x ?? 0), y + PORTRAIT.h * 0.42 + (look.offset?.y ?? 0));
    this.restingY = this.image.y;

    if (look.float) {
      this.scene.tweens.add({ targets: this.image, y: this.restingY - 8, duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    } else {
      this.scene.tweens.add({ targets: this.image, scaleY: look.scale * BREATH.scale, duration: BREATH.ms, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    }
    this.scheduleBlink();
  }

  /** Liga/desliga a boca: chamado enquanto o texto é digitado */
  setTalking(on: boolean): void {
    if (!this.look || on === this.talking) return;
    this.talking = on;
    this.talkTimer?.remove(false);
    this.talkTimer = null;
    this.mouthOpen = false;
    if (on) {
      this.talkTimer = this.scene.time.addEvent({
        delay: TALK_MS,
        loop: true,
        callback: () => {
          this.mouthOpen = !this.mouthOpen;
          this.applyFrame();
        },
      });
    }
    this.applyFrame();
  }

  private applyFrame(): void {
    const { look } = this;
    if (!look) return;
    if (this.blinking) this.image.setTexture(look.blink);
    else this.image.setTexture(this.mouthOpen ? look.talk : look.idle);
    if (look.bobWhenTalking && !look.float) this.image.setY(this.restingY - (this.mouthOpen ? BOB_PX : 0));
  }

  private scheduleBlink(): void {
    this.blinkTimer?.remove(false);
    this.blinkTimer = this.scene.time.delayedCall(this.rng.between(BLINK.minMs, BLINK.maxMs), () => {
      this.blinking = true;
      this.applyFrame();
      this.holdTimer = this.scene.time.delayedCall(BLINK.holdMs, () => {
        this.blinking = false;
        this.applyFrame();
        this.scheduleBlink();
      });
    });
  }
}
