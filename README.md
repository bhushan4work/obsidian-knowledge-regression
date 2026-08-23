# Knowledge Regression

Knowledge Regression is a testing framework for your Obsidian vault. It allows you to write deterministic, plain-text "knowledge tests" to ensure your vault's structure, links, and frontmatter remain consistent over time as your second brain evolves. 

Think of it as continuous integration (CI) tests for your personal knowledge base.

## Why it exists

As vaults grow larger, maintaining structural consistency becomes difficult. Did you remember to link your new project to the master index? Does every claim have a source? Knowledge Regression lets you encode these rules into standard Markdown files and automatically validates your vault against them as you type.

## Supported Test Types

The plugin supports five deterministic test types, configured entirely via YAML frontmatter:

1. `note-exists`: Ensures a specific note exists in the vault.
2. `link-exists`: Ensures a source note contains a link to a target note.
3. `min-backlinks`: Ensures a note has at least $N$ incoming links.
4. `frontmatter-property`: Ensures a note has a specific property (and optionally a specific value).
5. `source-exists`: Ensures a note has at least one outgoing link or a configured `source` property.

## Quick Setup

1. Install the plugin and enable it.
2. Create a folder in your vault for your tests (by default, `_knowledge-tests`).
3. Create a new markdown file inside this folder.
4. Open the **Knowledge regression** sidebar view (via the command palette or the shield ribbon icon).

## Creating Knowledge Tests

Tests are standard Markdown files. The file's basename becomes the test's name, and the logic is defined in the YAML frontmatter.

### Example: Ensure an active project is linked to the index
```yaml
---
test-type: link-exists
note-path: "Projects/My Active Project.md"
target-note-path: "Indices/Project Index.md"
enabled: true
---
# Link Check
This test ensures my active project is properly registered in the master project index.
```

### Example: Ensure a claim has a source
```yaml
---
test-type: source-exists
note-path: "Claims/The sky is blue.md"
source-property: "reference"
---
```

### Example: Ensure a concept is well-integrated
```yaml
---
test-type: min-backlinks
note-path: "Concepts/Knowledge Graph.md"
min-count: 3
---
```

## Running and Understanding Results

You can run tests from the Knowledge regression sidebar.
- **Pass/Fail Indicators**: Tests will show a green checkmark or a red 'X'.
- **Explanations**: Failed tests display the engine's exact reasoning (e.g. `"Projects/My Active Project.md" does not link to "Indices/Project Index.md".`).
- **Affected Notes**: Failed tests provide a clickable list of the affected notes. Clicking the note opens it immediately in your active workspace so you can fix the issue.
- **Parse Errors**: If your YAML is malformed, the plugin will catch it and display the validation error at the top of the sidebar instead of crashing.

## Automatic Test Behavior

You do not need to manually click "Run all tests" every time you modify a file. 

The plugin intelligently watches your vault using Obsidian's metadata cache. When you edit, rename, or delete a file, the plugin determines exactly which tests are affected by that specific file change and selectively re-runs only those tests in the background (debounced by 1 second to avoid UI blocking).

## Optional AI Assistance

The plugin includes an optional AI module to help you generate test YAML or explain why a test failed based on your vault structure.

- **Strict Separation**: The deterministic test engine runs completely independently of the AI module. If you leave AI disabled, the plugin remains 100% local.
- **Bring Your Own Provider**: Supports any OpenAI-compatible API. You can route it to `https://api.openai.com/v1`, OpenRouter, or keep it entirely on-device by routing it to an Ollama instance at `http://localhost:11434/v1`.
- **Consent Driven**: The plugin will *never* send your vault data in the background. AI requests only happen when you explicitly click the "Ask AI" buttons, which open a modal showing you the exact text that will be transmitted.

## Privacy and Network Behavior

- **Local First**: All deterministic tests evaluate locally against Obsidian's cache.
- **No Telemetry**: The plugin collects zero analytics.
- **Network Requests**: The only network boundary exists within the optional AI features. It uses Obsidian's native `requestUrl` to bypass CORS, meaning it behaves safely within Obsidian's sandbox.

## Limitations

- **API Key Storage**: If you use the AI features, your API key is stored locally in plain text in Obsidian's `data.json` file. Do not commit your vault to a public GitHub repository if you store a sensitive API key here. 

## Development

To build the plugin locally:

```bash
npm install
npm run dev
```

For production builds:
```bash
npm run build
```

The plugin uses `eslint-plugin-obsidianmd` for strict linting. Run `npm run lint` before submitting PRs.

## License

MIT License.
