# Knowledge Regression for Obsidian

**Knowledge Regression** is a developer-inspired testing framework for your Obsidian vault. It allows you to write deterministic, plain-text "knowledge tests" to ensure your vault's structure, links, and frontmatter remain consistent over time as your second brain evolves.

## Features

- **Deterministic Tests**: Define tests in YAML frontmatter on any `.md` file.
- **Five Core Test Types**:
  - `note-exists`: Ensures a specific note remains in the vault.
  - `link-exists`: Ensures one note maintains a link to another note.
  - `min-backlinks`: Ensures a concept or index note has at least N incoming links.
  - `frontmatter-property`: Ensures a note has a specific property (and optionally a specific value).
  - `source-exists`: Ensures a note (like a claim or fact) has at least one outgoing link or a `source` property.
- **Real-time Reactivity**: The plugin intelligently watches your vault and runs *only the affected tests* in the background as you type.
- **No Full Vault Scans**: Built entirely on top of Obsidian's heavily optimized internal metadata cache.
- **Optional AI Assistance**: Generate tests or debug failures using an optional OpenAI-compatible AI provider (100% opt-in, disabled by default, supports local Ollama).

## How to Use

1. Create a folder in your vault for your tests (e.g., `_knowledge-tests`).
2. Create a new markdown file inside this folder.
3. Add the YAML frontmatter for your test. For example:

```yaml
---
test-type: link-exists
note-path: "Projects/My Active Project.md"
target-note-path: "Indices/Project Index.md"
enabled: true
---
# Link Check
This test ensures my active project is properly registered in the master project index!
```

4. Open the **Knowledge regression** sidebar view (via the command palette or ribbon icon).
5. Watch your tests pass or fail in real-time as you modify your vault!

## Privacy & Security

This plugin respects your privacy and follows all Obsidian developer policies:
- **Local First**: All deterministic tests run entirely on your local machine using Obsidian's native APIs.
- **No Telemetry**: There is absolutely no tracking, analytics, or hidden network requests.
- **Safe AI**: If you choose to enable the optional AI assistance, the plugin will *never* send data to your AI provider without explicitly showing you the prompt and asking for your consent first via a pop-up modal. 
- **Local AI Support**: You can point the AI provider URL to `http://localhost:11434/v1` to use local models like Ollama.

## Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest GitHub Release.
2. Place them inside your vault at `<vault>/.obsidian/plugins/knowledge-regression/`.
3. Reload Obsidian and enable the plugin.

## Contributing

```bash
npm install
npm run dev
```

License: MIT.
