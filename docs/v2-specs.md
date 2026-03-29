# ClipFlow - Auditoria Tecnica Completa & Especificacao ClipGen

**Versao:** 1.0.0
**Data:** 28 de Marco de 2026
**Autor:** Auditoria Automatizada com Claude Opus 4.6
**Escopo:** Analise completa do codigo-fonte, arquitetura, seguranca, performance e planejamento da feature de geracao de cortes inteligentes (ClipGen)

---

## Sumario Executivo

Este documento contem duas entregas principais:

1. **Auditoria Tecnica Completa** do projeto ClipFlow, cobrindo todos os pacotes do monorepo (server, app, shared, remotion, mcp), com identificacao de bugs criticos, vulnerabilidades de seguranca, problemas de performance, gaps de implementacao e recomendacoes priorizadas de correcao.

2. **Especificacao Tecnica da Feature ClipGen** - sistema de geracao automatica de cortes curtos (TikTok/Shorts/Reels) a partir de videos longos de ate 30 minutos, com analise inteligente de transcricao, deteccao de momentos-chave, e rendering automatizado com legendas.

---

## PARTE 1: AUDITORIA TECNICA DO CLIPFLOW

---

### 1.1 Visao Geral da Arquitetura

O ClipFlow e um monorepo gerenciado com pnpm + Turborepo contendo 5 pacotes:

| Pacote | Funcao | Stack Principal |
|--------|--------|-----------------|
| `@clip/app` | Frontend SPA | React 19, Vite 6, Tailwind 4, Zustand 5 |
| `@clip/server` | API Backend | Fastify, Drizzle ORM, SQLite (better-sqlite3) |
| `@clip/shared` | Tipos e Schemas | TypeScript, Zod |
| `@clip/remotion` | Composicoes de Video | Remotion 4.x, React |
| `@clip/mcp` | Integracao Claude MCP | @modelcontextprotocol/sdk |

**Dependencias Externas:** FFmpeg (processamento de video), WhisperX (transcricao via Python), Claude API (analise de IA)

---

### 1.2 Problemas Criticos Encontrados

#### 1.2.1 SEGURANCA - Severidade CRITICA

**SEC-001: WebSocket sem autenticacao**
- Arquivo: `packages/server/src/plugins/websocket.ts`
- Problema: Qualquer cliente pode se conectar ao WebSocket e receber dados sensiveis de progresso de todos os projetos.
- Impacto: Vazamento de informacoes de projetos e status de processamento.
- Correcao: Implementar autenticacao JWT no handshake do WebSocket. Validar token antes de aceitar conexao. Filtrar broadcasts por projeto/usuario.

**SEC-002: Path Traversal no download de renders**
- Arquivo: `packages/server/src/routes/render.ts`
- Problema: O campo `render.outputPath` nao e validado. Um atacante poderia manipular o caminho para ler arquivos arbitrarios do sistema (ex: `/etc/passwd`).
- Impacto: Leitura nao autorizada de qualquer arquivo do servidor.
- Correcao: Validar que o path esta dentro de `PATHS.renders` usando `path.relative()` e verificar que nao comeca com `..`.

**SEC-003: Validacao MIME insuficiente no upload**
- Arquivo: `packages/server/src/routes/upload.ts`
- Problema: Extensao do arquivo vem do input do usuario sem whitelist. MIME type facilmente falsificavel. Nenhuma validacao do conteudo real do arquivo (magic bytes).
- Impacto: Upload de arquivos maliciosos disfarfados de video.
- Correcao: Whitelist de extensoes (`.mp4`, `.mov`, `.webm`, `.avi`). Validar magic bytes do arquivo. Adicionar escaneamento de virus.

**SEC-004: Prompt Injection no servico Claude**
- Arquivo: `packages/server/src/services/claude.service.ts`
- Problema: Instrucoes do usuario sao concatenadas diretamente no system prompt sem sanitizacao.
- Impacto: Usuario pode injetar instrucoes para manipular a analise da IA.
- Correcao: Separar instrucoes do usuario em mensagem `user` dedicada. Sanitizar input removendo padroes de injection conhecidos.

**SEC-005: PATCH wildcard em projetos**
- Arquivo: `packages/server/src/routes/projects.ts`
- Problema: `db.update(projects).set({ ...request.body })` aplica qualquer campo do body diretamente. Usuario pode alterar `status`, `templateId`, ou qualquer campo protegido.
- Impacto: Manipulacao de estado de projetos, bypass de validacoes de workflow.
- Correcao: Whitelist de campos permitidos no PATCH. Validar cada campo antes de aplicar.

**SEC-006: Arquivos estaticos sem controle de acesso**
- Arquivo: `packages/server/src/plugins/static.ts`
- Problema: Todos os uploads e renders sao servidos publicamente sem autenticacao.
- Impacto: Qualquer pessoa com a URL pode baixar qualquer video ou render.
- Correcao: Middleware de autenticacao antes das rotas estaticas. URLs assinadas com expiracao.

**SEC-007: Command injection potencial no system check**
- Arquivo: `packages/server/src/routes/settings.ts`
- Problema: `execSync()` usado para verificar disponibilidade de ferramentas. Embora atualmente com comandos fixos, o padrao e perigoso.
- Impacto: Se expandido com input do usuario, permite execucao de comandos arbitrarios.
- Correcao: Substituir execSync por verificacoes seguras (fs.existsSync, require).

**SEC-008: Batch processing nao valida caminhos de video**
- Arquivo: `packages/server/src/routes/batch.ts` e `services/batch.service.ts`
- Problema: `videoPaths` aceita qualquer string sem validar que o arquivo existe, e acessivel, e esta dentro do diretorio de uploads.
- Impacto: Leitura de arquivos arbitrarios do sistema.
- Correcao: Validar que cada path esta sob `PATHS.uploads` e que o arquivo existe.

---

#### 1.2.2 INTEGRIDADE DE DADOS - Severidade ALTA

**DAT-001: Race conditions em atualizacoes de status**
- Arquivos: `routes/analysis.ts`, `routes/transcription.ts`
- Problema: O padrao check-then-update nao e atomico. Duas requisicoes simultaneas podem passar pela verificacao de status e iniciar processamento duplicado.
- Correcao: Usar UPDATE atomico com WHERE condicional: `UPDATE projects SET status = 'analyzing' WHERE id = ? AND status != 'analyzing'` e verificar rowsAffected.

**DAT-002: Foreign keys sem cascade delete**
- Arquivo: `packages/server/src/db/schema.ts`
- Problema: Tabelas `scenes`, `transcriptions`, `renders`, `batchItems` referenciam `projects.id` mas sem `ON DELETE CASCADE`. Deletar um projeto deixa registros orfaos.
- Correcao: Adicionar `{ onDelete: 'cascade' }` em todas as foreign keys.

**DAT-003: Operacoes multi-step sem transacao**
- Arquivos: `routes/scenes.ts`, `routes/analysis.ts`
- Problema: Delete + Insert de scenes nao usa transacao. Se o processo falhar no meio, o projeto fica com scenes parciais ou nenhuma scene.
- Correcao: Envolver operacoes em `db.transaction()`.

**DAT-004: Campos JSON sem validacao de schema**
- Arquivo: `packages/server/src/db/schema.ts`
- Problema: Campos como `effects`, `compositionProps`, `settings`, `shadowConfig` armazenam JSON como string sem validacao. Qualquer conteudo invalido pode ser salvo.
- Correcao: Criar schemas Zod para cada campo JSON e validar antes de salvar.

**DAT-005: Sem soft delete**
- Problema: Deletar projetos, templates ou renders e permanente. Nao ha trail de auditoria.
- Correcao: Adicionar campo `deletedAt` em tabelas criticas. Filtrar queries para excluir registros deletados.

**DAT-006: Sem indexes no banco de dados**
- Arquivo: `packages/server/src/db/schema.ts`
- Problema: Nenhum index definido. Queries em `projectId`, `status`, `batchJobId`, `createdAt` serao lentas com volume de dados.
- Correcao: Adicionar indexes em foreign keys e campos frequentemente filtrados.

---

#### 1.2.3 PERFORMANCE - Severidade MEDIA-ALTA

**PERF-001: WebSocket broadcast para todos os clientes**
- Problema: Cada mensagem de progresso e enviada para TODOS os clientes conectados, mesmo os que nao estao no projeto relevante.
- Correcao: Implementar sistema de rooms/channels. Cliente se inscreve no projeto especifico.

**PERF-002: Operacoes sincronas bloqueando event loop**
- Arquivos: `db/index.ts`, `config.ts`
- Problema: `mkdirSync`, `sqlite.exec()` bloqueiam o event loop durante startup.
- Correcao: Converter para versoes async. Usar `fs.promises.mkdir`.

**PERF-003: Sem paginacao em endpoints de listagem**
- Arquivos: `routes/projects.ts`, `routes/batch.ts`, `routes/templates.ts`
- Problema: Todas as listagens retornam TODOS os registros. Com centenas de projetos, a resposta sera lenta.
- Correcao: Implementar paginacao com `limit` e `offset`. Retornar total de registros no header.

**PERF-004: Timeline sem virtualizacao**
- Arquivo: `packages/app/src/components/timeline/CaptionTrack.tsx`
- Problema: Todos os words do caption sao renderizados no DOM, mesmo os que estao fora da viewport. Videos longos com 1000+ palavras causam lag severo.
- Correcao: Implementar windowing/virtualizacao. Renderizar apenas words visiveis no viewport atual.

**PERF-005: Remotion bundle cacheado indefinidamente**
- Arquivo: `packages/server/src/services/remotion.service.ts`
- Problema: O bundle e cacheado em memoria e nunca invalidado. Atualizacoes de composicoes nao sao refletidas.
- Correcao: Adicionar versionamento do bundle. Invalidar cache quando arquivos de composicao mudam.

**PERF-006: Geracao de thumbnail bloqueando upload**
- Arquivo: `packages/server/src/routes/upload.ts`
- Problema: Thumbnail e gerada sincronamente durante o upload. O cliente espera ate a thumbnail estar pronta.
- Correcao: Gerar thumbnail de forma assincrona. Retornar resposta de upload imediatamente.

**PERF-007: Logger com pretty-printing em todos os ambientes**
- Arquivo: `packages/server/src/utils/logger.ts`
- Problema: pino-pretty ativo sempre. Em producao, serializar JSON e mais eficiente.
- Correcao: Condicionar pretty-printing ao `NODE_ENV !== 'production'`.

**PERF-008: Componentes de caption sem memoizacao**
- Arquivos: `packages/remotion/src/components/*.tsx`
- Problema: AnimatedCaption, KaraokeCaption, PopCaption, GlowCaption recalculam `visibleWords` a cada frame sem React.memo ou useMemo.
- Correcao: Envolver com React.memo e memoizar calculos de visibilidade.

---

#### 1.2.4 BUGS FUNCIONAIS - Severidade MEDIA

**BUG-001: Duracao de composicao Remotion hardcoded**
- Arquivo: `packages/remotion/src/Root.tsx` (linha 32)
- Problema: `durationInFrames` fixo em `30 * 30` (900 frames = 30s). Nao reflete a duracao real do video. Videos mais longos serao cortados.
- Correcao: Calcular duracao dinamicamente a partir das composition props.

**BUG-002: CaptionComponent null crash**
- Arquivo: `packages/remotion/src/compositions/ReelComposition.tsx`
- Problema: Se `captionAnimation === 'none'`, o map retorna `null`, mas o codigo tenta renderizar `<CaptionComponent />` sem null check.
- Correcao: Adicionar verificacao `if (!CaptionComponent) return null` antes de renderizar.

**BUG-003: ZoomEffect math incorreto**
- Arquivo: `packages/remotion/src/components/ZoomEffect.tsx`
- Problema: Calculo de translate nao leva em conta o fator de escala. Quando scale=2x, o panning fica desproporcional.
- Correcao: Multiplicar translate pelo (scale - 1) para compensar a ampliacao.

**BUG-004: Karaoke Caption stroke invisivel**
- Arquivo: `packages/remotion/src/components/KaraokeCaption.tsx`
- Problema: WebkitBackgroundClip + WebkitTextFillColor anulam o stroke CSS. Texto fica invisivel se nao houver contraste entre highlightColor e background.
- Correcao: Usar SVG masking ou mix-blend-mode ao inves de WebkitBackgroundClip.

**BUG-005: WebSocket handler null assignment**
- Arquivo: `packages/app/src/hooks/useWebSocket.ts`
- Problema: `null as unknown as (connected: boolean) => void` e um cast inseguro. Pode causar crash se o handler for invocado apos unsubscribe.
- Correcao: Armazenar referencia do handler e usar cleanup function adequada.

**BUG-006: Pagina History vazia**
- Arquivo: `packages/app/src/pages/History.tsx`
- Problema: Pagina completamente stub. Mostra "No exports yet" sem nenhuma logica de fetch.
- Correcao: Implementar query de historico de renders com paginacao.

**BUG-007: Export quality nao utilizada**
- Arquivo: `packages/app/src/components/export/ExportDialog.tsx`
- Problema: Configuracao de qualidade e coletada do usuario mas nao e enviada na requisicao de render. O valor e ignorado.
- Correcao: Incluir quality settings no payload do POST de render.

**BUG-008: Templates nao podem ser aplicados pela UI**
- Arquivo: `packages/app/src/pages/Templates.tsx`
- Problema: TemplateCard recebe `onPreview` mas nunca chama `onApply`. O metodo `applyTemplate` existe no store mas nao e acessivel na UI.
- Correcao: Adicionar botao "Aplicar" no TemplateCard e conectar ao store.

**BUG-009: Typo em portugues no Sidebar**
- Arquivo: `packages/app/src/components/layout/Sidebar.tsx`
- Problema: "Portugues" ao inves de "Portugues" (falta acento). Tambem nao esta internacionalizado.
- Correcao: Usar chave i18n para o label de troca de idioma.

**BUG-010: MCP clipflow_create_video nao implementado**
- Arquivo: `packages/mcp/src/index.ts`
- Problema: Tool definido mas retorna mensagem de erro. Nao faz upload real.
- Correcao: Implementar upload via base64 encoding ou remover tool ate estar pronto.

---

#### 1.2.5 GAPS DE IMPLEMENTACAO

| ID | Descricao | Pacote | Impacto |
|----|-----------|--------|---------|
| GAP-001 | Zero testes automatizados em todo o monorepo | Todos | Regressoes nao detectadas |
| GAP-002 | Sem CI/CD configurado | Root | Sem deploy automatizado |
| GAP-003 | Sem Error Boundaries no React | app | Crashes silenciosos |
| GAP-004 | Sem autenticacao/autorizacao | server | Sem multi-usuario |
| GAP-005 | Sem rate limiting em endpoints | server | Vulneravel a DDoS |
| GAP-006 | Sem graceful shutdown | server | Perda de dados em restart |
| GAP-007 | Sem health check endpoint | server | Nao integravel com load balancers |
| GAP-008 | Sem migration system (usa CREATE IF NOT EXISTS) | server | Schema nao versionado |
| GAP-009 | Sem monitoring/metrics | server | Sem visibilidade operacional |
| GAP-010 | Sem tratamento de offline | app | WebSocket perde conexao silenciosamente |
| GAP-011 | Sem undo/redo no editor de captions | app | Perda de trabalho do usuario |
| GAP-012 | Sem deteccao de mudancas nao salvas | app | Dados perdidos ao navegar |
| GAP-013 | Sem documentacao de shortcuts | app | Funcionalidades nao descobertas |
| GAP-014 | Transicoes faltando (wipe, morph, whip_pan) | remotion | Referenciadas em niches.ts mas nao implementadas |
| GAP-015 | Sem multi-speaker color differentiation | remotion | Captions de podcasts/entrevistas prejudicadas |

---

### 1.3 Plano de Correcao Priorizado

#### Fase 1 - Correcoes Criticas (Semana 1-2)

1. Implementar validacao de path traversal em downloads (SEC-002)
2. Adicionar whitelist de extensoes e magic bytes em upload (SEC-003)
3. Corrigir race conditions com UPDATE atomico (DAT-001)
4. Adicionar cascade delete em foreign keys (DAT-002)
5. Envolver operacoes multi-step em transacoes (DAT-003)
6. Adicionar autenticacao no WebSocket (SEC-001)
7. Whitelist de campos no PATCH de projetos (SEC-005)
8. Validar paths em batch processing (SEC-008)
9. Adicionar Error Boundaries no React (GAP-003)
10. Fix duracao hardcoded no Remotion (BUG-001)

#### Fase 2 - Estabilidade (Semana 3-4)

1. Adicionar indexes no banco de dados (DAT-006)
2. Implementar paginacao em listagens (PERF-003)
3. Adicionar schemas Zod para campos JSON (DAT-004)
4. Implementar graceful shutdown (GAP-006)
5. Adicionar health check endpoint (GAP-007)
6. Corrigir WebSocket broadcast com rooms (PERF-001)
7. Converter operacoes sincronas para async (PERF-002)
8. Implementar soft delete (DAT-005)
9. Corrigir bugs Remotion (BUG-002, BUG-003, BUG-004)
10. Configurar logger por ambiente (PERF-007)

#### Fase 3 - Qualidade (Semana 5-6)

1. Implementar pagina History (BUG-006)
2. Conectar export quality ao render (BUG-007)
3. Implementar apply template na UI (BUG-008)
4. Adicionar rate limiting (GAP-005)
5. Memoizar componentes Remotion (PERF-008)
6. Implementar virtualizacao na timeline (PERF-004)
7. Adicionar undo/redo no editor (GAP-011)
8. Detectar mudancas nao salvas (GAP-012)
9. Scaffold de testes automatizados (GAP-001)
10. Configurar CI/CD basico (GAP-002)

---

## PARTE 2: ESPECIFICACAO TECNICA - CLIPGEN

### Sistema de Geracao Automatica de Cortes para TikTok/Shorts/Reels

---

### 2.1 Visao do Produto

O ClipGen e uma feature que permite ao usuario subir um video longo (ate 30 minutos) e gerar automaticamente multiplos cortes curtos (15s a 60s) otimizados para plataformas verticais (TikTok, YouTube Shorts, Instagram Reels).

O sistema utiliza analise inteligente de transcricao combinada com IA para identificar os momentos mais impactantes do video original, gerando clips autonomos com legendas estilizadas, prontos para publicacao.

**Referencia de mercado:** Opus Clip, Vizard, Klap

---

### 2.2 Requisitos Funcionais

#### RF-001: Upload de Video Longo
- Aceitar videos de ate 30 minutos de duracao
- Formatos: MP4, MOV, WebM
- Tamanho maximo: 2GB
- Exibir progresso de upload com barra de progresso
- Extrair e exibir metadados (duracao, resolucao, fps, codec)

#### RF-002: Transcricao com Timestamps
- Transcricao word-level via WhisperX
- Suporte a multiplos idiomas (auto-detect ou selecao manual)
- Timestamps por palavra com score de confianca
- Diarizacao de speakers (opcional)
- Exibir transcricao completa com timeline visual

#### RF-003: Analise Inteligente de Momentos-Chave
- Enviar transcricao completa para Claude API
- Identificar automaticamente N momentos de maior impacto
- Para cada momento identificado, retornar:
  - `startTime` e `endTime` precisos (alinhados com word timestamps)
  - `title` descritivo para o clip
  - `hookScore` (0-100) indicando potencial viral
  - `emotionalTone` (humor, drama, surprise, insight, controversy)
  - `suggestedHashtags` para a plataforma alvo
  - `hookSentence` (frase de abertura para reter audiencia)
  - `reason` (justificativa da IA para a selecao)
- Configuracoes de analise:
  - `targetDuration`: 15s, 30s, 45s, ou 60s
  - `numberOfClips`: quantidade desejada de cortes (1-20)
  - `platform`: tiktok, youtube_shorts, instagram_reels
  - `niche`: education, comedy, business, tech, lifestyle, etc.
  - `tone`: informal, professional, energetic, calm
  - `customInstructions`: instrucoes adicionais do usuario

#### RF-004: Interface de Selecao e Edicao de Clips
- Lista de clips sugeridos com scores visuais
- Preview de cada clip com player inline
- Possibilidade de ajustar startTime/endTime manualmente (drag na timeline)
- Selecao/deselecao de clips para rendering
- Reordenacao de clips por score, duracao, ou posicao no video
- Edicao do titulo e hashtags sugeridos
- Override da hookSentence

#### RF-005: Customizacao Visual dos Clips
- Selecao de estilo de legenda (karaoke, pop, glow, animated, none)
- Configuracao de fonte, tamanho, cor, sombra
- Selecao de aspect ratio (9:16 padrao, com opcao 1:1 ou 4:5)
- Adicao de progress bar visual
- Configuracao de CTA (call to action) no final
- Efeito de zoom (Ken Burns) configuravel

#### RF-006: Rendering em Lote
- Renderizar todos os clips selecionados em sequencia
- Progresso individual por clip + progresso total
- Qualidade configuravel (draft rapido, standard, high quality)
- Cancelamento individual ou total
- Download individual ou ZIP com todos os clips

#### RF-007: Re-analise e Refinamento
- Possibilidade de pedir mais clips a IA
- Refinar analise com instrucoes adicionais ("mais clips de humor", "focar na parte sobre X")
- Mesclar resultados de multiplas analises
- Salvar configuracoes de analise como presets

---

### 2.3 Requisitos Nao-Funcionais

| ID | Requisito | Metrica |
|----|-----------|---------|
| RNF-001 | Transcricao de 30min deve completar em < 10min (GPU) ou < 30min (CPU) | Tempo |
| RNF-002 | Analise IA deve completar em < 60s | Tempo |
| RNF-003 | Render de 1 clip (30s, 1080p) deve completar em < 120s | Tempo |
| RNF-004 | Interface deve ser responsiva durante processamento | UX |
| RNF-005 | Suportar processamento de ate 3 videos simultaneamente | Concorrencia |
| RNF-006 | Clips gerados devem ter qualidade >= 720p | Qualidade |
| RNF-007 | Legendas devem estar sincronizadas com precisao de +/- 50ms | Precisao |
| RNF-008 | Sistema deve funcionar offline apos transcricao (exceto IA) | Disponibilidade |

---

### 2.4 Arquitetura Tecnica

#### 2.4.1 Novo Schema do Banco de Dados

```sql
-- Tabela principal de clips
CREATE TABLE clips (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  analysis_id TEXT REFERENCES analyses(id) ON DELETE SET NULL,

  -- Timing
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  duration REAL GENERATED ALWAYS AS (end_time - start_time) STORED,

  -- Metadata da IA
  title TEXT NOT NULL DEFAULT 'Untitled Clip',
  hook_sentence TEXT,
  hook_score INTEGER DEFAULT 0,
  emotional_tone TEXT DEFAULT 'neutral',
  suggested_hashtags TEXT, -- JSON array
  ai_reason TEXT,

  -- Configuracao visual
  caption_style_id TEXT REFERENCES caption_styles(id),
  caption_animation TEXT DEFAULT 'word-highlight',
  aspect_ratio TEXT DEFAULT '9:16',
  zoom_config TEXT, -- JSON: { enabled, startX, startY, endX, endY, scale }
  cta_config TEXT, -- JSON: { enabled, text, animation }
  show_progress_bar INTEGER DEFAULT 1,

  -- Estado
  status TEXT DEFAULT 'suggested' CHECK(status IN (
    'suggested', 'selected', 'editing', 'queued',
    'rendering', 'done', 'error', 'rejected'
  )),
  order_index INTEGER DEFAULT 0,

  -- Configuracao de render
  quality TEXT DEFAULT 'standard',
  output_format TEXT DEFAULT 'mp4',
  target_platform TEXT DEFAULT 'tiktok',

  -- Output
  render_id TEXT REFERENCES renders(id),
  output_path TEXT,
  thumbnail_path TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- Indexes
CREATE INDEX idx_clips_project_id ON clips(project_id);
CREATE INDEX idx_clips_status ON clips(status);
CREATE INDEX idx_clips_analysis_id ON clips(analysis_id);
CREATE INDEX idx_clips_hook_score ON clips(hook_score DESC);

-- Tabela de analise ClipGen
CREATE TABLE clip_analyses (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  transcription_id TEXT REFERENCES transcriptions(id),

  -- Configuracao da analise
  target_duration INTEGER DEFAULT 30,
  number_of_clips INTEGER DEFAULT 5,
  target_platform TEXT DEFAULT 'tiktok',
  niche TEXT,
  tone TEXT DEFAULT 'energetic',
  custom_instructions TEXT,

  -- Resultado
  raw_response TEXT, -- JSON completo da resposta do Claude
  clips_generated INTEGER DEFAULT 0,
  model_used TEXT,
  tokens_used INTEGER,

  -- Estado
  status TEXT DEFAULT 'pending' CHECK(status IN (
    'pending', 'processing', 'done', 'error'
  )),
  error_message TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX idx_clip_analyses_project_id ON clip_analyses(project_id);

-- Tabela de presets de analise
CREATE TABLE clip_presets (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  target_duration INTEGER DEFAULT 30,
  number_of_clips INTEGER DEFAULT 5,
  target_platform TEXT DEFAULT 'tiktok',
  niche TEXT,
  tone TEXT DEFAULT 'energetic',
  custom_instructions TEXT,
  caption_style_id TEXT,
  caption_animation TEXT DEFAULT 'word-highlight',
  zoom_config TEXT,
  cta_config TEXT,

  is_built_in INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

#### 2.4.2 Drizzle Schema (TypeScript)

```typescript
// packages/server/src/db/schema.ts - Adicoes

export const clips = sqliteTable('clips', {
  id: text('id').primaryKey().notNull(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  analysisId: text('analysis_id').references(() => clipAnalyses.id, { onDelete: 'set null' }),

  startTime: real('start_time').notNull(),
  endTime: real('end_time').notNull(),

  title: text('title').notNull().default('Untitled Clip'),
  hookSentence: text('hook_sentence'),
  hookScore: integer('hook_score').default(0),
  emotionalTone: text('emotional_tone').default('neutral'),
  suggestedHashtags: text('suggested_hashtags'), // JSON
  aiReason: text('ai_reason'),

  captionStyleId: text('caption_style_id').references(() => captionStyles.id),
  captionAnimation: text('caption_animation').default('word-highlight'),
  aspectRatio: text('aspect_ratio').default('9:16'),
  zoomConfig: text('zoom_config'), // JSON
  ctaConfig: text('cta_config'), // JSON
  showProgressBar: integer('show_progress_bar').default(1),

  status: text('status').default('suggested'),
  orderIndex: integer('order_index').default(0),

  quality: text('quality').default('standard'),
  outputFormat: text('output_format').default('mp4'),
  targetPlatform: text('target_platform').default('tiktok'),

  renderId: text('render_id').references(() => renders.id),
  outputPath: text('output_path'),
  thumbnailPath: text('thumbnail_path'),

  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at'),
});

export const clipAnalyses = sqliteTable('clip_analyses', {
  id: text('id').primaryKey().notNull(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  transcriptionId: text('transcription_id').references(() => transcriptions.id),

  targetDuration: integer('target_duration').default(30),
  numberOfClips: integer('number_of_clips').default(5),
  targetPlatform: text('target_platform').default('tiktok'),
  niche: text('niche'),
  tone: text('tone').default('energetic'),
  customInstructions: text('custom_instructions'),

  rawResponse: text('raw_response'),
  clipsGenerated: integer('clips_generated').default(0),
  modelUsed: text('model_used'),
  tokensUsed: integer('tokens_used'),

  status: text('status').default('pending'),
  errorMessage: text('error_message'),

  createdAt: text('created_at').default(sql`(datetime('now'))`),
  completedAt: text('completed_at'),
});

export const clipPresets = sqliteTable('clip_presets', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),

  targetDuration: integer('target_duration').default(30),
  numberOfClips: integer('number_of_clips').default(5),
  targetPlatform: text('target_platform').default('tiktok'),
  niche: text('niche'),
  tone: text('tone').default('energetic'),
  customInstructions: text('custom_instructions'),
  captionStyleId: text('caption_style_id'),
  captionAnimation: text('caption_animation').default('word-highlight'),
  zoomConfig: text('zoom_config'),
  ctaConfig: text('cta_config'),

  isBuiltIn: integer('is_built_in').default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});
```

#### 2.4.3 Tipos Compartilhados

```typescript
// packages/shared/src/types/clip.ts

export interface Clip {
  id: string;
  projectId: string;
  analysisId: string | null;

  startTime: number;
  endTime: number;
  duration: number;

  title: string;
  hookSentence: string | null;
  hookScore: number;
  emotionalTone: EmotionalTone;
  suggestedHashtags: string[];
  aiReason: string | null;

  captionStyleId: string | null;
  captionAnimation: CaptionAnimation;
  aspectRatio: AspectRatio;
  zoomConfig: ZoomConfig | null;
  ctaConfig: CtaConfig | null;
  showProgressBar: boolean;

  status: ClipStatus;
  orderIndex: number;

  quality: QualityLevel;
  outputFormat: string;
  targetPlatform: TargetPlatform;

  renderId: string | null;
  outputPath: string | null;
  thumbnailPath: string | null;

  createdAt: string;
  updatedAt: string;
}

export type ClipStatus =
  | 'suggested'   // IA sugeriu, usuario ainda nao revisou
  | 'selected'    // Usuario selecionou para render
  | 'editing'     // Usuario esta editando (timing, estilo)
  | 'queued'      // Na fila de render
  | 'rendering'   // Renderizando
  | 'done'        // Render completo
  | 'error'       // Erro no render
  | 'rejected';   // Usuario rejeitou a sugestao

export type EmotionalTone =
  | 'humor'
  | 'drama'
  | 'surprise'
  | 'insight'
  | 'controversy'
  | 'inspiration'
  | 'educational'
  | 'neutral';

export type TargetPlatform =
  | 'tiktok'
  | 'youtube_shorts'
  | 'instagram_reels';

export type QualityLevel =
  | 'draft'      // 720p, CRF 28, render rapido
  | 'standard'   // 1080p, CRF 23, bom balanco
  | 'high';      // 1080p, CRF 18, qualidade maxima

export interface ClipAnalysis {
  id: string;
  projectId: string;
  transcriptionId: string | null;

  targetDuration: number;
  numberOfClips: number;
  targetPlatform: TargetPlatform;
  niche: string | null;
  tone: string;
  customInstructions: string | null;

  rawResponse: string | null;
  clipsGenerated: number;
  modelUsed: string | null;
  tokensUsed: number | null;

  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage: string | null;

  createdAt: string;
  completedAt: string | null;
}

export interface ClipAnalysisRequest {
  targetDuration: number;
  numberOfClips: number;
  targetPlatform: TargetPlatform;
  niche?: string;
  tone?: string;
  customInstructions?: string;
  presetId?: string;
}

export interface ClipAnalysisResult {
  clips: SuggestedClip[];
  summary: string;
  totalMomentsFound: number;
  analysisMetadata: {
    modelUsed: string;
    tokensUsed: number;
    processingTimeMs: number;
  };
}

export interface SuggestedClip {
  startTime: number;
  endTime: number;
  title: string;
  hookSentence: string;
  hookScore: number;
  emotionalTone: EmotionalTone;
  suggestedHashtags: string[];
  reason: string;
}

export interface ZoomConfig {
  enabled: boolean;
  startX: number; // 0-100
  startY: number; // 0-100
  endX: number;   // 0-100
  endY: number;   // 0-100
  scale: number;  // 1.0 - 2.5
}

export interface CtaConfig {
  enabled: boolean;
  text: string;
  subtext?: string;
  animation: 'slide-up' | 'fade-in' | 'bounce';
  durationSeconds: number;
}

export interface ClipPreset {
  id: string;
  name: string;
  description: string | null;
  targetDuration: number;
  numberOfClips: number;
  targetPlatform: TargetPlatform;
  niche: string | null;
  tone: string;
  customInstructions: string | null;
  captionStyleId: string | null;
  captionAnimation: CaptionAnimation;
  zoomConfig: ZoomConfig | null;
  ctaConfig: CtaConfig | null;
  isBuiltIn: boolean;
}
```

#### 2.4.4 Novos Endpoints da API

```
POST   /api/clips/analyze/:projectId     - Iniciar analise de clips
GET    /api/clips/analyses/:projectId     - Listar analises do projeto
GET    /api/clips/:projectId              - Listar clips do projeto
PATCH  /api/clips/:clipId                 - Atualizar clip (titulo, timing, estilo)
PATCH  /api/clips/:clipId/status          - Atualizar status do clip
PUT    /api/clips/:projectId/bulk         - Atualizar multiplos clips
DELETE /api/clips/:clipId                 - Deletar clip (soft delete)

POST   /api/clips/render/:clipId          - Renderizar clip individual
POST   /api/clips/render-batch/:projectId - Renderizar todos selecionados
GET    /api/clips/render-progress/:clipId - Progresso do render
POST   /api/clips/render-cancel/:clipId   - Cancelar render

GET    /api/clips/presets                 - Listar presets
POST   /api/clips/presets                 - Criar preset
PATCH  /api/clips/presets/:presetId       - Atualizar preset
DELETE /api/clips/presets/:presetId       - Deletar preset

GET    /api/clips/download/:clipId        - Download do clip renderizado
GET    /api/clips/download-all/:projectId - Download ZIP de todos
```

#### 2.4.5 Servico de Analise de Clips (Claude AI)

```typescript
// packages/server/src/services/clipgen.service.ts

export class ClipGenService {
  /**
   * Prompt system otimizado para identificacao de momentos-chave.
   * Envia a transcricao completa com timestamps e recebe os pontos
   * de corte mais impactantes.
   */
  async analyzeForClips(
    transcription: TranscriptionResult,
    config: ClipAnalysisRequest,
    videoMetadata: VideoMetadata
  ): Promise<ClipAnalysisResult> {
    // Implementacao detalhada abaixo
  }
}
```

**System Prompt para Analise de Clips:**

```
Voce e um especialista em criacao de conteudo viral para {platform}.
Sua tarefa e analisar a transcricao de um video de {duration} e identificar
os {numberOfClips} momentos com maior potencial para clips curtos de {targetDuration}s.

REGRAS DE SELECAO:
1. Cada clip DEVE ser auto-contido (faz sentido isolado, sem contexto externo)
2. O inicio de cada clip deve ter um HOOK forte (pergunta, afirmacao impactante, revelacao)
3. Evitar clips que comecam no meio de uma frase ou pensamento
4. Priorizar momentos com alta carga emocional ou informacional
5. Os timestamps DEVEM ser alinhados com as pausas naturais da fala
6. Clips NAO devem se sobrepor (sem overlap de timestamps)
7. Cada clip deve ter entre {minDuration}s e {maxDuration}s

NICHO: {niche}
TOM: {tone}
{customInstructions ? 'INSTRUCOES ADICIONAIS: ' + customInstructions : ''}

TRANSCRICAO COM TIMESTAMPS:
{formattedTranscription}

Retorne um JSON com a seguinte estrutura:
{
  "clips": [
    {
      "startTime": number (segundos, ex: 45.2),
      "endTime": number (segundos, ex: 73.8),
      "title": "string (titulo descritivo, max 60 chars)",
      "hookSentence": "string (primeira frase do clip para reter audiencia)",
      "hookScore": number (0-100, potencial viral),
      "emotionalTone": "humor|drama|surprise|insight|controversy|inspiration|educational",
      "suggestedHashtags": ["string", ...],
      "reason": "string (justificativa da selecao)"
    }
  ],
  "summary": "string (resumo da analise)",
  "totalMomentsFound": number
}

Ordene os clips por hookScore decrescente.
```

**Alinhamento de Timestamps com Word-Level:**

Apos receber os timestamps da IA, o sistema alinha com os word-level timestamps do WhisperX:

```typescript
function alignClipTimestamps(
  suggestedStart: number,
  suggestedEnd: number,
  wordTimestamps: WordTimestamp[]
): { startTime: number; endTime: number } {
  // Encontrar a palavra mais proxima do start sugerido
  // que seja o INICIO de uma frase (apos pausa > 300ms)
  const startWord = findNearestSentenceStart(suggestedStart, wordTimestamps);

  // Encontrar a palavra mais proxima do end sugerido
  // que seja o FINAL de uma frase (antes de pausa > 300ms)
  const endWord = findNearestSentenceEnd(suggestedEnd, wordTimestamps);

  return {
    startTime: startWord.start - 0.1, // 100ms buffer antes
    endTime: endWord.end + 0.3,       // 300ms buffer depois
  };
}

function findNearestSentenceStart(
  targetTime: number,
  words: WordTimestamp[]
): WordTimestamp {
  // Buscar palavra mais proxima do targetTime que tenha
  // pausa >= 300ms antes dela (indica inicio de frase)
  const candidates = words.filter((word, i) => {
    if (i === 0) return true;
    const gap = word.start - words[i - 1].end;
    return gap >= 0.3; // pausa de 300ms ou mais
  });

  return candidates.reduce((closest, word) => {
    const diffCurrent = Math.abs(word.start - targetTime);
    const diffClosest = Math.abs(closest.start - targetTime);
    return diffCurrent < diffClosest ? word : closest;
  });
}

function findNearestSentenceEnd(
  targetTime: number,
  words: WordTimestamp[]
): WordTimestamp {
  // Buscar palavra mais proxima do targetTime que tenha
  // pausa >= 300ms depois dela (indica fim de frase)
  const candidates = words.filter((word, i) => {
    if (i === words.length - 1) return true;
    const gap = words[i + 1].start - word.end;
    return gap >= 0.3;
  });

  return candidates.reduce((closest, word) => {
    const diffCurrent = Math.abs(word.end - targetTime);
    const diffClosest = Math.abs(closest.end - targetTime);
    return diffCurrent < diffClosest ? word : closest;
  });
}
```

#### 2.4.6 Pipeline de Render de Clip

```
1. Usuario seleciona clip(s) para render
2. Backend cria registro na tabela renders
3. FFmpeg extrai segmento do video original:
   ffmpeg -i original.mp4 -ss {startTime} -to {endTime} -c copy segment.mp4
4. Se aspect ratio diferente do original:
   FFmpeg crop/pad para aspect ratio alvo
5. Remotion renderiza composicao com:
   - Video segment como source
   - Caption words filtradas para o intervalo do clip
   - Estilo de legenda configurado
   - Zoom effect se habilitado
   - Progress bar se habilitado
   - CTA no final se habilitado
6. FFmpeg faz encode final com qualidade configurada
7. Gera thumbnail do clip
8. Atualiza registro com outputPath e status 'done'
9. Broadcast progresso via WebSocket
```

#### 2.4.7 Composicao Remotion para Clips

```typescript
// packages/remotion/src/compositions/ClipComposition.tsx

import { AbsoluteFps, Composition, OffthreadVideo, useCurrentFrame, useVideoConfig } from 'remotion';

interface ClipCompositionProps {
  videoSource: string;
  startTime: number;
  endTime: number;
  words: WordTimestamp[];
  captionStyle: CaptionStyleConfig;
  captionAnimation: CaptionAnimation;
  zoomConfig: ZoomConfig | null;
  ctaConfig: CtaConfig | null;
  showProgressBar: boolean;
  aspectRatio: '9:16' | '1:1' | '4:5';
}

export const ClipComposition: React.FC<ClipCompositionProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentTime = frame / fps;

  // Filtrar words que estao dentro do intervalo do clip
  const clipWords = props.words.filter(
    w => w.start >= props.startTime && w.end <= props.endTime
  ).map(w => ({
    ...w,
    // Normalizar timestamps relativos ao inicio do clip
    start: w.start - props.startTime,
    end: w.end - props.startTime,
  }));

  const clipDuration = props.endTime - props.startTime;
  const ctaDuration = props.ctaConfig?.enabled ? props.ctaConfig.durationSeconds : 0;

  return (
    <div style={{ width, height, backgroundColor: '#000' }}>
      {/* Video Layer */}
      <ZoomEffect config={props.zoomConfig} duration={clipDuration}>
        <OffthreadVideo
          src={props.videoSource}
          startFrom={secondsToFrames(props.startTime, fps)}
          endAt={secondsToFrames(props.endTime, fps)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </ZoomEffect>

      {/* Caption Layer */}
      {props.captionAnimation !== 'none' && (
        <CaptionRenderer
          words={clipWords}
          style={props.captionStyle}
          animation={props.captionAnimation}
          currentTime={currentTime}
        />
      )}

      {/* Progress Bar */}
      {props.showProgressBar && (
        <ProgressBar progress={currentTime / clipDuration} />
      )}

      {/* CTA Layer (ultimos N segundos) */}
      {props.ctaConfig?.enabled && currentTime > clipDuration - ctaDuration && (
        <CallToAction
          text={props.ctaConfig.text}
          subtext={props.ctaConfig.subtext}
          animation={props.ctaConfig.animation}
          progress={(currentTime - (clipDuration - ctaDuration)) / ctaDuration}
        />
      )}
    </div>
  );
};
```

---

### 2.5 Fluxo de Interface (Frontend)

#### 2.5.1 Novos Componentes

```
packages/app/src/
  pages/
    ClipGen.tsx                    -- Pagina principal do ClipGen
  components/
    clipgen/
      ClipGenWizard.tsx            -- Wizard step-by-step
      VideoSourceSelector.tsx      -- Selecao do video fonte
      AnalysisConfigPanel.tsx      -- Config da analise (duracoes, plataforma, etc)
      AnalysisProgress.tsx         -- Progresso da analise IA
      ClipSuggestionList.tsx       -- Lista de clips sugeridos
      ClipSuggestionCard.tsx       -- Card individual com score, preview, acoes
      ClipTimeline.tsx             -- Timeline do video com marcadores de clips
      ClipEditor.tsx               -- Editor de clip individual (timing, estilo)
      ClipPreviewPlayer.tsx        -- Player de preview do clip
      ClipBatchRender.tsx          -- Painel de render em lote
      ClipDownloadPanel.tsx        -- Download individual/ZIP
      PresetSelector.tsx           -- Selecao/criacao de presets
      HookScoreBadge.tsx           -- Badge visual do hookScore (0-100)
      EmotionalToneBadge.tsx       -- Badge do tom emocional
      PlatformIcon.tsx             -- Icone da plataforma alvo
  stores/
    clipGenStore.ts                -- Estado global do ClipGen (Zustand)
```

#### 2.5.2 Fluxo do Usuario (Step-by-Step)

**Step 1: Selecao de Video**
- Usuario seleciona um video ja uploadado OU faz novo upload
- Exibe metadados do video (duracao, resolucao)
- Verifica se ja tem transcricao. Se nao, inicia transcricao

**Step 2: Configuracao da Analise**
- Selecao de preset OU configuracao manual
- Campos: plataforma alvo, duracao dos clips, quantidade, nicho, tom
- Campo opcional de instrucoes customizadas
- Botao "Analisar Video"

**Step 3: Revisao de Sugestoes**
- IA retorna N clips sugeridos
- Lista ordenada por hookScore
- Cada card mostra: titulo, hookScore (grafico), tom emocional, preview
- Timeline visual do video com marcadores de cada clip
- Acoes: Selecionar, Rejeitar, Editar

**Step 4: Edicao Individual (opcional)**
- Ajustar start/end time via drag na mini-timeline
- Preview em tempo real do clip editado
- Alterar titulo, hookSentence, hashtags
- Configurar estilo de legenda, zoom, CTA

**Step 5: Render**
- Lista de clips selecionados com configuracoes
- Selecao de qualidade (draft/standard/high)
- Botao "Renderizar Todos"
- Barra de progresso por clip + total
- Opcao de cancelar individual/todos

**Step 6: Download**
- Preview final de cada clip renderizado
- Download individual com nome auto-gerado
- Download ZIP com todos os clips
- Botao de copiar hashtags sugeridos

#### 2.5.3 Zustand Store

```typescript
// packages/app/src/stores/clipGenStore.ts

interface ClipGenState {
  // Video fonte
  sourceProjectId: string | null;
  sourceVideo: VideoMetadata | null;
  hasTranscription: boolean;

  // Configuracao
  analysisConfig: ClipAnalysisRequest;
  selectedPreset: ClipPreset | null;

  // Resultado da analise
  currentAnalysisId: string | null;
  analysisStatus: 'idle' | 'transcribing' | 'analyzing' | 'done' | 'error';
  analysisProgress: number;
  suggestedClips: Clip[];

  // Selecao e edicao
  selectedClipIds: Set<string>;
  editingClipId: string | null;

  // Render
  renderStatus: 'idle' | 'rendering' | 'done' | 'error';
  renderProgress: { [clipId: string]: number };
  renderedClips: Clip[];

  // Acoes
  setSourceProject: (projectId: string) => void;
  updateAnalysisConfig: (config: Partial<ClipAnalysisRequest>) => void;
  startAnalysis: () => Promise<void>;
  toggleClipSelection: (clipId: string) => void;
  selectAllClips: () => void;
  deselectAllClips: () => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  rejectClip: (clipId: string) => void;
  startBatchRender: () => Promise<void>;
  cancelRender: (clipId: string) => void;
  cancelAllRenders: () => void;
  downloadClip: (clipId: string) => void;
  downloadAllAsZip: () => void;
  loadPreset: (presetId: string) => void;
  saveAsPreset: (name: string) => void;
  requestMoreClips: (additionalInstructions?: string) => Promise<void>;
}
```

---

### 2.6 Novos Endpoints WebSocket

```typescript
// Eventos WebSocket para ClipGen

// Server -> Client
'clipgen:analysis:progress'    // { projectId, progress: 0-100, stage: string }
'clipgen:analysis:complete'    // { projectId, analysisId, clips: SuggestedClip[] }
'clipgen:analysis:error'       // { projectId, error: string }

'clipgen:render:progress'      // { clipId, progress: 0-100, stage: string }
'clipgen:render:complete'      // { clipId, outputPath: string }
'clipgen:render:error'         // { clipId, error: string }

'clipgen:batch:progress'       // { projectId, totalClips, completedClips, currentClipId }
'clipgen:batch:complete'       // { projectId, renderedClips: Clip[] }
```

---

### 2.7 Integracao com Pipeline Existente

O ClipGen se integra ao pipeline existente do ClipFlow nos seguintes pontos:

1. **Upload**: Reutiliza o sistema de upload existente. Nenhuma mudanca necessaria.

2. **Transcricao**: Reutiliza `whisper.service.ts` existente. Apenas verifica se ja existe transcricao para o projeto.

3. **Analise IA**: Novo servico `clipgen.service.ts` que ESTENDE o `claude.service.ts` existente (nao substitui). O prompt e completamente diferente.

4. **Remotion**: Nova composicao `ClipComposition` adicionada ao Root.tsx. Reutiliza componentes existentes (captions, zoom, transition, progress bar, CTA).

5. **Render**: Reutiliza `remotion.service.ts` com nova composicao. Adiciona FFmpeg pre-processing para extrair segmento.

6. **Rotas**: Novas rotas em `routes/clips.ts`. Nao altera rotas existentes.

7. **Frontend**: Nova pagina `ClipGen.tsx` com rota `/clipgen`. Sidebar recebe novo item de navegacao.

---

### 2.8 Plano de Implementacao por Sprints

#### Sprint 1 (Semana 1-2): Fundacao

| Tarefa | Estimativa | Prioridade |
|--------|-----------|------------|
| Criar tabelas clips, clip_analyses, clip_presets no schema | 4h | P0 |
| Criar tipos compartilhados em @clip/shared | 3h | P0 |
| Implementar rota POST /api/clips/analyze/:projectId | 8h | P0 |
| Implementar ClipGenService com prompt de analise | 12h | P0 |
| Implementar alinhamento de timestamps | 6h | P0 |
| Criar rota GET /api/clips/:projectId | 3h | P0 |
| Criar rota PATCH /api/clips/:clipId | 4h | P0 |
| Testes unitarios dos servicos | 8h | P0 |

**Entrega:** API funcional para analise e CRUD de clips

#### Sprint 2 (Semana 3-4): Render Pipeline

| Tarefa | Estimativa | Prioridade |
|--------|-----------|------------|
| Criar ClipComposition no Remotion | 12h | P0 |
| Implementar FFmpeg segment extraction | 6h | P0 |
| Implementar rota POST /api/clips/render/:clipId | 8h | P0 |
| Implementar render batch (render-batch/:projectId) | 8h | P0 |
| Implementar WebSocket events para ClipGen | 4h | P0 |
| Implementar download individual e ZIP | 6h | P1 |
| Testes de integracao do render pipeline | 8h | P1 |

**Entrega:** Pipeline completo de analise -> render -> download

#### Sprint 3 (Semana 5-6): Frontend

| Tarefa | Estimativa | Prioridade |
|--------|-----------|------------|
| Criar clipGenStore (Zustand) | 6h | P0 |
| Implementar ClipGenWizard (step-by-step) | 8h | P0 |
| Implementar AnalysisConfigPanel | 6h | P0 |
| Implementar ClipSuggestionList + Card | 10h | P0 |
| Implementar ClipTimeline (marcadores) | 12h | P0 |
| Implementar ClipPreviewPlayer | 8h | P1 |
| Implementar ClipBatchRender panel | 6h | P1 |
| Implementar ClipDownloadPanel | 4h | P1 |

**Entrega:** Interface completa e funcional do ClipGen

#### Sprint 4 (Semana 7-8): Polish e Extras

| Tarefa | Estimativa | Prioridade |
|--------|-----------|------------|
| Implementar sistema de presets | 8h | P1 |
| Implementar re-analise com refinamento | 6h | P1 |
| Implementar ClipEditor (edicao individual) | 10h | P1 |
| Adicionar ClipGen ao MCP package | 6h | P2 |
| Performance optimization (memoization, virtualization) | 8h | P1 |
| Acessibilidade (ARIA, keyboard nav) | 6h | P2 |
| Documentacao de uso e API | 4h | P2 |
| Testes E2E | 8h | P2 |

**Entrega:** Feature completa, polida e documentada

---

### 2.9 Configuracoes de Plataforma

```typescript
// packages/shared/src/constants/platforms.ts

export const PLATFORM_CONFIGS = {
  tiktok: {
    name: 'TikTok',
    maxDuration: 60,
    recommendedDuration: 30,
    aspectRatio: '9:16' as const,
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    maxFileSize: 287 * 1024 * 1024, // 287MB
    safeZone: { top: 150, bottom: 270 }, // pixels de area segura para UI do TikTok
    captionPosition: 'bottom-center',
    hashtagLimit: 5,
  },
  youtube_shorts: {
    name: 'YouTube Shorts',
    maxDuration: 60,
    recommendedDuration: 45,
    aspectRatio: '9:16' as const,
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    maxFileSize: 256 * 1024 * 1024,
    safeZone: { top: 120, bottom: 200 },
    captionPosition: 'bottom-center',
    hashtagLimit: 3,
  },
  instagram_reels: {
    name: 'Instagram Reels',
    maxDuration: 90,
    recommendedDuration: 30,
    aspectRatio: '9:16' as const,
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    maxFileSize: 250 * 1024 * 1024,
    safeZone: { top: 180, bottom: 320 },
    captionPosition: 'center-bottom',
    hashtagLimit: 30,
  },
} as const;
```

---

### 2.10 Metricas de Sucesso

| Metrica | Alvo | Forma de Medicao |
|---------|------|-------------------|
| Tempo total de geracao (transcricao + analise + render) | < 15min para video de 30min | Timer end-to-end |
| Precisao dos timestamps | +/- 100ms do limite de frase | Comparacao manual |
| HookScore vs engajamento real | Correlacao > 0.6 | A/B testing futuro |
| Clips aceitos vs rejeitados pelo usuario | > 60% aceitos | Tracking de status |
| Clips renderizados com sucesso | > 95% | Tracking de erros |
| Satisfacao do usuario com qualidade | > 4/5 | Survey futuro |

---

### 2.11 Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Claude retorna timestamps fora do range do video | Media | Alto | Validacao + clamp nos limites do video |
| Clips muito curtos (< 5s) ou longos (> 90s) | Media | Medio | Validacao de min/max duration na resposta |
| Claude retorna JSON invalido | Baixa | Alto | Retry com prompt corrigido + fallback parsing |
| FFmpeg falha ao extrair segmento | Baixa | Alto | Retry + fallback para re-encoding completo |
| Transcricao com gaps (palavras sem timestamps) | Media | Medio | Interpolacao linear dos gaps |
| Overlapping clips sugeridos | Media | Baixo | Merge automatico ou alerta ao usuario |
| Video sem fala (musica/B-roll) | Alta | Medio | Deteccao de silencio + analise visual futura |
| OOM em videos de 30min | Baixa | Alto | Streaming + chunk processing |

---

## PARTE 3: RESUMO E PROXIMOS PASSOS

### Correcoes Imediatas (Pre-ClipGen)

Antes de iniciar o desenvolvimento do ClipGen, recomendamos resolver os seguintes itens criticos que impactam a estabilidade da base:

1. **SEC-001 a SEC-003**: Seguranca de WebSocket, path traversal, e upload
2. **DAT-001 a DAT-003**: Race conditions, cascade delete, transacoes
3. **BUG-001**: Duracao hardcoded no Remotion
4. **GAP-003**: Error Boundaries no React
5. **DAT-006**: Indexes no banco de dados

### Desenvolvimento do ClipGen

Com as correcoes criticas aplicadas, o desenvolvimento do ClipGen segue as 4 sprints detalhadas na secao 2.8, totalizando ~8 semanas de trabalho estimado.

### Evolucoes Futuras do ClipGen

Apos o MVP, as seguintes evolucoes sao recomendadas:

1. **Analise visual** (face detection, scene change detection) para complementar analise de transcricao
2. **A/B testing** de clips gerados com metricas de engajamento real
3. **Templates de clip** com estilos pre-configurados por nicho
4. **Auto-posting** direto para TikTok/YouTube/Instagram via API
5. **Analise de concorrencia** - sugerir clips baseado em trends atuais do nicho
6. **Multi-linguagem** - gerar clips com legendas traduzidas
7. **Batch ClipGen** - analisar e gerar clips de multiplos videos em sequencia

---

*Documento gerado em 28/03/2026. Versao 1.0.0.*
*Baseado na analise completa de 120+ arquivos do monorepo ClipFlow.*
