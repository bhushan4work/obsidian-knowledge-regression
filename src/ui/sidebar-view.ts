import { ItemView, WorkspaceLeaf, setIcon, TFile, Notice } from 'obsidian';
import { loadTestsFromFolder, type LoadedTests } from '../loader';
import { runTestSuite } from '../test-runner';
import type { TestSuiteResult } from '../types';
import MyPlugin from '../main';
import { AiConsentModal, AiResultModal } from './ai-modal';
import { buildExplanationPrompt, buildGeneratorPrompt } from '../ai/prompts';

export const VIEW_TYPE_KNOWLEDGE_REGRESSION = 'knowledge-regression-view';

export class KnowledgeRegressionView extends ItemView {
	plugin: MyPlugin;
	loadedTests: LoadedTests | null = null;
	lastResults: TestSuiteResult | null = null;
	testFolder = '_knowledge-tests'; // We'll make this a setting later

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_KNOWLEDGE_REGRESSION;
	}

	getDisplayText(): string {
		return 'Knowledge regression';
	}

	getIcon(): string {
		return 'shield-check';
	}

	watcher: import('../watcher').TestWatcher | null = null;

	async onOpen() {
		this.render();
		await this.refreshTests();
		
		// Start watching for file changes
		const { TestWatcher } = await import('../watcher');
		this.watcher = new TestWatcher(this.plugin, this);
		this.watcher.start();
	}

	async onClose() {
		if (this.watcher) {
			this.watcher.stop();
			this.watcher = null;
		}
		this.contentEl.empty();
	}

	async refreshTests() {
		// Replace this with the actual settings value later
		const folder = this.plugin.settings?.testFolder ?? this.testFolder;
		this.loadedTests = loadTestsFromFolder(this.app, folder);
		// Reset results when refreshing definitions
		this.lastResults = null;
		this.render();
	}

	async runAllTests() {
		if (!this.loadedTests || this.loadedTests.tests.length === 0) {
			new Notice('No tests to run.');
			return;
		}

		this.lastResults = runTestSuite(this.app, this.loadedTests.tests);
		this.render();
	}

	async runSingleTest(testId: string) {
		await this.runMultipleTests([testId]);
	}

	async runMultipleTests(testIds: string[]) {
		if (!this.loadedTests) return;
		
		const testsToRun = this.loadedTests.tests.filter((t) => testIds.includes(t.id));
		if (testsToRun.length === 0) return;

		const partialResult = runTestSuite(this.app, testsToRun);
		
		if (!this.lastResults) {
			this.lastResults = {
				results: [],
				passed: 0,
				failed: 0,
				total: 0,
				timestamp: Date.now()
			};
		}

		// Update the specific results
		for (const res of partialResult.results) {
			const existingIndex = this.lastResults.results.findIndex(r => r.testId === res.testId);
			if (existingIndex >= 0) {
				this.lastResults.results[existingIndex] = res;
			} else {
				this.lastResults.results.push(res);
			}
		}

		// Recalculate totals
		this.lastResults.passed = this.lastResults.results.filter(r => r.status === 'passed').length;
		this.lastResults.failed = this.lastResults.results.filter(r => r.status === 'failed').length;
		this.lastResults.total = this.lastResults.results.length;
		this.lastResults.timestamp = Date.now();

		this.render();
	}

	openNote(path: string) {
		const abstractFile = this.app.vault.getAbstractFileByPath(path);
		if (abstractFile instanceof TFile) {
			void this.app.workspace.getLeaf(false).openFile(abstractFile);
		} else {
			new Notice(`Could not find note: ${path}`);
		}
	}

	render() {
		const container = this.contentEl;
		container.empty();
		container.addClass('knowledge-regression-container');

		// Header Controls
		const headerEl = container.createDiv('nav-header');
		const titleEl = headerEl.createDiv('nav-header-title');
		titleEl.setText('Knowledge tests');

		const actionsEl = headerEl.createDiv('nav-buttons-container');
		
		const refreshBtn = actionsEl.createDiv('clickable-icon nav-action-button');
		refreshBtn.setAttribute('aria-label', 'Refresh tests');
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.addEventListener('click', () => {
			void this.refreshTests();
		});

		const runAllBtn = actionsEl.createDiv('clickable-icon nav-action-button');
		runAllBtn.setAttribute('aria-label', 'Run all tests');
		setIcon(runAllBtn, 'play');
		runAllBtn.addEventListener('click', () => {
			void this.runAllTests();
		});

		if (this.plugin.settings.aiEnabled) {
			const generateBtn = actionsEl.createDiv('clickable-icon nav-action-button');
			generateBtn.setAttribute('aria-label', 'Generate test with AI');
			setIcon(generateBtn, 'sparkles');
			generateBtn.addEventListener('click', () => {
				new AiConsentModal(
					this.app,
					this.plugin,
					'generate',
					buildGeneratorPrompt(''),
					(result) => {
						new AiResultModal(this.app, 'Generated test', result).open();
					}
				).open();
			});
		}

		if (!this.loadedTests) {
			container.createDiv('pane-empty').setText('Loading tests...');
			return;
		}

		const totalTests = this.loadedTests.tests.length;
		const errorCount = this.loadedTests.errors.size;

		if (totalTests === 0 && errorCount === 0) {
			const emptyState = container.createDiv('pane-empty');
			emptyState.setText(`No tests found in folder "${this.testFolder}". Create some markdown files with test frontmatter.`);
			return;
		}

		// Summary Stats
		if (this.lastResults) {
			const summaryEl = container.createDiv('kr-summary');

			const passed = this.lastResults.results.filter(r => r.status === 'passed').length;
			const failed = this.lastResults.results.filter(r => r.status === 'failed').length;
			const errors = this.lastResults.results.filter(r => r.status === 'error').length;

			summaryEl.createDiv().setText(`Pass: ${passed}`);
			summaryEl.createDiv().setText(`Fail: ${failed}`);
			summaryEl.createDiv().setText(`Err: ${errors}`);
		}

		// Parse Errors
		if (errorCount > 0) {
			const errSection = container.createDiv();
			errSection.createEl('h4', { text: `Parse Errors (${errorCount})`, cls: 'kr-section-header' });
			for (const [path, errors] of this.loadedTests.errors.entries()) {
				const errItem = errSection.createDiv('kr-error-item');
				errItem.createDiv().setText(path);
				const ul = errItem.createEl('ul');
				for (const e of errors) {
					ul.createEl('li').setText(e);
				}
			}
		}

		// Test List
		const listEl = container.createDiv('kr-test-list');
		for (const test of this.loadedTests.tests) {
			const result = this.lastResults?.results.find((r) => r.testId === test.id);
			
			const itemEl = listEl.createDiv('kr-test-item');

			const itemHeader = itemEl.createDiv('kr-test-header');
			const titleContainer = itemHeader.createDiv('kr-test-title-container');

			// Status icon
			const statusIcon = titleContainer.createDiv();
			if (!test.enabled) {
				setIcon(statusIcon, 'minus-circle');
				statusIcon.addClass('kr-icon-disabled');
				statusIcon.setAttribute('aria-label', 'Disabled');
			} else if (!result) {
				setIcon(statusIcon, 'circle');
				statusIcon.addClass('kr-icon-not-run');
				statusIcon.setAttribute('aria-label', 'Not run');
			} else if (result.status === 'passed') {
				setIcon(statusIcon, 'check-circle');
				statusIcon.addClass('kr-icon-passed');
				statusIcon.setAttribute('aria-label', 'Passed');
			} else if (result.status === 'failed') {
				setIcon(statusIcon, 'x-circle');
				statusIcon.addClass('kr-icon-failed');
				statusIcon.setAttribute('aria-label', 'Failed');
			} else {
				setIcon(statusIcon, 'alert-triangle');
				statusIcon.addClass('kr-icon-error');
				statusIcon.setAttribute('aria-label', 'Error');
			}

			// Title
			const titleText = titleContainer.createDiv('kr-test-title');
			titleText.setText(test.name);

			// Run button
			const runBtn = itemHeader.createDiv('clickable-icon');
			setIcon(runBtn, 'play');
			runBtn.setAttribute('aria-label', 'Run this test');
			runBtn.addEventListener('click', () => {
				void this.runSingleTest(test.id);
			});

			// Details
			if (result) {
				const detailsEl = itemEl.createDiv('kr-test-details');
				detailsEl.createDiv().setText(result.explanation);

				if (result.affectedNotes.length > 0) {
					const notesEl = detailsEl.createDiv('kr-test-notes');
					notesEl.setText('Notes: ');
					
					result.affectedNotes.forEach((notePath, index) => {
						const linkEl = notesEl.createEl('a', { cls: 'internal-link' });
						linkEl.setText(notePath);
						linkEl.addEventListener('click', (e) => {
							e.preventDefault();
							this.openNote(notePath);
						});
						
						if (index < result.affectedNotes.length - 1) {
							notesEl.appendText(', ');
						}
					});
				}

				if (result.status === 'failed' && this.plugin.settings.aiEnabled) {
					const aiExplainBtn = detailsEl.createEl('button', { text: 'Ask AI why this failed', cls: 'kr-ai-explain-btn' });
					aiExplainBtn.addEventListener('click', () => {
						new AiConsentModal(
							this.app,
							this.plugin,
							'explain',
							buildExplanationPrompt(test.name, result.explanation, result.affectedNotes),
							(aiResult) => {
								new AiResultModal(this.app, 'AI explanation', aiResult).open();
							}
						).open();
					});
				}
			}
		}
	}
}
