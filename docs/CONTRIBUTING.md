# Contributing to ClipFlow Framework

> **Author:** Willian Santos | **License:** MIT | **Version:** 1.0.0

Thank you for your interest in contributing to ClipFlow! This guide covers everything you need to get started — from setting up the development environment to submitting your first pull request.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style & Standards](#code-style--standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Working with the Monorepo](#working-with-the-monorepo)

---

## Code of Conduct

This project follows a simple principle: **be respectful, be constructive, be helpful.**

- Treat everyone with courtesy and respect.
- Provide constructive feedback on PRs and issues.
- Focus on the code and ideas, not the person.
- Harassment, hate speech, or personal attacks will not be tolerated.

---

## How to Contribute

There are many ways to contribute:

| Type | How |
|------|-----|
| 🐛 **Bug Fix** | Open an issue → fork → fix → PR |
| ✨ **New Feature** | Open a feature request issue first → discuss → implement |
| 📖 **Documentation** | Edit any `docs/*.md` or `README.md` |
| 🌍 **Translation** | Add a new locale in `packages/app/src/i18n/` |
| 🧪 **Tests** | Add tests in `packages/*/src/__tests__/` |
| 🧹 **Refactoring** | Clean up code quality issues (open an issue first) |

---

## Development Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm install -g pnpm` |
| Python | 3.10+ | [python.org](https://python.org) (optional — for WhisperX) |
| Git | Any | [git-scm.com](https://git-scm.com) |

### 1. Fork and Clone

```bash
# Fork the repository via GitHub UI, then:
git clone https://github.com/<your-username>/clipflow-framework-editor.git
cd clipflow-framework-editor

# Add the upstream remote
git remote add upstream https://github.com/willianfellipe-coder/clipflow-framework-editor.git
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env (required for AI features)
```

### 4. Setup WhisperX (Optional)

```bash
bash scripts/setup.sh
```

### 5. Start Development

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| App | http://localhost:4401 |
| API | http://localhost:4400 |
| Swagger | http://localhost:4400/docs |

---

## Project Structure

This is a **pnpm monorepo** with Turborepo. Each package is independent but shares types via `@clip/shared`.

```
packages/
├── app/        Frontend (React 19, Vite 6, Tailwind CSS 4)
├── server/     Backend API (Fastify 5, SQLite, Drizzle ORM)
├── shared/     Shared TypeScript types and Zod schemas
├── remotion/   Video compositions and caption animations
└── mcp/        MCP server for IDE integration
```

### Running a Single Package

```bash
# Run only the server
pnpm --filter @clip/server dev

# Run only the frontend
pnpm --filter @clip/app dev

# Build a single package
pnpm --filter @clip/shared build
```

---

## Code Style & Standards

### TypeScript

- **All code must be TypeScript.** No plain `.js` files in `packages/`.
- Use explicit types for function signatures (avoid `any`).
- Prefer `interface` over `type` for object shapes.
- Use `unknown` instead of `any` for truly unknown values.

### React (Frontend)

- Use **functional components** only — no class components.
- Prefer **named exports** over default exports for components.
- Keep components focused: one responsibility per component.
- Use `React.memo()` for components that re-render frequently.

### Fastify (Backend)

- All routes must have a **Zod schema** for request validation.
- Services stay in `packages/server/src/services/`.
- Routes stay in `packages/server/src/routes/`.
- Never put business logic directly in route handlers.

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `VideoPreview.tsx` |
| Hooks | camelCase with `use` | `useWebSocket.ts` |
| Services | camelCase with `.service` | `ffmpeg.service.ts` |
| Types/Interfaces | PascalCase | `TranscriptionResult` |
| Constants | UPPER_SNAKE_CASE | `MAX_UPLOAD_SIZE` |
| CSS classes | BEM or Tailwind utilities | — |

### Linting

```bash
# Lint all packages
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons (no logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build system, dependencies, CI config |

### Scopes

Use the package name as scope: `app`, `server`, `shared`, `remotion`, `mcp`.

### Examples

```
feat(server): add pagination to projects list endpoint
fix(app): prevent timeline crash with empty captions
docs(contributing): add monorepo working guide
perf(remotion): memoize word-visibility calculations in captions
chore: upgrade pnpm to 9.15.4
```

---

## Pull Request Process

### Before Opening a PR

1. ✅ **Check existing issues** — your change may already be tracked.
2. ✅ **For large features** — open a Feature Request issue first to discuss the approach before coding.
3. ✅ **Keep PRs small** — one logical change per PR is much easier to review.
4. ✅ **Sync with upstream** before branching:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### Branching

```bash
# Features
git checkout -b feat/your-feature-name

# Bug fixes
git checkout -b fix/describe-the-bug

# Documentation
git checkout -b docs/what-you-updated
```

### PR Checklist

Before submitting, make sure:

- [ ] The code builds without errors: `pnpm build`
- [ ] TypeScript has no type errors: `pnpm --filter <package> tsc --noEmit`
- [ ] Linting passes: `pnpm lint`
- [ ] You've tested the change manually (describe how in the PR)
- [ ] The PR description explains **what** and **why** (not just how)
- [ ] Documentation is updated if the change affects user-facing behavior

### PR Description Template

```markdown
## What does this PR do?
<!-- Clear description of the change -->

## Why is this change needed?
<!-- Context, motivation, or link to issue -->

## How was it tested?
<!-- Manual steps you followed -->

## Screenshots (if UI change)
<!-- Before / After screenshots -->

## Related Issues
<!-- Closes #123 -->
```

---

## Reporting Bugs

Before opening a bug report:

1. Search [existing issues](https://github.com/willianfellipe-coder/clipflow-framework-editor/issues) — it may already be reported.
2. Check [CHANGELOG.md](../CHANGELOG.md) — it may be fixed in a newer version.

### Bug Report Template

```markdown
**Describe the Bug**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g. macOS 15, Windows 11, Ubuntu 24.04]
- Node.js version: [e.g. 22.4.0]
- pnpm version: [e.g. 9.15.4]
- ClipFlow version: [e.g. 1.0.0]

**Additional Context**
Logs, screenshots, or any other relevant information.
```

---

## Requesting Features

Feature requests are welcome! Open an issue with the title format:

```
[Feature Request] Brief description of the feature
```

Describe:
- **What** the feature does
- **Why** it would be useful
- **Who** would benefit from it
- Any **implementation ideas** you have (optional)

Large features may require discussion before implementation starts. The maintainer will label promising requests and link them to milestones.

---

## Working with the Monorepo

### Turborepo Pipeline

The build pipeline is defined in `turbo.json`. Tasks are run in dependency order:

```bash
pnpm build        # Build all packages (shared → server/app/remotion/mcp)
pnpm dev          # Start all packages in dev mode (parallel)
pnpm lint         # Lint all packages
pnpm db:push      # Push Drizzle schema to SQLite (server only)
pnpm db:generate  # Generate Drizzle migration files (server only)
```

### Adding a New Dependency

```bash
# Add to a specific package
pnpm --filter @clip/server add package-name
pnpm --filter @clip/app add -D dev-package-name

# Add to the root workspace
pnpm add -w -D root-dev-package
```

### Adding a Shared Type

1. Create or edit a file in `packages/shared/src/types/`
2. Export it from `packages/shared/src/index.ts`
3. Build shared: `pnpm --filter @clip/shared build`
4. Import in other packages: `import { YourType } from '@clip/shared'`

### Adding an API Route

1. Create `packages/server/src/routes/your-route.ts`
2. Define the Fastify route with a Zod schema
3. Register it in `packages/server/src/index.ts`
4. Add corresponding types to `@clip/shared` if needed
5. Document it in `docs/API.md`

---

## Questions?

If you have questions that aren't answered here:

- Open a [Discussion](https://github.com/willianfellipe-coder/clipflow-framework-editor/discussions) for general questions
- Open an [Issue](https://github.com/willianfellipe-coder/clipflow-framework-editor/issues) for bugs or feature requests

---

*Thank you for contributing to ClipFlow! Every improvement — big or small — makes a difference.* 🎬
