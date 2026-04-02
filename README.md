# ClipFlow Framework Editor

![ClipFlow Logo Banner](https://via.placeholder.com/1200x300/0f172a/f8fafc?text=ClipFlow+Framework)

**ClipFlow Framework Editor** is an AI-powered, open-source video generation and editing framework built for scale. Orchestrating transcription, AI scene analysis, dynamic B-roll generation, intelligent captions, and hardware-accelerated rendering through [Remotion](https://www.remotion.dev/), ClipFlow offers an end-to-end pipeline tailored primarily for short-form content (TikToks, Instagram Reels, and YouTube Shorts).

It is built as a complete monorepo, providing a Web App UI, a fully typed backend, and an extensible MCP (Model Context Protocol) module allowing external agents to interact programmatically with your rendering pipeline.

---

## 🌟 Key Features

* **AI-Powered Scene Analysis:** Analyzes raw transcriptions to intelligently segment videos into high-retention hooks, content, and CTA blocks.
* **Intelligent Auto-Captioning:** Deep integration with Whisper timestamp generation. Words are highlighted synchronously down to the millisecond with karaoke, pop, or glowing animation styles.
* **Component-Based Video Rendering:** Utilizes [Remotion](https://www.remotion.dev/) to declaratively code videos as React components, enabling programmatic video iteration and fully dynamic layouts.
* **Model Context Protocol (MCP) Support:** Provides a robust external API using the `@modelcontextprotocol/sdk` to allow LLM agents to plan, edit, style, and render clips dynamically via local tools.
* **Niche Template System:** Pre-built configurations optimized for Tech, Fitness, Food, Education, Podcast, and E-commerce.
* **Secure Data Handling:** Complete schema validation for all stored JSON payloads and relationships using Zod, Drizzle ORM, and SQLite.
* **Batch Processing Engine:** Create multiple clips from a single master video while automatically randomizing hooks and dynamic Zoom transitions.

---

## 🏗 Architecture & Stack

The repository is structured as a **Turborepo** monorepo, keeping boundaries clean while sharing TypeScript definitions.

* **`packages/app`**: React + Vite frontend SPA. Features clip editing, timeline views, template management, and WebSocket-driven progress bars.
* **`packages/server`**: Fastify + Node.js backend. Handles video transcoding, orchestrates Whisper AI workflows, leverages Drizzle ORM for SQLite queries, and commands Remotion builds.
* **`packages/mcp`**: Anthropic's MCP (Model Context Protocol) Server. Exposes ClipFlow APIs as programmatic tools.
* **`packages/remotion`**: React components specifically structured to be rendered into MP4 videos through `@remotion/cli`.
* **`packages/shared`**: Cross-package TypeScript types, Zod schemas, error maps, and constants.

### Core Tech
* **Runtime:** Node.js, `pnpm`, Turborepo
* **Frontend:** React, Tailwind CSS V4, Lucide
* **Backend:** Fastify, Drizzle ORM, better-sqlite3
* **Validation:** Zod
* **Video/Audio:** Remotion, FFmpeg, Whisper

---

## 🚀 Getting Started

### Prerequisites

* Node.js 20+
* `pnpm` (latest)
* `ffmpeg` installed locally (`brew install ffmpeg` on macOS)
* API Key for Anthropic Claude (used for scene and hook planning)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/willianfellipe-coder/clipflow-framework-editor.git
   cd "clipflow-framework-editor"
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment Setup:**
   Copy `.env.example` to `.env` and fill in your keys.
   ```bash
   cp .env.example .env
   ```
   *Make sure `ANTHROPIC_API_KEY` is set for the AI Analysis to work properly.*

4. **Prepare the Database:**
   ```bash
   pnpm --filter @clip/server db:generate
   pnpm --filter @clip/server db:push
   pnpm --filter @clip/server db:seed
   ```

5. **Start the Development Servers:**
   ```bash
   pnpm dev
   ```

The application will start concurrently:
* **Web Client**: `http://localhost:5173`
* **API Server**: `http://localhost:3000`

---

## 🛠 Advanced Usage

### Running the MCP Server
To allow external agents to interface with your ClipFlow framework, you can hook the MCP server into your local environment (like Claude for Desktop):

```json
{
  "mcpServers": {
    "clipflow": {
      "command": "node",
      "args": ["/absolute/path/to/clipflow/packages/mcp/dist/index.js"]
    }
  }
}
```
Available tools include `get_projects`, `create_clip`, `render_clip`, and `analyze_scene`. All inputs are strictly Zod-validated.

### Architecture Rules
If you are extending the framework, follow these critical rules:
1. **JSON Boundaries:** In the backend `server` package, all parsed JSON loaded from `sqlite` MUST run through `parseJsonField(chema, data)` mapping to avoid runtime corruption. 
2. **Transition Patterns:** Current supported Remotion visual transitions are strictly limited to `cut` and `fade` for rendering reliability.
3. **Monorepo Linking:** Avoid cyclic dependencies by defining core types in `@clip/shared`.

---

## 🤝 Contributing

Contributions are heavily encouraged! We strive to make ClipFlow the defacto scalable engine for short-form video generation. 
Feel free to open Issues for bugs and Pull Requests for feature enhancements.

### Linting and Testing
We enforce strict Typescript checking.
```bash
# Typecheck across all workspaces
pnpm typecheck

# Lint all packages
pnpm lint
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✍️ Author

Created and maintained by **Willian Santos**.
