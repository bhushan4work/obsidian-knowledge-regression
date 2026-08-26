# Knowledge Test Runner

Automated tests for your Obsidian vault. Write simple rules that check whether your notes, links, and metadata are actually in the shape you expect — and catch it when they're not.

Think of it as CI for your knowledge base: instead of manually clicking around to check if a note exists, a link resolves, or a required frontmatter field is present, you write a test file once and let the plugin verify it every time your vault changes.

> 🎥 **Demo video:** [Watch the demo on YouTube](https://youtu.be/mMEBzm-5TrU)

---

## Why

Vaults rot quietly. A note gets renamed and a link silently breaks. A required frontmatter field gets forgotten on a new page. A concept you meant to link back to never gets referenced. None of this throws an error — it just sits there until you notice, usually much later than you'd like.

This plugin gives you a way to define what "healthy" looks like for your vault, and check it automatically.

## What it does

- You write test rules as plain Markdown files (with YAML frontmatter) inside a test folder in your vault — `_knowledge-tests` by default.
- The plugin scans that folder, parses each test file, and validates it against your live vault using Obsidian's own metadata cache and file APIs.
- Results show up in a sidebar view: how many tests passed, how many failed, and why.
- When you edit, rename, or delete a note, the plugin figures out which tests are affected and reruns only those — not the entire suite.

Everything runs locally, inside Obsidian. No external service, no account, no cloud sync required.

## Supported test types

| Test type | What it checks |
|---|---|
| `note-exists` | A specific note exists in the vault |
| `link-exists` | A link between two notes resolves correctly |
| `min-backlinks` | A note has at least a minimum number of backlinks |
| `frontmatter-property` | A note has a required frontmatter field (and optionally a specific value) |
| `source-exists` | A note has an outgoing source/reference link (e.g. evidence, citation) |

## Writing a test

Create a Markdown file inside your configured test folder with YAML frontmatter describing the check. For example, to make sure a note exists:

```markdown
---
type: note-exists
target: "Projects/Roadmap"
---
```

Or to require a minimum number of backlinks:

```markdown
---
type: min-backlinks
target: "Concepts/Second Brain"
minimum: 3
---
```

Each test type has its own required fields. The plugin validates these when it loads the file and will tell you clearly if something is missing or malformed — no silent failures.

## Getting started

1. Install the plugin (see [Installation](#installation) below).
2. Open **Settings → Knowledge Test Runner** and confirm (or change) the test folder path. Default: `_knowledge-tests`.
3. Create that folder in your vault if it doesn't already exist.
4. Add a test file using one of the formats above.
5. Open the sidebar view (via the ribbon icon or command palette) to see your test results.

Tests rerun automatically when relevant notes change. You can also trigger a manual run from the sidebar at any time.

## Installation

### From Community Plugins (once available)

1. Open **Settings → Community plugins** in Obsidian.
2. Search for "Knowledge Test Runner".
3. Install and enable it.

### Manual installation

1. Download the latest release from the [Releases page](#).
2. Extract `main.js`, `manifest.json`, and `styles.css` into `<your-vault>/.obsidian/plugins/knowledge-test-runner/`.
3. Reload Obsidian and enable the plugin from **Settings → Community plugins**.

### Building from source

```bash
git clone <repo-url>
cd knowledge-test-runner
npm install
npm run build
```

## Settings

- **Test folder** — where the plugin looks for test files. Defaults to `_knowledge-tests`.
- **AI assistance (optional)** — lets you connect an OpenAI-compatible endpoint (provider URL, model, API key) to get plain-language help interpreting a failing test. This is entirely opt-in: nothing is sent anywhere unless you explicitly trigger it from the sidebar. No background calls, no telemetry.

## How it works under the hood

- **Loader** — recursively scans the configured test folder for test files.
- **Parser** — normalizes each file's YAML frontmatter into a typed test object.
- **Validator** — checks required fields, types, and value constraints (e.g. positive integers, valid paths) before a test is allowed to run.
- **Runner** — executes the right logic per test type, using Obsidian's metadata cache to resolve notes, links, backlinks, and frontmatter.
- **Watcher** — listens to vault and metadata cache events (with debouncing) to figure out which tests are affected by a given change, so reruns stay fast even in large vaults.

Built with TypeScript, esbuild, and the Obsidian plugin API.

## FAQ

**Does this modify my notes?**
No. It only reads your vault to evaluate tests. It never edits, moves, or deletes anything.

**Does it need an internet connection?**
No, unless you choose to use the optional AI assistance feature, which only activates when you trigger it manually.

**What happens if a test file is malformed?**
The plugin will flag it as invalid in the sidebar with a description of what's wrong, rather than failing silently or crashing.

**Can I have tests in subfolders?**
Yes, the loader scans the test folder recursively.

## Contributing

Issues and pull requests are welcome. If you're proposing a new test type, please include a short description of the use case along with the implementation.

## License

[MIT](#) — see `LICENSE` for details.