# ClipFlow — Issues para próxima sessão

## P1: UX — Mensagens de progresso amigáveis
- **Arquivo**: `packages/server/src/services/whisper.service.ts`
- **Problema**: Mensagens brutas do Python ("warnings.warn(", "Loading WhisperX model...") aparecem na UI
- **Fix**: Filtrar stderr do Python, mapear para mensagens amigáveis com ícones
- Etapas: "Extraindo áudio...", "Carregando modelo de IA...", "Transcrevendo fala...", "Alinhando palavras...", "Finalizando..."

## P2: WhisperX System Status incorreto
- **Arquivo**: `packages/server/src/routes/settings.ts`
- **Problema**: `whisperx=False` mesmo com WhisperX instalado no venv
- **Causa**: Path do venv Python está errado no system-check (resolve relativo ao cwd do server, não ao root)
- **Fix**: Usar `PATHS.root` em vez de `process.cwd()` para resolver o path do venv

## P3: Restart Server não funciona
- **Arquivo**: `packages/server/src/routes/settings.ts`, `packages/app/src/pages/Settings.tsx`
- **Problema**: `process.exit(0)` mata o server mas tsx watch pode não reiniciar, e o browser não reconecta
- **Fix**: Usar `setTimeout(() => window.location.reload(), 3000)` com retry no frontend, e garantir que tsx watch reinicia

## P4: MCP não detecta Claude Code conectado
- **Arquivo**: `packages/server/src/services/ai-provider.ts`
- **Problema**: Badge sempre mostra "No AI" — a detecção depende de `CLAUDE_CODE=true` env var que nunca é setada
- **Fix**: Detectar via existência do processo Claude Code, ou permitir configurar via Settings UI

## P5: Progresso real na transcription/transcoding
- **Arquivos**: `packages/server/src/routes/upload.ts`, `whisper.service.ts`
- **Problema**: Progresso fica em 0% durante transcoding HEVC→H264, e durante loading do modelo WhisperX
- **Fix**:
  - Upload: Broadcast "Convertendo vídeo..." durante transcoding com progresso estimado
  - WhisperX: Parsear stderr melhor para extrair % reais das etapas
