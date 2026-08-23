import type {
	FrontmatterPropertyTest,
	KnowledgeTest,
	LinkExistsTest,
	MinBacklinksTest,
	NoteExistsTest,
	SourceExistsTest,
} from './types';

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

function validateNotePath(notePath: string, field: string): ValidationError[] {
	const errors: ValidationError[] = [];
	if (!notePath || notePath.trim().length === 0) {
		errors.push({ field, message: 'Note path must not be empty.' });
	}
	return errors;
}

function validateNoteExists(test: NoteExistsTest): ValidationError[] {
	return validateNotePath(test.notePath, 'notePath');
}

function validateLinkExists(test: LinkExistsTest): ValidationError[] {
	const errors = validateNotePath(test.notePath, 'notePath');
	if (!test.targetNotePath || test.targetNotePath.trim().length === 0) {
		errors.push({
			field: 'targetNotePath',
			message: 'Target note path must not be empty.',
		});
	}
	return errors;
}

function validateMinBacklinks(test: MinBacklinksTest): ValidationError[] {
	const errors = validateNotePath(test.notePath, 'notePath');
	if (
		typeof test.minCount !== 'number' ||
		!Number.isInteger(test.minCount) ||
		test.minCount < 1
	) {
		errors.push({
			field: 'minCount',
			message: 'Minimum backlink count must be a positive integer.',
		});
	}
	return errors;
}

function validateFrontmatterProperty(
	test: FrontmatterPropertyTest,
): ValidationError[] {
	const errors = validateNotePath(test.notePath, 'notePath');
	if (!test.propertyName || test.propertyName.trim().length === 0) {
		errors.push({
			field: 'propertyName',
			message: 'Property name must not be empty.',
		});
	}
	return errors;
}

function validateSourceExists(test: SourceExistsTest): ValidationError[] {
	return validateNotePath(test.notePath, 'notePath');
}

/**
 * Validates a single test definition and returns any errors found.
 */
export function validateTest(test: KnowledgeTest): ValidationResult {
	const commonErrors: ValidationError[] = [];

	if (!test.id || test.id.trim().length === 0) {
		commonErrors.push({ field: 'id', message: 'Test ID must not be empty.' });
	}
	if (!test.name || test.name.trim().length === 0) {
		commonErrors.push({
			field: 'name',
			message: 'Test name must not be empty.',
		});
	}

	let typeErrors: ValidationError[];

	switch (test.type) {
		case 'note-exists':
			typeErrors = validateNoteExists(test);
			break;
		case 'link-exists':
			typeErrors = validateLinkExists(test);
			break;
		case 'min-backlinks':
			typeErrors = validateMinBacklinks(test);
			break;
		case 'frontmatter-property':
			typeErrors = validateFrontmatterProperty(test);
			break;
		case 'source-exists':
			typeErrors = validateSourceExists(test);
			break;
	}

	const allErrors = [...commonErrors, ...typeErrors];
	return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * Validates an array of test definitions, returning per-test results.
 */
export function validateTests(
	tests: KnowledgeTest[],
): Map<string, ValidationResult> {
	const results = new Map<string, ValidationResult>();
	for (const test of tests) {
		results.set(test.id, validateTest(test));
	}
	return results;
}
