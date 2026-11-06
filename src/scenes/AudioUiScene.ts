import Phaser from 'phaser';
import { AUDIO } from '../config/audio';
import { PALETTE, toCss } from '../config/palette';
import { AUDIO_TEXTS } from '../data/texts';
import { audio } from '../systems/audio/AudioManager';
import { TOUCH } from '../config/touch';
import { touchInput, withoutKeys } from '../systems/TouchInput';

// no celular o canto de baixo é dos botões: o alto-falante sobe, ao lado da pausa
const ICON = touchInput.enabled ? { ...TOUCH.speaker, alpha: 0.8 } : { x: 930, y: 512, alpha: 0.5 };

/**
 * Fica por cima de todas as cenas (é a última registrada): um alto-falante discreto no canto
 * mostra se o som está ligado e, quando se aperta M, aparece o aviso "Som ligado/desligado".
 */
export class AudioUiScene extends Phaser.Scene {
  private icon!: Phaser.GameObjects.Graphics;
  private toast!: Phaser.GameObjects.Text;
  private toastTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super('AudioUi');
  }

  create(): void {
    this.icon = this.add.graphics().setPosition(ICON.x, ICON.y).setAlpha(ICON.alpha).setScrollFactor(0);
    this.toast = this.add
      .text(this.scale.width / 2, this.scale.height - 40, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        fontStyle: 'bold',
        color: toCss(PALETTE.gold),
        stroke: toCss(PALETTE.black),
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.drawIcon();
    // tocar (ou clicar) no alto-falante liga e desliga o som, como a tecla M
    this.icon.setInteractive(new Phaser.Geom.Circle(0, 0, 26), Phaser.Geom.Circle.Contains);
    this.icon.on('pointerdown', () => audio.toggleMute());

    const off = audio.onMuteChange((muted) => {
      this.drawIcon();
      this.showToast(withoutKeys(muted ? AUDIO_TEXTS.off : AUDIO_TEXTS.on));
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }

  /** Alto-falante com ondas (som ligado) ou com um X (mudo) */
  private drawIcon(): void {
    const g = this.icon.clear();
    g.fillStyle(PALETTE.cream).fillRect(-12, -4, 6, 8).fillTriangle(-6, -4, 2, -10, 2, 10).fillTriangle(-6, -4, 2, 10, -6, 4);
    g.lineStyle(2, PALETTE.cream, 1);
    if (audio.muted) {
      g.lineStyle(3, PALETTE.red, 1).lineBetween(6, -6, 14, 6).lineBetween(14, -6, 6, 6);
    } else {
      g.beginPath().arc(2, 0, 7, -0.9, 0.9).strokePath();
      g.beginPath().arc(2, 0, 12, -0.9, 0.9).strokePath();
    }
  }

  private showToast(text: string): void {
    this.toastTween?.stop();
    this.toast.setText(text).setAlpha(1);
    this.toastTween = this.tweens.add({ targets: this.toast, alpha: 0, delay: AUDIO.toastMs, duration: 350 });
  }
}
