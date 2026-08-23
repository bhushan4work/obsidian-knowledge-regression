import { App, TFile, TFolder } from 'obsidian';
import type { KnowledgeTest } from './types';
import { parseFrontmatterTest } from './parser';

export interface LoadedTests {
	/** Successfully parsed and validated tests. */
	tests: KnowledgeTest[];
	/** Map of test ID (file path) to its source TFile. */
	sourceFiles: Map<string, TFile>;
	/** Files that were processed but failed validation/parsing. */
	errors: Map<string, string[]>;
}

/**
 * Loads all knowledge tests from a specific folder in the vault.
 * Relies exclusively on the Obsidian metadataCache (no Node.js fs).
 */
export function loadTestsFromFolder(
	app: App,
	folderPath: string,
): LoadedTests {
	const result: LoadedTests = {
		tests: [],
		sourceFiles: new Map(),
		errors: new Map(),
	};

	// 1. Resolve the folder
	const abstractFolder = app.vault.getAbstractFileByPath(folderPath);
	if (!(abstractFolder instanceof TFolder)) {
		// Folder doesn't exist or isn't a folder. Return empty.
		return result;
	}

	// 2. Recursively find all Markdown files in this folder
	const markdownFiles: TFile[] = [];
	function collectFiles(folder: TFolder) {
		for (const child of folder.children) {
			if (child instanceof TFolder) {
				collectFiles(child);
			} else if (child instanceof TFile && child.extension === 'md') {
				markdownFiles.push(child);
			}
		}
	}
	collectFiles(abstractFolder);

	// 3. Parse each file's frontmatter
	for (const file of markdownFiles) {
		const cache = app.metadataCache.getFileCache(file);
		
		// If there is no frontmatter, it's not a test file. Skip silently.
		if (!cache || !cache.frontmatter) {
			continue;
		}

		// Also skip if it explicitly says it's not a test, or lacks the required test-type
		if (!cache.frontmatter['test-type'] && !cache.frontmatter['type']) {
			continue;
		}

		const parsed = parseFrontmatterTest(
			cache.frontmatter,
			file.path,
			file.basename,
		);

		if (parsed.valid && parsed.test) {
			result.tests.push(parsed.test);
			result.sourceFiles.set(parsed.test.id, file);
		} else {
			result.errors.set(file.path, parsed.errors);
		}
	}

	return result;
}
