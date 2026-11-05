/** Volumes e ajustes do áudio (tudo gerado em código com a Web Audio API; ver systems/audio/) */
export const AUDIO = {
  // volumes de 0 a 1: o geral, os efeitos e a música (a música fica mais baixa para não cansar)
  master: 0.8,
  sfx: 1.1,
  music: 0.28,
  // ao pausar, a música abaixa para esta fração do volume
  duckFactor: 0.35,
  // chave onde a escolha de mutar fica lembrada no navegador
  storageKey: 'sankofa.muted',
  // agendador da música: de quanto em quanto tempo confere e com quanta antecedência agenda as notas
  scheduler: { everyMs: 30, aheadS: 0.2 },
  fades: { musicInS: 0.5, musicOutS: 0.6, muteS: 0.05, duckS: 0.2 },
  // aviso de "Som ligado/desligado" na tela
  toastMs: 1400,
} as const;
