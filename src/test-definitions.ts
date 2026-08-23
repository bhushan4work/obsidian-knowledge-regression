import { App, TFile } from 'obsidian';
import type {
	FrontmatterPropertyTest,
	KnowledgeTest,
	LinkExistsTest,
	MinBacklinksTest,
	NoteExistsTest,
	SourceExistsTest,
	TestResult,
} from './types';

/**
 * Resolves a note path to a TFile, returning null if not found.
 * Handles paths with or without the .md extension.
 */
function resolveNote(app: App, notePath: string): TFile | null {
	const trimmed = notePath.startsWith('/') ? notePath.slice(1) : notePath;

	// Try with .md extension first
	const withMd = trimmed.endsWith('.md') ? trimmed : `${trimmed}.md`;
	const file = app.vault.getAbstractFileByPath(withMd);
	if (file instanceof TFile) {
		return file;
	}

	// Fall back to the exact path (for non-.md files like .canvas)
	const rawFile = app.vault.getAbstractFileByPath(trimmed);
	if (rawFile instanceof TFile) {
		return rawFile;
	}

	return null;
}

import type { TestStatus } from './types';

function makeResult(
	test: KnowledgeTest,
	passedOrStatus: boolean | TestStatus,
	explanation: string,
	affectedNotes?: string[],
): TestResult {
	const status = typeof passedOrStatus === 'boolean' 
		? (passedOrStatus ? 'passed' : 'failed') 
		: passedOrStatus;

	const notes = affectedNotes ?? [
		test.notePath,
		...(test.type === 'link-exists' ? [test.targetNotePath] : [])
	];

	return {
		testId: test.id,
		testName: test.name,
		type: test.type,
		status,
		explanation,
		affectedNotes: notes,
		sourceTestFile: test.id,
	};
}

/**
 * Test: a note exists in the vault.
 */
export function runNoteExists(app: App, test: NoteExistsTest): TestResult {
	const file = resolveNote(app, test.notePath);
	if (file) {
		return makeResult(test, true, `Note "${test.notePath}" exists.`);
	}
	return makeResult(test, false, `Note "${test.notePath}" not found.`);
}

/**
 * Test: a note contains a link to a specific target note.
 * Checks body links, embeds, and frontmatter links.
 */
export function runLinkExists(app: App, test: LinkExistsTest): TestResult {
	const file = resolveNote(app, test.notePath);
	if (!file) {
		return makeResult(
			test,
			false,
			`Source note "${test.notePath}" not found.`,
		);
	}

	const cache = app.metadataCache.getFileCache(file);
	if (!cache) {
		return makeResult(
			test,
			false,
			`No metadata cache available for "${test.notePath}".`,
		);
	}

	const targetFile = resolveNote(app, test.targetNotePath);
	const normalizedTarget = test.targetNotePath.replace(/\.md$/, '');

	// Collect all link-like references in the note
	const bodyLinks = [...(cache.links ?? []), ...(cache.embeds ?? [])];
	const fmLinks = cache.frontmatterLinks ?? [];

	const matchesTarget = (linkText: string): boolean => {
		const pathOnly = linkText.replace(/#.*$/, '');

		// Resolve through the metadata cache for accurate path matching
		const resolved = app.metadataCache.getFirstLinkpathDest(
			pathOnly,
			file.path,
		);
		if (resolved && targetFile) {
			return resolved.path === targetFile.path;
		}

		// Fall back to string comparison (handles unresolved/dangling links)
		return pathOnly.replace(/\.md$/, '') === normalizedTarget;
	};

	const found =
		bodyLinks.some((l) => matchesTarget(l.link)) ||
		fmLinks.some((l) => matchesTarget(l.link));

	if (found) {
		return makeResult(
			test,
			true,
			`"${test.notePath}" links to "${test.targetNotePath}".`,
		);
	}
	return makeResult(
		test,
		false,
		`"${test.notePath}" does not link to "${test.targetNotePath}".`,
	);
}

/**
 * Test: a note has at least N incoming backlinks.
 * Uses the resolved links cache to avoid vault rescans.
 */
export function runMinBacklinks(
	app: App,
	test: MinBacklinksTest,
): TestResult {
	const file = resolveNote(app, test.notePath);
	if (!file) {
		return makeResult(test, false, `Note "${test.notePath}" not found.`);
	}

	const resolvedLinks = app.metadataCache.resolvedLinks;
	let backlinkCount = 0;

	for (const [, targets] of Object.entries(resolvedLinks)) {
		if (file.path in targets) {
			backlinkCount++;
		}
	}

	if (backlinkCount >= test.minCount) {
		return makeResult(
			test,
			true,
			`"${test.notePath}" has ${String(backlinkCount)} backlink(s) (required: ${String(test.minCount)}).`,
		);
	}
	return makeResult(
		test,
		false,
		`"${test.notePath}" has ${String(backlinkCount)} backlink(s), but ${String(test.minCount)} required.`,
	);
}

/**
 * Test: a note has a specific frontmatter property, optionally matching a value.
 */
export function runFrontmatterProperty(
	app: App,
	test: FrontmatterPropertyTest,
): TestResult {
	const file = resolveNote(app, test.notePath);
	if (!file) {
		return makeResult(test, false, `Note "${test.notePath}" not found.`);
	}

	const cache = app.metadataCache.getFileCache(file);
	if (!cache?.frontmatter) {
		return makeResult(
			test,
			false,
			`"${test.notePath}" has no frontmatter.`,
		);
	}

	const value: unknown = cache.frontmatter[test.propertyName];
	if (value === undefined) {
		return makeResult(
			test,
			false,
			`"${test.notePath}" is missing property "${test.propertyName}".`,
		);
	}

	if (test.expectedValue !== undefined) {
		const actual = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
			? String(value)
			: JSON.stringify(value);
		if (actual === test.expectedValue) {
			return makeResult(
				test,
				true,
				`"${test.notePath}" property "${test.propertyName}" equals "${test.expectedValue}".`,
			);
		}
		return makeResult(
			test,
			false,
			`"${test.notePath}" property "${test.propertyName}" is "${actual}", expected "${test.expectedValue}".`,
		);
	}

	return makeResult(
		test,
		true,
		`"${test.notePath}" has property "${test.propertyName}".`,
	);
}

/**
 * Test: a note has at least one outgoing link or a non-empty source property.
 * Checks body links/embeds first, then falls back to a frontmatter property.
 */
export function runSourceExists(
	app: App,
	test: SourceExistsTest,
): TestResult {
	const file = resolveNote(app, test.notePath);
	if (!file) {
		return makeResult(test, false, `Note "${test.notePath}" not found.`);
	}

	const cache = app.metadataCache.getFileCache(file);
	if (!cache) {
		return makeResult(
			test,
			false,
			`No metadata cache available for "${test.notePath}".`,
		);
	}

	// Check outgoing links and embeds
	const linkCount =
		(cache.links?.length ?? 0) + (cache.embeds?.length ?? 0);
	if (linkCount > 0) {
		return makeResult(
			test,
			true,
			`"${test.notePath}" has ${String(linkCount)} outgoing link(s).`,
		);
	}

	// Fall back to a source frontmatter property
	const prop = test.sourceProperty ?? 'source';
	if (cache.frontmatter) {
		const value: unknown = cache.frontmatter[prop];
		if (
			value !== undefined &&
			value !== null &&
			(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
				? String(value)
				: JSON.stringify(value)
			).trim().length > 0
		) {
			return makeResult(
				test,
				true,
				`"${test.notePath}" has "${prop}" frontmatter property.`,
			);
		}
	}

	return makeResult(
		test,
		false,
		`"${test.notePath}" has no outgoing links or "${prop}" property.`,
	);
}
