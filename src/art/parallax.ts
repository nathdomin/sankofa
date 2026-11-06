// Quanto cada camada de fundo anda em relação à câmera (1 = junto com o chão).
// Fica fora do Scenery para a arte dos temas poder gerar camadas compridas com a mesma conta.
// Texturas muito largas (o primeiro plano da fase 3) vêm em pedaços desta largura, para caber no limite de textura dos celulares
export const LONG_CHUNK_PX = 2000;
export const PARALLAX = { clouds: 0.04, birds: 0.08, far: 0.1, hills: 0.2, mid: 0.32, near: 0.5, foreground: 1.3 } as const;
