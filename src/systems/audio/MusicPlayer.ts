import { AUDIO } from '../../config/audio';
import { BARS, STEPS_PER_BAR, TRACKS, type MusicId, type Track, type TrackLine } from '../../data/music';
import { berimbau, PERCUSSION, type PercussionName } from './percussion';
import { noteFreq, tone, type Ctx } from './synth';

const TOTAL_STEPS = BARS * STEPS_PER_BAR;

interface NoteEvent {
  freq: number;
  steps: number;
}

/** Uma linha melódica em texto vira "passo → nota que começa nele" */
function parseLine(text: string): Map<number, NoteEvent> {
  const events = new Map<number, NoteEvent>();
  let step = 0;
  for (const token of text.split(/\s+/).filter(Boolean)) {
    const match = /^(?:([A-G][#b]?-?\d)|\.)(?:\/?(\d+))?$/.exec(token);
    if (!match) throw new Error(`Token de música inválido: ${token}`);
    const [, note, len] = match;
    const steps = len ? Number(len) : 1;
    if (note) events.set(step, { freq: noteFreq(note), steps });
    step += steps;
  }
  if (step !== TOTAL_STEPS) throw new Error(`A linha tem ${step} passos, o esperado é ${TOTAL_STEPS}`);
  return events;
}

interface ParsedTrack {
  track: Track;
  lead: Map<number, NoteEvent> | null;
  bass: Map<number, NoteEvent> | null;
  chords: number[][] | null;
}

const parsedCache = new Map<MusicId, ParsedTrack>();

export function parseTrack(id: MusicId): ParsedTrack {
  let parsed = parsedCache.get(id);
  if (!parsed) {
    const track = TRACKS[id];
    parsed = {
      track,
      lead: track.lead ? parseLine(track.lead.notes) : null,
      bass: track.bass ? parseLine(track.bass.notes) : null,
      chords: track.chords ? track.chords.bars.map((bar) => bar.split(' ').map(noteFreq)) : null,
    };
    parsedCache.set(id, parsed);
  }
  return parsed;
}

const HIT_POWER: Readonly<Record<string, number>> = { o: 0.5, x: 0.8, X: 1 };

/** Agenda tudo o que toca no passo `step` (0 a 63), que começa em `t` segundos do contexto */
export function scheduleStep(ctx: Ctx, dest: AudioNode, id: MusicId, step: number, t: number): void {
  const { track, lead, bass, chords } = parseTrack(id);
  const stepDur = 60 / track.bpm / 4;
  const inBar = step % STEPS_PER_BAR;
  const bar = Math.floor(step / STEPS_PER_BAR);

  const playLine = (events: Map<number, NoteEvent> | null, line: TrackLine | undefined): void => {
    const e = events?.get(step);
    if (e && line) tone(ctx, dest, { freq: e.freq, start: t, dur: e.steps * stepDur * 0.92, type: line.wave, vol: line.vol, release: 0.05 });
  };
  playLine(lead, track.lead);
  playLine(bass, track.bass);

  if (chords && track.chords && track.chords.pattern[inBar] === 'x') {
    chords[bar].forEach((freq, i) => tone(ctx, dest, { freq, start: t + i * 0.006, dur: stepDur * 1.6, type: track.chords?.wave, vol: track.chords?.vol, release: 0.08 }));
  }

  for (const [name, pattern] of Object.entries(track.perc)) {
    const ch = pattern[inBar];
    if (!ch || ch === '.') continue;
    const level = track.mix?.[name as keyof typeof track.mix] ?? 0.7;
    if (name === 'berimbau') {
      if (ch === 'c') PERCUSSION.caxixi(ctx, dest, t, level);
      else berimbau(ctx, dest, t, level, track.berimbauRoot, ch === 'g');
    } else {
      PERCUSSION[name as PercussionName](ctx, dest, t, (HIT_POWER[ch] ?? 0.8) * level);
    }
  }
}

/** Toca uma trilha em laço: um agendador confere o relógio do áudio e agenda os próximos passos com antecedência */
export class MusicPlayer {
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private current: { id: MusicId; gain: GainNode } | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly bus: AudioNode,
  ) {}

  get playing(): MusicId | null {
    return this.current?.id ?? null;
  }

  play(id: MusicId): void {
    if (this.current?.id === id) return;
    this.stop(AUDIO.fades.musicOutS);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + AUDIO.fades.musicInS);
    gain.connect(this.bus);
    this.current = { id, gain };
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.tick();
    this.timer = window.setInterval(() => this.tick(), AUDIO.scheduler.everyMs);
  }

  /** Para o agendador e apaga o som aos poucos (as notas já agendadas terminam sozinhas) */
  stop(fadeS: number = AUDIO.fades.musicOutS): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    const old = this.current;
    this.current = null;
    if (!old) return;
    const now = this.ctx.currentTime;
    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setValueAtTime(old.gain.gain.value, now);
    old.gain.gain.linearRampToValueAtTime(0.0001, now + fadeS);
    window.setTimeout(() => old.gain.disconnect(), (fadeS + 0.6) * 1000);
  }

  private tick(): void {
    const cur = this.current;
    if (!cur) return;
    const stepDur = 60 / TRACKS[cur.id].bpm / 4;
    while (this.nextTime < this.ctx.currentTime + AUDIO.scheduler.aheadS) {
      scheduleStep(this.ctx, cur.gain, cur.id, this.step, this.nextTime);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % TOTAL_STEPS;
    }
  }
}
