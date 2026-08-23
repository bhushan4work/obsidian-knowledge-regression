import type { KnowledgeTest, TestType } from './types';
import { validateTest, type ValidationResult } from './validation';

export interface ParseResult {
	test?: KnowledgeTest;
	valid: boolean;
	errors: string[];
}

/**
 * Coerces an unknown value to a string, returning undefined if null/empty.
 */
function asString(val: unknown): string | undefined {
	if (val === undefined || val === null) return undefined;
	const str = (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' 
		? String(val) 
		: JSON.stringify(val)).trim();
	return str.length > 0 ? str : undefined;
}

/**
 * Coerces an unknown value to a number.
 */
function asNumber(val: unknown): number | undefined {
	if (typeof val === 'number') return val;
	if (typeof val === 'string') {
		const parsed = Number(val);
		return Number.isNaN(parsed) ? undefined : parsed;
	}
	return undefined;
}

/**
 * Coerces an unknown value to a boolean.
 */
function asBoolean(val: unknown, fallback = true): boolean {
	if (typeof val === 'boolean') return val;
	if (typeof val === 'string') {
		const lower = val.toLowerCase().trim();
		if (lower === 'false' || lower === '0') return false;
		if (lower === 'true' || lower === '1') return true;
	}
	return fallback;
}

/**
 * Valid test types for schema checking.
 */
const VALID_TEST_TYPES = new Set<string>([
	'note-exists',
	'link-exists',
	'min-backlinks',
	'frontmatter-property',
	'source-exists',
]);

/**
 * Parses a flat frontmatter object into a strongly-typed KnowledgeTest.
 * Uses file metadata for defaults (id, name).
 */
export function parseFrontmatterTest(
	frontmatter: Record<string, unknown> | null | undefined,
	filePath: string,
	fileBasename: string,
): ParseResult {
	if (!frontmatter) {
		return { valid: false, errors: ['No frontmatter found in file.'] };
	}

	const rawType = asString(frontmatter['test-type'] ?? frontmatter['type']);
	if (!rawType) {
		return { valid: false, errors: ['Missing "test-type" property.'] };
	}
	if (!VALID_TEST_TYPES.has(rawType)) {
		return {
			valid: false,
			errors: [`Unknown test type: "${rawType}".`],
		};
	}

	const testType = rawType as TestType;

	// Base properties
	const test: Record<string, unknown> = {
		id: filePath,
		name: asString(frontmatter['test-name'] ?? frontmatter['name']) ?? fileBasename,
		type: testType,
		enabled: asBoolean(frontmatter['enabled'], true),
	};

	// Type-specific properties
	const notePath = asString(frontmatter['note-path'] ?? frontmatter['notePath']);
	if (notePath) {
		// All tests use notePath
		test.notePath = notePath;
	}

	switch (testType) {
		case 'link-exists':
			test.targetNotePath = asString(
				frontmatter['target-note-path'] ?? frontmatter['targetNotePath'],
			);
			break;
		case 'min-backlinks':
			test.minCount = asNumber(
				frontmatter['min-count'] ?? frontmatter['minCount'],
			);
			break;
		case 'frontmatter-property':
			test.propertyName = asString(
				frontmatter['property-name'] ?? frontmatter['propertyName'],
			);
			test.expectedValue = asString(
				frontmatter['expected-value'] ?? frontmatter['expectedValue'],
			);
			break;
		case 'source-exists':
			test.sourceProperty = asString(
				frontmatter['source-property'] ?? frontmatter['sourceProperty'],
			);
			break;
	}

	// Now run it through the rigorous domain validator
	const candidate = test as unknown as KnowledgeTest;
	const validation: ValidationResult = validateTest(candidate);

	if (!validation.valid) {
		return {
			valid: false,
			errors: validation.errors.map((e) => `${e.field}: ${e.message}`),
		};
	}

	return {
		valid: true,
		test: candidate,
		errors: [],
	};
}
