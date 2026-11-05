# Sankofa: Caminhos da Resistência

Jogo de plataforma 2D (estilo Super Mario Bros) jogável no navegador, criado para o **Novembro Negro / Dia da Consciência Negra**.
O jogador atravessa 3 fases, cada uma ligada a uma personalidade negra brasileira de uma época diferente, formando uma linha do tempo da resistência: século XVII → XIX → XX.

> **Prazo:** apresentação em **19/11**. O jogo deve estar congelado (sem features novas) em **17/11**.
> Prioridade absoluta: **jogo estável e jogável**. Polimento só depois que o essencial funcionar.

---

## 1. Stack e regras técnicas

- **Phaser 3** (última versão 3.x estável) + **TypeScript** (`strict: true`) + **Vite**
- Física: `Arcade Physics`
- Sem outras dependências de runtime além do Phaser. Dev deps só o necessário (typescript, vite).
- **O jogo precisa rodar sem nenhum arquivo de imagem ou som externo.** Todas as texturas iniciais são **geradas em código** (`Phaser.GameObjects.Graphics` + `generateTexture`) na `BootScene`. Assets reais poderão substituir as chaves de textura depois, sem mudar a lógica.
- Fases definidas como **mapas ASCII em TypeScript** (ver seção 5). Não usar Tiled neste momento.
- Resolução base: **960×540**, `Phaser.Scale.FIT` + `autoCenter`, `pixelArt: true`.
- `vite.config.ts` com `base: './'` para funcionar no itch.io e em qualquer subpasta.

### Convenções de código
- Nada de `any`. Tipos e interfaces explícitos para configs de fase e entidades.
- Constantes de gameplay (gravidade, velocidade etc.) centralizadas em `src/config/physics.ts`, nunca espalhadas como números mágicos.
- Conteúdo (textos, cartas históricas, mapas) separado da lógica, em `src/data/`.
- Uma classe por entidade (`Player`, `Enemy`, `Collectible`, `Npc`).
- Comentários em português, curtos, só onde o código não é óbvio.
- Ao final de cada marco: rodar `npm run build` e garantir **zero erros de TypeScript**.

### Ferramentas de desenvolvimento
- `?debug` na URL (ex.: `http://localhost:5173/?debug`) liga o debug do Arcade e mostra as hitboxes.
- Em `npm run dev`, a instância do jogo fica em `window.__sankofa` para testes pelo console.

### Estrutura de pastas
```
/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tools/
│  └─ reachability.mjs        # checagem de alcance dos mapas (node, sem dependências)
├─ vite.config.ts
└─ src/
   ├─ main.ts                 # config do Phaser e registro das cenas
   ├─ art/                    # desenho das texturas geradas em código (usado pela BootScene)
   │  ├─ parallax.ts          # fatores de parallax das camadas (usados pelo Scenery e pela arte)
   │  ├─ pixel.ts             # grade de pixels em texto → Graphics
   │  ├─ colors.ts            # gradientes e utilitários de cor
   │  ├─ playerArt.ts         # poses do player em pixel art
   │  ├─ tileArt.ts           # tiles de chão/bloco por fase
   │  ├─ hudArt.ts            # faixa decorativa e ícone de vida do HUD
   │  ├─ mentorArt.ts         # retratos placeholder (silhuetas) dos mentores
   │  └─ themes/
   │     ├─ quilombo.ts       # céu, parallax e enfeites da fase 1
   │     ├─ saopaulo.ts       # casario, sobrados, lampiões, prédios e faculdade da fase 2
   │     └─ caninde.ts        # favela que vira cidade (fundo misto), barracos, varais e biblioteca da fase 3
   ├─ config/
   │  ├─ physics.ts           # constantes de movimento
   │  └─ palette.ts           # cores do jogo
   ├─ data/
   │  ├─ levels.ts            # mapas ASCII + config de cada fase
   │  └─ texts.ts             # diálogos dos mentores e cartas históricas
   ├─ scenes/
   │  ├─ BootScene.ts         # gera texturas placeholder
   │  ├─ MenuScene.ts
   │  ├─ LevelSelectScene.ts  # escolha de fase (Shift pula a Intro)
   │  ├─ HelpScene.ts         # "Como jogar": controles e dicas
   │  ├─ StoryScene.ts        # cenas de história: prólogo, ligações entre fases e epílogo
   │  ├─ IntroScene.ts        # mentor apresenta a fase
   │  ├─ GameScene.ts         # gameplay
   │  ├─ HudScene.ts          # roda em paralelo à GameScene
   │  ├─ CardScene.ts         # carta histórica ao fim da fase
   │  ├─ PauseScene.ts        # pausa por cima da GameScene
   │  ├─ GameOverScene.ts
   │  └─ VictoryScene.ts      # final + créditos
   ├─ entities/
   │  ├─ Player.ts
   │  ├─ Enemy.ts
   │  ├─ Collectible.ts
   │  ├─ Checkpoint.ts
   │  └─ Npc.ts
   └─ systems/
      ├─ LevelBuilder.ts      # converte mapa ASCII em objetos
      ├─ transitions.ts       # goToScene: troca de cena com fade
      ├─ sceneInput.ts        # teclas de confirmar/navegar nos menus
      ├─ OptionList.ts        # lista de opções (GameOver, Pausa)
      ├─ DialogueBox.ts       # caixa de fala com texto digitado (Intro e Story)
      ├─ MenuBackdrop.ts      # fundo comum do menu, do seletor de fases e da ajuda
      ├─ Scenery.ts           # parallax, landmarks e vegetação a partir do tema da fase
      └─ GameState.ts         # vidas, fase atual, pontuação (singleton que emite eventos para a HUD)
```

---

## 2. Controles

| Ação | Teclas |
|---|---|
| Mover | ← → ou A / D |
| Pular / aú (pulo duplo) | Espaço, ↑ ou W |
| Meia-lua de compasso (golpe) | J ou X |
| Esquiva / cocorinha (segurar) | ↓ ou S |
| Rolê (rolamento) | K ou Shift |
| Confirmar / avançar texto | Enter ou Espaço |
| Pausar | Esc ou P |
| Mutar som | M |

---

## 3. Personagem e "game feel"

Protagonista **original** (não é nenhuma das personalidades históricas), chamado **Aiyê** (nome provisório, constante `PROTAGONIST_NAME` em `texts.ts`): um estudante dos dias de hoje, capoeirista. Na véspera do 20 de novembro precisa apresentar um trabalho sobre a história negra e não sabe por onde começar; depois da roda de capoeira encontra um símbolo Sankofa e é levado de volta no tempo. Tom esperançoso e inspirador; as falas dele não usam adjetivos de gênero. No epílogo volta ao presente, decide levar as três histórias adiante e a Victory fecha com o significado do Sankofa. Ele atravessa as três épocas aprendendo com cada mentor e, no final, volta ao presente com essas histórias. Sankofa = "voltar e buscar o que ficou para trás".

Hitbox em pé: **22×40**. Sprite: **40×50** (maior que a hitbox para caber rosto e braços abertos). Abaixado: hitbox **22×22**, mantendo os pés no chão.

**Arquitetura do Player:** `Player` é uma `Zone` que carrega só o corpo Arcade (a hitbox exata). O visual é um `Sprite` separado (`player.visual`, origem nos pés), reposicionado a cada frame por `syncVisual()`. Motivo: no Arcade o corpo acompanha o `scale` do game object, e os tweens de squash/rotação mudariam a hitbox. Regra:
- Mudar hitbox (esquiva, rolê) → `arcadeBody.setSize()` mantendo a base no mesmo `y`.
- Efeitos visuais (squash, rotação, piscar) → sempre no `visual`, nunca na `Zone`.

Movimento (valores iniciais em `physics.ts`, ajustáveis):
- Gravidade: `1300`
- Velocidade horizontal: `230`, com aceleração `1600` e desaceleração `2000` (não parar seco)
- Pulo: velocidade `-560`
- **Pulo variável:** soltar o botão cedo corta a subida (multiplica `velocity.y` por `0.45` se estiver subindo)
- **Pulo duplo ("aú")**: 1 pulo extra no ar, velocidade `-480`, com uma rotação de 360° no sprite durante ~300 ms
- **Coyote time:** `100 ms`
- **Jump buffer:** `120 ms`
- Velocidade máxima de queda: `700`
- Câmera seguindo o player com `lerp` suave e `deadzone` horizontal; limites da câmera = tamanho do mapa

O pulo duplo já vem liberado desde a fase 1 (o mentor apresenta o movimento).

### 3.1 Movimentos de capoeira

A identidade do jogo é o personagem se mover como capoeirista. Cada movimento tem **uma função clara** no gameplay. Não há combos complexos. Todas as constantes ficam em `physics.ts`.

#### Máquina de estados do Player
`idle (ginga) | run | jump | au | meiaLua | esquiva | role | hurt`
- Transições controladas num único método `setState()`. A animação/tween de cada estado é iniciada **só na entrada do estado** (não a cada frame).
- `hurt` tem prioridade sobre tudo. `meiaLua` e `role` não podem ser interrompidos até terminar.

#### Ginga (automática, visual)
- **Parado:** respiração sutil, com tween em `scaleY` (1.0↔1.03, ciclo de 1600 ms, `yoyo`, `repeat: -1`); o corpo sobe e desce sobre os pés, **sem inclinar para os lados** (a inclinação foi testada e descartada). O tween espera o squash da aterrissagem terminar.
- **Andando:** sem tween; animação de corrida de 2 frames com `timeScale` proporcional à velocidade.
- **Squash & stretch:** estica ao pular e achata ao aterrissar (valores em `PLAYER` no `physics.ts`).
- Ao sair do estado, o tween para e o visual volta a `angle = 0`, `scale = 1`.

#### Aú (pulo duplo)
- Já descrito acima. Rotação de 360° **no sentido do movimento** (horário para a direita, anti-horário para a esquerda) em 300 ms.

#### Meia-lua de compasso (golpe), tecla J/X
- Funciona no chão e no ar. Duração total: **300 ms**. Cooldown: **450 ms**.
- **Janela ativa** de 80 ms a 220 ms: cria uma `Zone` com corpo Arcade de **44×30** à frente do player (lado para onde ele olha), com `overlap` contra os inimigos. Destrói a zona ao fim da janela.
- No chão, a velocidade horizontal cai para 30% durante o golpe (o capoeirista "planta" a mão no chão).
- **Visual:** sprite gira 360° rápido + rastro em arco semicircular desenhado com `Graphics` (dourado, fade-out de 200 ms).
- **Feedback de acerto:** *hit-stop* de 60 ms (`physics.world.pause()` + `delayedCall` para `resume()`) + `camera.shake(80, 0.004)`.
- É a **única forma** de derrotar o inimigo Esquecimento (seção 4).

#### Esquiva / cocorinha, tecla ↓/S (segurar)
- Só no chão. Abaixa: hitbox muda para 22×22 e a velocidade máxima cai para 40%.
- Permite passar por **vãos de 1 tile de altura** (32 px), como telhados baixos, varais e galhos.
- **Visual:** `scaleY` 0.55 no `visual` (origem já fica nos pés) e leve inclinação para o lado de frente.
- Ao soltar, **só levanta se houver espaço acima**: checar se os tiles acima da hitbox estão livres. Se estiver bloqueado, continua abaixado até sair do vão.

#### Rolê (rolamento), tecla K/Shift
- Só no chão. Avança **420 px/s por 250 ms** na direção em que o player olha.
- **Invencível** durante o rolê e com hitbox baixa (como na esquiva), então passa por vãos baixos e por inimigos.
- Cooldown: **700 ms**.
- **Visual:** rotação de 360° com `scale` 0.8 durante o movimento.
- Ao terminar, aplica a mesma regra de "só levanta se houver espaço".
- **Se o prazo apertar, o rolê é o primeiro movimento a ser cortado.**

#### Constantes
Todos os valores ficam em `src/config/physics.ts` (`WORLD`, `PLAYER`, `CAPOEIRA`, `CAMERA`), que é a **fonte da verdade**. Os números deste documento são a intenção de design; se o código foi ajustado no playtest, vale o código.

---

## 4. Regras gerais

- **3 vidas.** Cair num buraco = perde 1 vida e volta ao último checkpoint (ou ao início da fase).
- Encostar num inimigo pelo lado = perde 1 vida e o player é **empurrado para trás** (estado `hurt`, ~350 ms sem controle, sprite avermelhado), sem voltar ao checkpoint. Só volta ao checkpoint quem cair no buraco.
- Cair **em cima** de um inimigo Desinformação derrota o inimigo e dá um pequeno quique no player.
- A **meia-lua de compasso** derrota qualquer inimigo que estiver na hitbox do golpe.
- Após levar dano: **1 s de invencibilidade** (sprite piscando).
- Sem vidas → `GameOverScene` com opções "Tentar de novo (fase atual)" e "Menu".
- **Coletáveis obrigatórios:** cada fase define `required` (pode ser 0). O portal/saída da fase só abre quando `coletados >= required`. Enquanto estiver fechado, ele aparece apagado e, ao encostar, mostra o aviso "Colete X restantes".
- Checkpoint: bandeira no meio de cada fase.

### Inimigos (conceitos abstratos, nunca pessoas)
Inimigos representam ideias, não grupos de pessoas. Visual: "nuvens" ou "manchas" escuras com olhos simples.
- **Desinformação**: anda de um lado para o outro e vira ao bater em parede, na beira da plataforma ou numa passagem baixa (vão de 1 tile, que o inimigo não entra, para não ficar no caminho de quem passa abaixado)
- **Esquecimento** (fases 2 e 3): igual, porém mais rápido e com "pontas" no topo. **Não pode ser derrotado pulando em cima** (causa dano); só com a meia-lua. Também dá para desviar dele com o rolê.

---

## 5. Formato dos mapas (`src/data/levels.ts`)

Tile = **32×32 px**. Cada fase é um array de strings (todas as linhas com o mesmo comprimento).

| Caractere | Significado |
|---|---|
| `.` | vazio |
| `X` | chão (sólido) |
| `B` | bloco / plataforma (sólido) |
| `P` | posição inicial do player |
| `C` | coletável da fase |
| `E` | inimigo Desinformação |
| `F` | inimigo Esquecimento |
| `K` | checkpoint |
| `N` | NPC a ser libertado (fase 2) |
| `G` | portal de saída |

```ts
export interface LevelConfig {
  id: number;
  title: string;            // ex.: "Serra da Barriga"
  era: string;              // ex.: "Século XVII"
  mentorId: 'zumbi' | 'luizgama' | 'carolina';
  collectible: { texture: string; name: string; namePlural: string };
  required: number;         // coletáveis obrigatórios para abrir o portal
  diary?: boolean;          // HUD mostra o contador como diário (fase 3)
  palette: { sky: number; ground: number; block: number; accent: number };
  theme: 'quilombo' | 'saopaulo' | 'caninde';  // conjunto de texturas de cenário
  landmarks: Landmark[];    // cenário posicionado à mão (ex.: paliçada, cabana); x em tiles
  map: string[];
}
```

`LevelBuilder` lê e valida o mapa (linhas do mesmo tamanho, exatamente 1 `P` e 1 `G`) e devolve os pontos de spawn; quem cria as entidades é a `GameScene`. **Colisão de sólidos via static group**, com um corpo por sequência horizontal de tiles sólidos. Nas colunas cobertas por um marco `building`, o telhado tem quina reta (sem a grama que dobra para fora do prédio).

`Scenery` desenha parallax e enfeites a partir do `theme`. Se as texturas do tema não existirem, ele não desenha nada e a fase fica só com a cor do céu da paleta (fallback aceitável).

Cada fase: ~**120–160 tiles de largura** × **17 tiles de altura** (544 px). Curta: 1 a 2 minutos para jogar.

**Curva de dificuldade:** a fase 1 era para ser bem fácil (limite de 3 inimigos), mas o usuário achou fácil demais ao testar e **pediu mais desafio**: hoje tem 8 Desinformações, uma ponte quebrada e um buraco extra, mantendo o começo seguro (sem buracos longos nem inimigos nos primeiros 30 tiles) e 2 checkpoints.

**Alcance do player (para desenhar mapas):**
- Pulo simples sobe ~120 px: vence degraus de até **3 tiles**.
- Com aú sobe ~200 px: vence degraus de **4–6 tiles**. Degrau de 4+ tiles **obriga** o aú; na fase 1, ofereça antes um trecho onde o aú é opcional.
- Distância horizontal de um pulo simples correndo: ~6 tiles. Buracos de 3 tiles são confortáveis.
- `NOAU=1` e `NOCROUCH=1` na ferramenta desligam o aú e a esquiva, para ver o que cada um exige. O rolê não é simulado.
- **Sempre rode `node tools/reachability.mjs <fase>`** depois de mexer num mapa (índice da fase a partir de 0): ele simula pulos e aú e lista coletáveis e portal inalcançáveis. É obrigatório nas fases 2 e 3, onde os coletáveis abrem o portal.

---

## 6. As 3 fases

### Fase 1: Serra da Barriga · Século XVII · Mentor: Zumbi dos Palmares
- **Cenário:** mata, morros e paliçadas de madeira do Quilombo dos Palmares. Fase com bastante subida (plataformas em escada).
- **Coletável:** símbolo **Sankofa** (amarelo/dourado). `required: 0`, opcional e só para pontuação. Há **10** no mapa, espalhados pelo caminho: arco no início, arcos sobre buracos para mostrar a trajetória do pulo e alguns em plataformas altas como recompensa do aú.
- **Ensina:** ginga, pular, aú (pulo duplo), derrotar inimigo pulando em cima e com a **meia-lua de compasso**.
- **Inimigos:** só Desinformação (8 no mapa; ver curva de dificuldade na seção 5).
- Paleta: céu laranja-entardecer, chão terroso, vegetação verde.

### Fase 2: São Paulo · Século XIX · Mentor: Luiz Gama
- **Cenário:** casarões, telhados e ruas de pedra; perto do fim, um prédio da faculdade de Direito.
- **Coletável:** **cartas de alforria** (pergaminho bege). `required: 5`, com exatamente 5 no mapa.
- **Mecânica especial:** existem 5 NPCs (`N`) na fase. Ao coletar uma carta, o NPC mais próximo ainda não libertado muda de cor (de cinza para colorido), pula e mostra um balão "Livre!". Simples: um evento de troca de textura e um tween.
- **Inimigos:** Desinformação + Esquecimento (apresentar o primeiro Esquecimento sozinho, em terreno plano, para o jogador entender que precisa da meia-lua).
- **Ensina:** **esquiva** (vãos de 1 tile sob telhados e sacadas) e **rolê**.
- Paleta: céu azul-acinzentado, pedra cinza, telhados terracota.

### Fase 3: Canindé → cidade moderna · Século XX · Mentor: Carolina Maria de Jesus
- **Cenário:** começa na favela do Canindé (barracos coloridos de tábua e zinco, varais, tapumes) e termina numa cidade moderna com uma grande biblioteca (o portal: porta de vidro com o livro dourado). O fundo vai da favela à cidade aos poucos (`transition` no `LevelConfig`, em tiles): `hills/mid/near-caninde` são texturas compridas em que barracos e prédios se misturam com chance crescente, movidas só pelo `scrollFactor` (largura calculada por `longWidth` em `themes/caninde.ts`, usando `PARALLAX` de `art/parallax.ts`); o primeiro plano (tapume → guarda-corpo) troca por dissolução suave.
- **Mapa (150 tiles):** viela inicial segura, telhado de zinco baixo opcional (esquiva, página 2), degrau e laje de barraco, **viaduto de concreto com passagem de 1 tile (esquiva obrigatória)**, rua com Esquecimentos, sequência de 3 prédios de alturas diferentes com vãos de 3–4 tiles, rua com checkpoint e **prédio de 5 tiles (aú obrigatório)**, escada até o patamar da biblioteca. 9 inimigos (5 Desinformações, 4 Esquecimentos), 3 checkpoints, 10 páginas (4 delas em lugares opcionais).
- **Coletável:** **folhas de papel** (branco). `required: 8`, com 10 no mapa (folga).
- **Mecânica especial:** o HUD mostra um diário que vai sendo preenchido (ex.: "Diário: 5/8 páginas"). Ao completar, mostrar o aviso "O diário está completo! Siga até a biblioteca."
- **Inimigos:** mistura dos dois, um pouco mais desafiadora, mas justa.
- **Desafio:** combina todos os movimentos (varais baixos para esquiva/rolê, sequências de inimigos para a meia-lua, pulos com aú).
- Paleta: céu claro, cores vibrantes nos barracos, cinza-azulado na parte moderna.

---

## 7. Fluxo de cenas

```
Boot → Menu → Story(prólogo) → [Intro → Game(+HUD) → Card → Story(ligação)] ×3 → Story(epílogo) → Victory
                         ↓ sem vidas
                     GameOver → Intro (mesma fase) | Menu
(a ligação só existe entre as fases 1→2 e 2→3; a escolha de fase pula o prólogo e as ligações)
```

- **MenuScene:** layout enxuto: título "SANKOFA" e subtítulo à esquerda (separados pela faixa de padrão africano), três opções ("Jogar", "Escolher fase", "Como jogar"; ↑↓ + Enter ou mouse, com barra dourada na ativa), o símbolo Sankofa grande flutuando à direita e uma linha curta no rodapé ("Dia da Consciência Negra · 20 de novembro"). O fundo (`MenuBackdrop`: cenário da fase 1 em movimento lento e véu escuro à esquerda) é comum ao menu, ao seletor e à ajuda.
- **HelpScene:** "Como jogar", com os controles em teclas desenhadas e duas dicas; Enter, Esc ou clique voltam.
- **LevelSelectScene:** tela "Escolher fase" aberta pelo menu (mesmo estilo do menu, com a época sob o nome da fase): lista as 3 fases (todas liberadas) e "Voltar"; ↑↓ + Enter, mouse ou teclas 1, 2 e 3; Esc volta. Começa com vidas e pontuação zeradas e passa pela Intro; **segurar Shift ao escolher pula a Intro** e vai direto ao jogo (atalho de teste). Se não quiser expor na versão final, é só tirar o botão do menu.
- **StoryScene:** cena de história com caixa de fala (`DialogueBox`, a mesma da Intro), retrato de quem fala (o sprite do protagonista, o símbolo Sankofa ou a silhueta de um mentor) e fundo por clima: presente ao entardecer (prólogo), viagem no tempo com poeira dourada (ligações) e presente ao amanhecer (epílogo). Os textos ficam em `STORIES` (`texts.ts`); recebe `{ storyId, next }`. O jogo começa pelo prólogo (botão Jogar); a escolha de fase não passa por ele.
- **IntroScene:** fundo na paleta da fase, nome da fase + época, retrato placeholder do mentor (silhueta estilizada, **não tentar desenhar o rosto da pessoa real**) e 2–3 falas curtas avançadas com Enter/Espaço.
- **HudScene:** vidas, contador do coletável (`3/5` quando há `required`, ou só o número quando não há) e nome da fase.
- **PauseScene / GameOverScene:** no estilo do menu (ver acima). Pausa: "Continuar" e "Menu", Esc/P retomam. Game Over: subtítulo do Sankofa, "Tentar de novo (fase atual)" e "Menu".
- **CardScene:** carta histórica em formato de cartão centralizado (seção 8), com "Pressione Enter para continuar".
- **VictoryScene:** mensagem final sobre o significado de **Sankofa** ("voltar e buscar o que ficou para trás": conhecer o passado para construir o futuro), pontuação total e créditos.

Transições com `fadeOut`/`fadeIn` da câmera (300 ms).

---

## 8. Textos (`src/data/texts.ts`)

> `src/data/texts.ts` já existe e é a **fonte da verdade** dos textos (mentores, cartas, menu, game over); esta seção fica só como rascunho original.

> ⚠️ Textos históricos são **rascunhos**. Revisar com fontes confiáveis (Fundação Cultural Palmares, Museu Afro Brasil, professor) antes da apresentação. Manter o texto curto: a carta precisa caber na tela e ser lida em ~20 segundos.

### Mentores (falas da IntroScene) — o protagonista "encontra" o mentor; falas inspiradas, não citações reais
- **Zumbi (fase 1):**
  1. "Bem-vindo a Palmares. Aqui, quem chegou buscando liberdade construiu uma vida nova."
  2. "Subir esta serra exige coragem. Use a ginga: pule e, no ar, pule de novo."
  3. "Se a desinformação cruzar seu caminho, gire a meia-lua (J). Siga em frente."
- **Luiz Gama (fase 2):**
  1. "Me tiraram a liberdade quando eu era criança. Com estudo, eu a recuperei."
  2. "Agora uso a lei para libertar outras pessoas."
  3. "Encontre as 5 cartas de alforria. Nas passagens baixas, abaixe na esquiva (↓) ou faça o rolê (K)."
- **Carolina Maria de Jesus (fase 3):**
  1. "Eu catava papel para sobreviver. Nesses papéis, eu escrevia minha vida."
  2. "Escrever é ter voz. Me ajude a completar o diário: junte 8 páginas."
  3. "Depois, siga até a biblioteca. O mundo precisa ler essas histórias."

### Cartas históricas (CardScene)
- **Zumbi dos Palmares**
  Zumbi foi o último grande líder do Quilombo dos Palmares, na Serra da Barriga (atual Alagoas), um dos maiores quilombos das Américas, que resistiu por décadas. Foi morto em 20 de novembro de 1695. Essa data deu origem ao Dia Nacional de Zumbi e da Consciência Negra, feriado nacional desde 2024.
- **Luiz Gama (1830–1882)**
  Nasceu livre em Salvador, mas foi vendido como escravizado aos 10 anos. Aprendeu a ler, provou na Justiça que tinha direito à liberdade e estudou Direito por conta própria. Atuando nos tribunais, ajudou a libertar centenas de pessoas. Em 2015, a OAB o reconheceu oficialmente como advogado.
- **Carolina Maria de Jesus (1914–1977)**
  Catadora de papel na favela do Canindé, em São Paulo, escrevia diários sobre a fome e o cotidiano. Em 1960 eles viraram o livro *Quarto de Despejo*, um sucesso de vendas traduzido para mais de dez idiomas. Carolina é hoje uma das autoras mais importantes da literatura brasileira.

---

## 9. Visual placeholder (gerado na BootScene)

- **Player:** pixel art 40×50 desenhada em texto em `src/art/playerArt.ts`; cor de pele marrom (`#6b4226`), camiseta amarela (`#f2b705`), calça branca de capoeira (`#f5e6c8`) com cordão verde na cintura (`#1e7a3c`). Poses: parado (+ piscar), corrida (2 frames), subindo, caindo e aú (estrela). Os movimentos de capoeira usam **tweens** (rotação, squash) sobre essas poses; uma pose nova só se o tween não bastar. Cores do player em `PLAYER_COLORS` (`palette.ts`).
- **Sankofa:** coração estilizado dourado (aproximação simples do símbolo Adinkra) com leve flutuação (tween em `y`).
- **Carta de alforria:** retângulo bege com linhas.
- **Folha de papel:** retângulo branco com dobra no canto.
- **Inimigos:** blob escuro (roxo-acinzentado) com dois olhos brancos.
- **NPC:** silhueta simples cinza (preso) que vira colorida (livre).
- **Portal:** arco; apagado quando trancado, brilhante quando aberto. Cada tema pode ter o seu (`portal-<tema>-locked|open`; sem arte própria, cai no arco padrão): na fase 2 é a porta da faculdade (pilastres, frontão e friso de padrão africano).
- **Plataformas flutuantes (`B`):** por padrão, troncos amarrados; cada tema pode trocar (`THEME_BLOCKS` em `tileArt.ts`): na fase 2 são sacadas de sobrado (tampo de pedra, grade de ferro e mísulas).
- **Fundo:** parallax com formas simples (morros, casas, prédios) na paleta da fase. A fase 1 (tema `quilombo`) já tem céu em gradiente, 6 camadas, sol, nuvens, pássaros, pólen, árvores, paliçadas e cabanas. As fases 2 (`saopaulo`) e 3 (`caninde`) ganharam arte própria no Marco 3, no mesmo modelo (ver seção 11).
- **Detalhe de identidade:** faixa decorativa com padrões geométricos inspirados em tecidos africanos na borda do HUD e no menu.

Paleta global em `palette.ts`: dourado `#f2b705`, verde `#1e7a3c`, vermelho `#c0392b`, terra `#7a4a2a`, preto `#1a1a1a`, creme `#f5e6c8`.

## 10. Áudio (Marco 4, opcional)

- Efeitos curtos gerados com **Web Audio API** (oscilador simples): pulo, coletar, dano, portal aberto.
- Sem arquivos de música no MVP. Se sobrar tempo, adicionar uma trilha royalty-free em `public/audio/` (verificar a licença).
- Tecla M muta tudo, respeitando a política de autoplay (o áudio só começa após a primeira interação).

---

## 11. Marcos (implementar em ordem, um por vez)

### Marco 1: Base jogável (meta: até 04/11) ✅
- [x] Setup Vite + TS + Phaser, `npm run dev` funcionando
- [x] BootScene gerando texturas placeholder (inclui inimigos, NPCs, coletáveis, portal e checkpoint)
- [x] `LevelBuilder` lendo o mapa ASCII
- [x] Player com a física base da seção 3 (andar, pulo variável, coyote, buffer, aú) e a ginga
- [x] Máquina de estados do Player já preparada para os demais movimentos
- [x] Fase 1 montada com câmera (e já com a arte de cenário do Marco 3)
- **Pronto quando:** dá para atravessar a fase 1 do início ao portal só pulando

### Marco 2: Sistemas e conteúdo (meta: até 11/11)
Ordem sugerida (cada passo deixa o jogo jogável):
- [x] `GameState` (vidas, fase, pontuação) + vidas, invencibilidade, checkpoint e buracos
- [x] Inimigos (patrulha, stomp, dano, Esquecimento imune a stomp)
- [x] Meia-lua de compasso (com hit-stop); usa por ora a pose de estrela do aú como placeholder
- [x] Esquiva (sem teste em fase ainda: a fase 1 não tem vãos baixos)
- [ ] Rolê, se houver tempo (seção 3.1)
- [x] Coletáveis + portal trancado/aberto
- [x] HudScene (inclui a faixa decorativa de padrão geométrico na borda)
- [x] Menu, Intro e GameOver (Intro → Game → GameOver | Menu; retrato do mentor é uma silhueta placeholder)
- [x] Card e Victory (layout simples, polimento no Marco 3); o portal leva à Card, que segue para a Intro da próxima fase ou, na última, para a Victory. Créditos já trazem Nathan Domingues; pendente incluir os demais integrantes da equipe, se houver (`VICTORY_TEXTS` em `texts.ts`)
- [x] Fase 2 (São Paulo): 140 tiles, 5 cartas, 5 NPCs libertados pelo coletável mais próximo, túnel de 1 tile obrigatório (esquiva), sacada baixa opcional com a carta 3, 3 Esquecimentos e 4 Desinformações; sem arte de cenário própria (só a paleta)
- [x] Fase 3 (Canindé → cidade moderna): 150 tiles, 10 folhas (8 obrigatórias), diário no HUD ("Diário: 5/8 páginas") e aviso ao completar; varal baixo opcional, viaduto de 1 tile obrigatório (esquiva), prédio de 5 tiles obrigatório (aú), sequência de inimigos para a meia-lua; sem arte de cenário própria
- **Pronto quando:** dá para jogar do menu até os créditos sem travar ✅ (verificado por teste automatizado percorrendo as 3 fases; só falta o rolê, opcional)

> Nota: a fala do Luiz Gama não menciona mais o rolê (K), porque ele não foi implementado. Se o rolê entrar, voltar a citá-lo em `texts.ts`.

> **Regra de escopo:** nada de arte de cenário nova no Marco 2. Placeholder simples basta até o fluxo completo funcionar.

### Marco 3: Visual e identidade (meta: até 15/11)
- [ ] Temas de cenário: `saopaulo` **aprovado** e `caninde` **aprovado**, seguindo o modelo de `art/themes/quilombo.ts`. O `Scenery.ts` já é dirigido por tema (`THEME_FX`: sol e pólen opcionais; `transition` na fase para o fundo mudar de cenário; marcos com variantes; `building` pinta a fachada de prédios sobre os tiles sólidos, com a altura vinda do mapa)
- [ ] Padrões decorativos, animações e tweens
- [x] História do protagonista (feita e **aprovada**; nome, tom, gancho e final definidos pelo usuário): prólogo antes da fase 1, ligações entre as fases 1→2 e 2→3 e epílogo antes da `VictoryScene`, tudo na `StoryScene`. Textos em `STORIES`, revisáveis pelo grupo. Ilustrações do protagonista só se sobrar tempo
- [ ] Polir as telas de fim de fase (hoje layout simples): aviso "Fase concluída!", `CardScene` e `VictoryScene`. O **fluxo funcional** (portal → Card → próxima fase → Victory) continua no Marco 2
- [ ] **Design e animações do protagonista** (vem logo depois das telas de fim de fase): hoje o Aiyê é um sprite 40×50 com poucas poses (parado, corrida de 2 frames, subindo, caindo e estrela do aú) e os movimentos de capoeira são só tweens de rotação e squash. Objetivos: refinar o desenho (silhueta, proporção, rosto, cabelo, roupa e cordão, mantendo as cores de `PLAYER_COLORS`), mais frames e fluidez na corrida, ginga parada com mais personalidade, e poses/animações próprias para os golpes e a esquiva (ver o item de poses abaixo, que passa a ser feito aqui). Respeitar a regra do `Player` (a hitbox 22×40 não muda com a arte) e o retrato do protagonista nas cenas de história, que usa o mesmo sprite. **O usuário aprova antes do commit**
- [ ] Design dos coletáveis (hoje placeholders): Sankofa mais fiel ao símbolo Adinkra em vez do coração simples, e brilho/partículas ao coletar; carta de alforria e folha de papel também
- [x] Redesign do menu principal (feito, aprovado: menu enxuto à esquerda com o símbolo à direita, controles movidos para "Como jogar", seletor de fases e ajuda no mesmo estilo; Pausa e Game Over alinhados ao mesmo estilo: título grande e faixa à esquerda, opções com barra dourada; a Pausa escurece o jogo parado com o véu à esquerda e o Game Over usa o fundo do menu mais escuro, com o símbolo apagado). Pedido original: tinha informação demais (título, subtítulo, botão, dica, controles, seletor e frase) e o visual não era moderno. Objetivos: menos elementos na tela (os controles podem ir para uma tela de ajuda ou para a Pausa), hierarquia clara, botões mais limpos, composição e animação de fundo mais atuais; manter a identidade (Sankofa, faixa de padrão africano, paleta). Aproveitar para alinhar a `LevelSelectScene` e as telas de Pausa/GameOver ao mesmo estilo. **O usuário aprova antes do commit**
- [ ] Design dos NPCs (hoje placeholder de retângulos, igual para os 5 e sem rosto): pixel art com 5 variações (cabelo, roupa, rosto), estado preso (postura curvada, corrente nos pulsos) e livre (colorido, braços para cima, brilho ao libertar), com dignidade e sem estereótipos. **Decisão do usuário: fazer depois de finalizar o level design das 3 fases**
- [ ] (feito dentro do item "Design e animações do protagonista", acima) Poses próprias dos movimentos de capoeira, hoje placeholders: esquiva (agachado em vez de só achatar o `scaleY`), meia-lua (bananeira em vez da pose de estrela do aú) e rolê (se for implementado)
- [ ] Refazer o level design das **3 fases**, deixando-as mais bonitas e mais desafiadoras. Hoje os mapas são funcionais e simples (fase 2: ruas, quatro telhados e um túnel; fase 3: trechos retos com um viaduto e um prédio). Objetivos:
  - **Mais bonitas:** variedade de alturas e silhuetas, composição pensada em camadas (primeiro plano, plataformas, fundo), marcos visuais por trecho (paliçadas e cabanas, casarões e sacadas, barracos e varais, a biblioteca ao fim), coletáveis posicionados para guiar o olhar; combinar com os temas de cenário das fases 2 e 3
  - **Mais desafiadoras, mas justas:** curva de dificuldade crescente dentro de cada fase e entre as fases (a fase 1 continua fácil para a apresentação), combinações de movimentos (aú + meia-lua, esquiva entre inimigos), plataformas móveis ou sequências de precisão só se couberem no prazo, sem pulos cegos nem mortes injustas
  - **Andamento:** fase 1 **aprovada** (colinas, ponte quebrada, 8 inimigos, 2 checkpoints); fase 2 refeita com tema de São Paulo (150 tiles, 2 túneis baixos obrigatórios, rota alta de sacadas, 4 telhados, escadaria até a faculdade, 8 inimigos, portal da faculdade e sacadas de ferro; **aprovada**, exceto o design dos NPCs, que fica para o item próprio); fase 3 refeita com tema do Canindé e cidade moderna (viaduto, prédio de 5 tiles, 9 inimigos, 3 checkpoints; **aprovada**). **Level design das 3 fases concluído**
  - **Processo:** rodar `node tools/reachability.mjs <fase>` a cada mudança (inclusive `NOAU=1` e `NOCROUCH=1` para saber o que cada movimento exige); manter coletáveis obrigatórios alcançáveis; **o usuário testa e aprova cada fase antes do commit**
- [ ] Ajuste fino do game feel e da dificuldade
- [x] Pausa (Esc/P): `PauseScene` por cima da GameScene parada, com "Continuar" e "Menu"
- [ ] **Revisão geral** (último passo do Marco 3, depois de todos os outros): jogar o jogo inteiro do menu aos créditos, nas 3 fases, e fechar pendências antes do Marco 4. Checklist:
  - textos históricos (mentores, cartas) revisados com fontes confiáveis (Fundação Cultural Palmares, Museu Afro Brasil, professor) e sem nada apresentado como citação real
  - créditos completos (incluir os demais integrantes da equipe, se houver) e frase do Dia da Consciência Negra conferida
  - consistência visual entre menu, seletor de fases, Intro, HUD, Pausa, GameOver, Card e Victory
  - dificuldade e game feel: nenhuma morte injusta, checkpoints bem colocados, fase 1 ainda acessível para a apresentação
  - `node tools/reachability.mjs` nas 3 fases (com `NOAU=1` e `NOCROUCH=1`), `npm run build` sem erros e teste automatizado percorrendo o jogo todo
  - limpeza: itens ou textos que citam recursos não implementados (ex.: rolê), TODOs soltos e o `CLAUDE.md` atualizado com o estado final

### Marco 4: Som e entrega (meta: até 17/11, **congelamento**)
- [ ] Efeitos sonoros e mute
- [ ] `npm run build` sem erros, testar o `dist/` servido localmente
- [ ] Deploy (itch.io: zip do `dist/` como projeto HTML; ou Netlify)
- [ ] Testar no Chrome e no Firefox, em telas 1366×768 e 1920×1080

**Se o prazo apertar, cortar nesta ordem:**
1. Rolê
2. Arte de cenário das fases 2 e 3 (ficam só com a paleta)
3. Áudio
4. Fase 3 inteira (é melhor apresentar 2 fases polidas do que 3 quebradas)

---

## 12. Fora do escopo (v2)

Combos e novos golpes de capoeira (armada, queixada), mecânica de ritmo com berimbau, chefe final, controles touch/mobile, salvamento de progresso, assets definitivos em pixel art.

## 13. Cuidados de conteúdo

- Nada de estereótipos nem de sofrimento como mecânica "divertida". O foco é **resistência, conhecimento e conquista**.
- Inimigos são sempre conceitos abstratos.
- Não usar nenhum asset, som, nome ou personagem da Nintendo. Só o estilo de gameplay é referência.
- Personalidades reais aparecem só como mentores em silhueta estilizada, com falas claramente inspiradas e não apresentadas como citações.
