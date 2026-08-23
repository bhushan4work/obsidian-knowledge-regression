import { App } from 'obsidian';
import type { KnowledgeTest, TestResult, TestSuiteResult } from './types';
import { validateTest } from './validation';
import {
	runFrontmatterProperty,
	runLinkExists,
	runMinBacklinks,
	runNoteExists,
	runSourceExists,
} from './test-definitions';

/**
 * Dispatches a validated test to the correct implementation.
 */
function executeTest(app: App, test: KnowledgeTest): TestResult {
	switch (test.type) {
		case 'note-exists':
			return runNoteExists(app, test);
		case 'link-exists':
			return runLinkExists(app, test);
		case 'min-backlinks':
			return runMinBacklinks(app, test);
		case 'frontmatter-property':
			return runFrontmatterProperty(app, test);
		case 'source-exists':
			return runSourceExists(app, test);
	}
}

/**
 * Runs all enabled tests and returns an aggregated suite result.
 * Invalid or erroring tests are reported as failures rather than thrown.
 */
export function runTestSuite(
	app: App,
	tests: KnowledgeTest[],
): TestSuiteResult {
	const results: TestResult[] = [];

	for (const test of tests) {
		if (!test.enabled) {
			continue;
		}

		const validation = validateTest(test);
		if (!validation.valid) {
			const messages = validation.errors
				.map((e) => `${e.field}: ${e.message}`)
				.join('; ');
			results.push({
				testId: test.id,
				testName: test.name,
				type: test.type,
				status: 'error',
				explanation: `Invalid test definition: ${messages}`,
				affectedNotes: 'notePath' in test && typeof test.notePath === 'string' ? [test.notePath] : [],
				sourceTestFile: test.id,
			});
			continue;
		}

		try {
			results.push(executeTest(app, test));
		} catch (err) {
			results.push({
				testId: test.id,
				testName: test.name,
				type: test.type,
				status: 'error',
				explanation: `Execution error: ${err instanceof Error ? err.message : String(err)}`,
				affectedNotes: [test.notePath],
				sourceTestFile: test.id,
			});
		}
	}

	const passed = results.filter((r) => r.status === 'passed').length;
	return {
		results,
		passed,
		failed: results.length - passed,
		total: results.length,
		timestamp: Date.now(),
	};
}

/**
 * Runs only the tests whose notePath matches the given path.
 */
export function runTestsForNote(
	app: App,
	tests: KnowledgeTest[],
	notePath: string,
): TestSuiteResult {
	const normalized = notePath.replace(/\.md$/, '');
	const relevant = tests.filter((t) => {
		if (!t.enabled) return false;
		return t.notePath.replace(/\.md$/, '') === normalized;
	});
	return runTestSuite(app, relevant);
}
