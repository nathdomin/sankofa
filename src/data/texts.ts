import type { MentorId } from './levels';

// ATENÇÃO: textos históricos são rascunhos. Revisar com fontes confiáveis (Fundação Cultural
// Palmares, Museu Afro Brasil, professor) antes da apresentação.

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
      'Nasceu livre em Salvador, mas foi vendido como escravizado aos 10 anos. Aprendeu a ler, provou na ' +
      'Justiça que tinha direito à liberdade e estudou Direito por conta própria. Atuando nos tribunais, ' +
      'ajudou a libertar centenas de pessoas. Em 2015, a OAB o reconheceu oficialmente como advogado.',
  },
  carolina: {
    title: 'Carolina Maria de Jesus (1914–1977)',
    body:
      'Catadora de papel na favela do Canindé, em São Paulo, escrevia diários sobre a fome e o cotidiano. ' +
      'Em 1960 eles viraram o livro Quarto de Despejo, um sucesso de vendas traduzido para mais de dez ' +
      'idiomas. Carolina é hoje uma das autoras mais importantes da literatura brasileira.',
  },
};

export const MENU_TEXTS = {
  title: 'Sankofa',
  subtitle: 'Caminhos da Resistência',
  play: 'Jogar',
  hint: 'Enter ou Espaço',
  controls: 'Setas ou A/D: mover  |  Espaço: pular (duas vezes no ar)  |  J: meia-lua  |  ↓: esquiva',
  tagline: 'Um jogo sobre o Dia da Consciência Negra – 20 de novembro',
} as const;

export const INTRO_TEXTS = {
  hint: 'Enter ou Espaço para continuar',
} as const;

export const GAME_OVER_TEXTS = {
  title: 'Fim de jogo',
  subtitle: 'Sankofa: volte e busque o que ficou para trás.',
  retry: 'Tentar de novo (fase atual)',
  menu: 'Menu',
} as const;

export const PORTAL_TEXTS = {
  opened: 'O portal abriu!',
} as const;

// Fase 3: o contador do HUD vira um diário que vai sendo preenchido
export const DIARY_TEXTS = {
  label: 'Diário',
  unit: 'páginas',
  complete: 'O diário está completo! Siga até a biblioteca.',
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
