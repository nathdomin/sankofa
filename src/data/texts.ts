import type { MentorId } from './levels';

// Textos históricos conferidos em 06/11/2026 contra fontes públicas (ver "Fontes" no CLAUDE.md):
// datas, lugares e leis batem. Ainda vale uma leitura final do professor antes da apresentação.

export interface Mentor {
  name: string;
  /** Falas da IntroScene: inspiradas, não são citações reais */
  lines: string[];
}

export interface HistoricalCard {
  title: string;
  body: string;
}

export const MENTORS: Record<MentorId, Mentor> = {
  zumbi: {
    name: 'Zumbi dos Palmares',
    lines: [
      'Bem-vindo a Palmares. Aqui, quem chegou buscando liberdade construiu uma vida nova.',
      'Subir esta serra exige coragem. Use a ginga: pule e, no ar, pule de novo.',
      'Se a desinformação cruzar seu caminho, gire a meia-lua (J). Siga em frente.',
    ],
  },
  luizgama: {
    name: 'Luiz Gama',
    lines: [
      'Me tiraram a liberdade quando eu era criança. Com estudo, eu a recuperei.',
      'Agora uso a lei para libertar outras pessoas.',
      'Encontre as 5 cartas de alforria. Nas passagens baixas, abaixe na esquiva (↓).',
      'Cuidado com o Esquecimento: ele é rápido e só cai com a meia-lua (J).',
    ],
  },
  carolina: {
    name: 'Carolina Maria de Jesus',
    lines: [
      'Eu catava papel para sobreviver. Nesses papéis, eu escrevia minha vida.',
      'Escrever é ter voz. Me ajude a completar o diário: junte 8 páginas.',
      'Depois, siga até a biblioteca. O mundo precisa ler essas histórias.',
    ],
  },
};

export const CARDS: Record<MentorId, HistoricalCard> = {
  zumbi: {
    title: 'Zumbi dos Palmares',
    body:
      'Zumbi foi o último grande líder do Quilombo dos Palmares, na Serra da Barriga (atual Alagoas), ' +
      'um dos maiores quilombos das Américas, que resistiu por décadas. Foi morto em 20 de novembro de 1695. ' +
      'Essa data deu origem ao Dia Nacional de Zumbi e da Consciência Negra, feriado nacional desde 2024.',
  },
  luizgama: {
    title: 'Luiz Gama (1830–1882)',
    body:
      'Nasceu livre em Salvador, mas foi vendido como escravizado aos 10 anos. Já adolescente, aprendeu a ler ' +
      'e provou que era livre. Impedido de cursar Direito, estudou por conta própria e atuou nos tribunais ' +
      'como rábula (advogado sem diploma), ajudando a libertar centenas de pessoas. Em 2015, a OAB lhe ' +
      'concedeu, após a morte, o título de advogado.',
  },
  carolina: {
    title: 'Carolina Maria de Jesus (1914–1977)',
    body:
      'Catadora de papel na favela do Canindé, em São Paulo, escrevia diários sobre a fome e o cotidiano. ' +
      'Em 1960 eles viraram o livro Quarto de Despejo, um sucesso de vendas traduzido para mais de dez ' +
      'idiomas. Carolina é hoje uma das autoras mais importantes da literatura brasileira.',
  },
};

// --- História do protagonista ---
// Nome provisório: o grupo ainda pode trocar (é só mudar aqui). As falas do protagonista não usam
// adjetivos de gênero, para servir a qualquer pessoa que jogue.
export const PROTAGONIST_NAME = 'Aiyê';

export type Speaker = 'protagonista' | 'sankofa' | MentorId;

export interface StoryLine {
  speaker: Speaker;
  text: string;
}

/** Cenário de fundo da cena: o presente ao entardecer, a "viagem" entre épocas, o presente ao amanhecer */
export type StoryMood = 'present-dusk' | 'time' | 'present-dawn';

export type StoryId = 'prologo' | 'elo1' | 'elo2' | 'epilogo';

export interface StoryScript {
  title: string;
  subtitle: string;
  mood: StoryMood;
  lines: StoryLine[];
}

export const SPEAKER_NAMES: Record<'protagonista' | 'sankofa', string> = {
  protagonista: PROTAGONIST_NAME,
  sankofa: 'Sankofa',
};

export const STORIES: Record<StoryId, StoryScript> = {
  prologo: {
    title: 'Hoje',
    subtitle: 'Véspera do 20 de novembro',
    mood: 'present-dusk',
    lines: [
      { speaker: 'protagonista', text: 'Amanhã é 20 de novembro e preciso apresentar um trabalho sobre a história negra do Brasil. Só que não sei por onde começar.' },
      { speaker: 'protagonista', text: 'A roda de capoeira acabou e o berimbau já foi guardado. Foi quando vi, no chão, um símbolo brilhando: um Sankofa.' },
      { speaker: 'sankofa', text: 'Sankofa: voltar e buscar o que ficou para trás.' },
      { speaker: 'protagonista', text: 'Toquei no símbolo e o mundo girou. Quando a luz se apagou, eu já não estava mais aqui…' },
    ],
  },
  // depois da fase 1 (Zumbi), a caminho do século XIX
  elo1: {
    title: 'O símbolo brilha',
    subtitle: 'Do século XVII ao XIX',
    mood: 'time',
    lines: [
      { speaker: 'protagonista', text: 'Eu só tinha ouvido falar de Palmares. Agora senti a Serra da Barriga sob os pés e vi que resistir também é construir uma vida nova.' },
      { speaker: 'sankofa', text: 'Ainda há o que buscar. Siga a luz até o século XIX.' },
      { speaker: 'protagonista', text: 'O chão mudou: ruas de pedra, sobrados, lampiões. São Paulo, muito tempo atrás.' },
    ],
  },
  // depois da fase 2 (Luiz Gama), a caminho do século XX
  elo2: {
    title: 'O símbolo brilha',
    subtitle: 'Do século XIX ao XX',
    mood: 'time',
    lines: [
      { speaker: 'protagonista', text: 'Luiz Gama transformou o estudo em liberdade para centenas de pessoas. A lei também pode ser caminho de resistência.' },
      { speaker: 'sankofa', text: 'Falta uma voz. Agora, o século XX.' },
      { speaker: 'protagonista', text: 'A luz me levou a uma favela cercada por uma cidade que crescia: o Canindé.' },
    ],
  },
  epilogo: {
    title: 'De volta ao presente',
    subtitle: 'Amanhecer de 20 de novembro',
    mood: 'present-dawn',
    lines: [
      { speaker: 'protagonista', text: 'Voltei para a roda e o Sankofa ficou quieto na minha mão. Hoje tenho muito o que contar.' },
      { speaker: 'protagonista', text: 'Zumbi me ensinou a resistir. Luiz Gama, a usar o conhecimento. Carolina, a ter voz.' },
      { speaker: 'protagonista', text: 'Agora sei por onde começar: voltar, buscar o que ficou para trás e levar essas histórias adiante.' },
    ],
  },
};

/** História que passa entre uma fase e a próxima (índice da fase que acabou de terminar) */
export const LINK_STORY: Readonly<Record<number, StoryId>> = { 0: 'elo1', 1: 'elo2' };

export const MENU_TEXTS = {
  title: 'SANKOFA',
  subtitle: 'Caminhos da Resistência',
  play: 'Jogar',
  levels: 'Escolher fase',
  help: 'Como jogar',
  tagline: 'Dia da Consciência Negra · 20 de novembro',
} as const;

export const ENEMIES_TEXTS = {
  title: 'Quem atravessa o caminho',
  subtitle: 'Eles não são pessoas: são ideias que querem apagar a nossa história.',
  howTitle: 'Como vencer',
  hint: 'Enter ou Espaço para continuar',
  desinformacao: {
    name: 'Desinformação',
    tag: 'Boatos e mentiras',
    what: 'Notícias falsas e boatos que escondem a verdade sobre a nossa história. Aparecem em todas as fases.',
    how: 'Pule em cima dela ou use a meia-lua (J).',
  },
  esquecimento: {
    name: 'Esquecimento',
    tag: 'Histórias que se apagam',
    what: 'Quando ninguém conta uma história, ela vai sumindo. É mais rápido e só aparece a partir da fase 2.',
    how: 'As pontas impedem o pisão: só a meia-lua (J) o derrota.',
  },
} as const;

export const HELP_TEXTS = {
  title: 'Como jogar',
  controls: [
    { action: 'Mover', keys: ['← →', 'A D'] },
    { action: 'Pular (e pular de novo no ar: aú)', keys: ['Espaço', '↑', 'W'] },
    { action: 'Meia-lua de compasso (golpe)', keys: ['J', 'X'] },
    { action: 'Esquiva (segurar)', keys: ['↓', 'S'] },
    { action: 'Pausar', keys: ['Esc', 'P'] },
    { action: 'Som ligado/desligado', keys: ['M'] },
  ],
  tips: [
    'O Esquecimento só cai com a meia-lua. A Desinformação também cai com um pulo em cima.',
    'Passagens baixas pedem a esquiva.',
  ],
  back: 'Enter ou Esc: voltar',
} as const;

export const INTRO_TEXTS = {
  hint: 'Enter ou Espaço para continuar',
} as const;

export const LEVEL_SELECT_TEXTS = {
  title: 'Escolher fase',
  back: 'Voltar',
  hint: '↑ ↓ e Enter, ou as teclas 1, 2 e 3  ·  Esc: voltar',
  shortcut: 'Segure Shift ao escolher para pular a introdução',
} as const;

export const PAUSE_TEXTS = {
  title: 'PAUSADO',
  resume: 'Continuar',
  menu: 'Menu',
  hint: 'Esc ou P para continuar',
} as const;

export const GAME_OVER_TEXTS = {
  title: 'FIM DE JOGO',
  subtitle: 'Sankofa: volte e busque o que ficou para trás.',
  retry: 'Tentar de novo (fase atual)',
  menu: 'Menu',
} as const;

export const PORTAL_TEXTS = {
  opened: 'O portal abriu!',
  levelComplete: 'FASE CONCLUÍDA!',
} as const;

// Fase 3: o contador do HUD vira um diário que vai sendo preenchido
export const DIARY_TEXTS = {
  label: 'Diário',
  unit: 'páginas',
  complete: 'O diário está completo! Siga até a biblioteca.',
} as const;

export const AUDIO_TEXTS = {
  on: 'Som ligado (M)',
  off: 'Som desligado (M)',
} as const;

// Celular: avisos que trocam "Enter/Esc" por toque, e a ajuda com os botões da tela
export const TOUCH_TEXTS = {
  rotate: 'Gire o celular para jogar',
  continue: 'Toque para continuar',
  back: 'Toque para voltar',
  menu: 'Toque para voltar ao menu',
  pause: 'Toque em Continuar para voltar ao jogo',
  levelSelect: 'Toque numa fase para começar',
  controls: [
    { action: 'Mover', icons: ['left', 'right'] },
    { action: 'Pular (e pular de novo no ar: aú)', icons: ['jump'] },
    { action: 'Meia-lua de compasso (golpe)', icons: ['attack'] },
    { action: 'Esquiva (segurar)', icons: ['down'] },
    { action: 'Pausar', icons: ['pause'] },
    { action: 'Som: toque no alto-falante', icons: [] },
  ],
} as const;

export const NPC_TEXTS = {
  freed: 'Livre!',
} as const;

export const CARD_TEXTS = {
  hint: 'Pressione Enter para continuar',
} as const;

// TODO: incluir os nomes dos demais integrantes da equipe, se houver, antes da apresentação
export const VICTORY_TEXTS = {
  title: 'Sankofa',
  message: [
    'Sankofa significa “voltar e buscar o que ficou para trás”.',
    'Conhecer o passado é o caminho para construir o futuro.',
  ],
  score: 'Pontuação total',
  creditsTitle: 'Créditos',
  credits: [
    'Sankofa: Caminhos da Resistência',
    'Um jogo para o Novembro Negro',
    'Dia da Consciência Negra – 20 de novembro',
    '',
    'Desenvolvimento',
    'Nathan Domingues',
    '',
    'Arte, música e efeitos sonoros',
    'criados em código',
    '',
    'Inspirado em',
    'Zumbi dos Palmares',
    'Luiz Gama',
    'Carolina Maria de Jesus',
    '',
    'Feito com Phaser 3',
    '',
    'Obrigado por jogar!',
  ],
  hint: 'Pressione Enter para continuar',
  hintMenu: 'Pressione Enter para voltar ao menu',
} as const;
