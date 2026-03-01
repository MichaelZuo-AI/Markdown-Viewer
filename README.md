# MD Viewer

A fast, lightweight desktop Markdown viewer built with Tauri v2 + React.

## Why

AI tools like Claude, ChatGPT, and Copilot think and respond in Markdown — structured documents full of headings, code blocks, tables, and nested lists. To truly understand AI's reasoning process and make sense of its output, you need a reader that renders Markdown beautifully, not a plain-text editor. MD Viewer is built for exactly that.

## Features

- Dark/light theme with beautiful typography (Lora, DM Sans, JetBrains Mono)
- Syntax-highlighted code blocks with one-click copy
- Auto-generated table of contents with scroll-spy
- Reading progress bar and word count
- Drag-and-drop or paste markdown files
- macOS-native overlay titlebar
- Keyboard shortcuts: `Cmd+O` open, `Cmd+\` toggle sidebar, `A+/A-` zoom

## Install

### Homebrew (recommended)

```bash
brew tap MichaelZuo-AI/tap
brew install --cask md-viewer
```

### Manual Download

Grab the `.dmg` from the [Releases page](https://github.com/MichaelZuo-AI/Markdown-Viewer/releases):

| Platform | File |
|---|---|
| macOS (Apple Silicon) | `MD Viewer_x.x.x_aarch64.dmg` |

1. Open the `.dmg` and drag **MD Viewer** to your Applications folder
2. On first launch: right-click the app → **Open** (required once for macOS Gatekeeper)

## Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Rust](https://rustup.rs/) (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)

### Build & Run

```bash
git clone https://github.com/MichaelZuo-AI/Markdown-Viewer.git
cd Markdown-Viewer
pnpm install
pnpm tauri dev        # development (hot reload)
pnpm tauri build      # production binary → src-tauri/target/release/bundle/
```

The first build takes a few minutes to compile Rust dependencies. Subsequent builds are fast.

## Tech Stack

| Layer | Tech |
|---|---|
| Window & Native APIs | [Tauri v2](https://v2.tauri.app/) (Rust) |
| Frontend | React 18 + TypeScript + Vite |
| Markdown | [marked](https://marked.js.org/) + [highlight.js](https://highlightjs.org/) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |

## License

[MIT](LICENSE)
