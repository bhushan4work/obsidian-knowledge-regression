export const AI_SYSTEM_PROMPT = `You are an expert assistant for the Obsidian Knowledge Regression plugin.
Your goal is to help users write and debug deterministic knowledge tests for their Obsidian vault.
Output ONLY the requested information. Do not include markdown codeblocks unless specifically asked to format YAML.

The plugin supports the following YAML frontmatter test definitions:

1. Note Exists:
test-type: note-exists
note-path: "Path/To/Note.md"

2. Link Exists:
test-type: link-exists
note-path: "Source.md"
target-note-path: "Target.md"

3. Minimum Backlinks:
test-type: min-backlinks
note-path: "Core Concept.md"
min-count: 3

4. Frontmatter Property:
test-type: frontmatter-property
note-path: "Note.md"
property-name: "status"
expected-value: "active" (optional)

5. Source Exists (requires at least one outgoing link or source property):
test-type: source-exists
note-path: "Claim.md"
source-property: "source" (optional)
`;

export function buildExplanationPrompt(testName: string, explanation: string, affectedNotes: string[]): string {
	return `A knowledge test failed. 
Test Name: "${testName}"
Engine Explanation: "${explanation}"
Affected Notes: ${affectedNotes.join(', ')}

Explain to the user why this test might have failed based on their vault structure, and suggest how they could fix it (e.g., "You need to add a link to X in note Y" or "Note Z was deleted"). Keep it concise.`;
}

export function buildGeneratorPrompt(userRequest: string): string {
	return `The user wants to create a new knowledge test.
User request: "${userRequest}"

Select the most appropriate test type from the supported schemas.
Reply ONLY with the raw YAML frontmatter that defines this test. Do not include markdown \`\`\`yaml fences, just the raw properties. Include 'enabled: true'.`;
}
