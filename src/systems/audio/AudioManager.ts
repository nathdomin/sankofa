import { AUDIO } from '../../config/audio';
import type { MusicId } from '../../data/music';
import { MusicPlayer } from './MusicPlayer';
import { SFX, type SfxName } from './sfx';

type MuteListener = (muted: boolean) => void;

/**
 * Áudio do jogo, gerado em código com a Web Audio API (sem arquivos). O contexto só é criado depois
 * da primeira interação (teclado, mouse ou toque), por causa da política de autoplay dos navegadores;
 * o que for pedido antes disso (como a música do menu) toca assim que o áudio é liberado.
 * A tecla M muta tudo e a escolha fica lembrada no navegador.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private music: MusicPlayer | null = null;
  private wantedMusic: MusicId | null = null;
  private ducked = false;
  private mutedState = readMuted();
  private readonly listeners = new Set<MuteListener>();

  get muted(): boolean {
    return this.mutedState;
  }

  /** Liga os ouvintes globais: libera o áudio na primeira interação, M muta e a aba escondida silencia */
  init(): void {
    const unlock = (): void => {
      this.ensure();
      void this.ctx?.resume();
    };
    // o iPhone só libera o áudio no fim do toque (touchend)
    for (const type of ['keydown', 'pointerdown', 'touchstart', 'touchend', 'pointerup'] as const) window.addEventListener(type, unlock, { passive: true });

    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyM' && !event.repeat) this.toggleMute();
    });
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  /** Cria o contexto e a cadeia de volumes (efeitos e música → geral → compressor → saída) */
  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const compressor = ctx.createDynamicsCompressor();
    compressor.connect(ctx.destination);
    const master = ctx.createGain();
    master.gain.value = this.mutedState ? 0 : AUDIO.master;
    master.connect(compressor);
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = AUDIO.sfx;
    sfxBus.connect(master);
    const musicBus = ctx.createGain();
    musicBus.gain.value = AUDIO.music * (this.ducked ? AUDIO.duckFactor : 1);
    musicBus.connect(master);

    this.ctx = ctx;
    this.master = master;
    this.sfxBus = sfxBus;
    this.musicBus = musicBus;
    this.music = new MusicPlayer(ctx, musicBus);
    if (this.wantedMusic) this.music.play(this.wantedMusic);
    return ctx;
  }

  /** Toca um efeito (ignorado enquanto o áudio não foi liberado ou está mudo) */
  play(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || this.mutedState || ctx.state !== 'running') return;
    SFX[name](ctx, this.sfxBus, ctx.currentTime + 0.005);
  }

  /** Som de coletar, de acordo com o item da fase (textura do coletável) */
  collect(texture: string): void {
    if (texture === 'alforria') this.play('collectAlforria');
    else if (texture === 'papel') this.play('collectPapel');
    else this.play('collectSankofa');
  }

  /** Pede uma trilha em laço; se já é a que está tocando, continua sem reiniciar */
  playMusic(id: MusicId): void {
    this.wantedMusic = id;
    this.setDuck(false);
    this.music?.play(id);
  }

  stopMusic(fadeS?: number): void {
    this.wantedMusic = null;
    this.music?.stop(fadeS);
  }

  /** Abaixa a música (pausa) ou volta ao normal */
  setDuck(on: boolean): void {
    this.ducked = on;
    if (!this.ctx || !this.musicBus) return;
    const now = this.ctx.currentTime;
    const gain = this.musicBus.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(AUDIO.music * (on ? AUDIO.duckFactor : 1), now + AUDIO.fades.duckS);
  }

  toggleMute(): void {
    this.mutedState = !this.mutedState;
    writeMuted(this.mutedState);
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(this.mutedState ? 0 : AUDIO.master, now + AUDIO.fades.muteS);
    }
    this.listeners.forEach((listener) => listener(this.mutedState));
  }

  /** Avisa quando o mudo muda; devolve a função que cancela o aviso */
  onMuteChange(listener: MuteListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(AUDIO.storageKey) === '1';
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(AUDIO.storageKey, muted ? '1' : '0');
  } catch {
    // sem armazenamento (janela privada, por exemplo): só não lembra a escolha
  }
}

export const audio = new AudioManager();
