/**
 * Supported knowledge test types.
 */
export type TestType =
	| 'note-exists'
	| 'link-exists'
	| 'min-backlinks'
	| 'frontmatter-property'
	| 'source-exists';

/**
 * Base fields shared by all test definitions.
 */
interface BaseTest {
	/** Unique identifier for this test. */
	id: string;
	/** Human-readable name for this test. */
	name: string;
	/** Whether this test should be executed. */
	enabled: boolean;
}

/**
 * Test: a note at the given path must exist in the vault.
 */
export interface NoteExistsTest extends BaseTest {
	type: 'note-exists';
	/** Path to the note (e.g. "Projects/My Project.md"). */
	notePath: string;
}

/**
 * Test: a note must contain a link to a specific target note.
 */
export interface LinkExistsTest extends BaseTest {
	type: 'link-exists';
	/** Path to the source note that should contain the link. */
	notePath: string;
	/** Path or name of the target note that must be linked to. */
	targetNotePath: string;
}

/**
 * Test: a note must have at least N backlinks (incoming references).
 */
export interface MinBacklinksTest extends BaseTest {
	type: 'min-backlinks';
	/** Path to the note. */
	notePath: string;
	/** Minimum number of incoming backlinks required. */
	minCount: number;
}

/**
 * Test: a note must have a specific frontmatter property,
 * optionally matching a specific value.
 */
export interface FrontmatterPropertyTest extends BaseTest {
	type: 'frontmatter-property';
	/** Path to the note. */
	notePath: string;
	/** Frontmatter property name to check for. */
	propertyName: string;
	/** If set, the property value must match this string. */
	expectedValue?: string;
}

/**
 * Test: a note must have at least one outgoing link or
 * a non-empty source/reference frontmatter property.
 */
export interface SourceExistsTest extends BaseTest {
	type: 'source-exists';
	/** Path to the note. */
	notePath: string;
	/** Frontmatter property name to check as fallback (defaults to "source"). */
	sourceProperty?: string;
}

/**
 * Discriminated union of all knowledge test definitions.
 */
export type KnowledgeTest =
	| NoteExistsTest
	| LinkExistsTest
	| MinBacklinksTest
	| FrontmatterPropertyTest
	| SourceExistsTest;

/**
 * Result status of a test execution.
 */
export type TestStatus = 'passed' | 'failed' | 'error';

/**
 * Result of executing a single test.
 */
export interface TestResult {
	testId: string;
	testName: string;
	type: TestType;
	status: TestStatus;
	explanation: string;
	affectedNotes: string[];
	sourceTestFile: string;
}

/**
 * Aggregated result of executing a test suite.
 */
export interface TestSuiteResult {
	results: TestResult[];
	passed: number;
	failed: number;
	total: number;
	/** Unix epoch milliseconds when the suite finished. */
	timestamp: number;
}
