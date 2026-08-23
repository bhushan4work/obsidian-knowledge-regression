import { type EventRef, TAbstractFile, TFile, debounce as obsidianDebounce } from 'obsidian';
import type { KnowledgeRegressionView } from './ui/sidebar-view';
import type MyPlugin from './main';

export class TestWatcher {
	private plugin: MyPlugin;
	private view: KnowledgeRegressionView;
	private affectedTestIds: Set<string> = new Set();
	private needsFullRefresh = false;
	private eventRefs: Array<{ manager: { offref: (ref: EventRef) => void }, ref: EventRef }> = [];
	
	private debouncedRun: () => void;

	constructor(plugin: MyPlugin, view: KnowledgeRegressionView) {
		this.plugin = plugin;
		this.view = view;
		
		// Use Obsidian's debounce (wait 1000ms after last change before executing)
		this.debouncedRun = obsidianDebounce(
			() => this.executeQueue(),
			1000,
			true
		);
	}

	start() {
		const { vault, metadataCache } = this.plugin.app;

		this.eventRefs.push({
			manager: metadataCache,
			ref: metadataCache.on('changed', (file) => this.handleFileChange(file))
		});
		this.eventRefs.push({
			manager: vault,
			ref: vault.on('rename', (file, oldPath) => this.handleRename(file, oldPath))
		});
		this.eventRefs.push({
			manager: vault,
			ref: vault.on('delete', (file) => this.handleFileChange(file))
		});
		this.eventRefs.push({
			manager: vault,
			ref: vault.on('create', (file) => this.handleFileChange(file))
		});
	}

	stop() {
		for (const { manager, ref } of this.eventRefs) {
			manager.offref(ref);
		}
		this.eventRefs = [];
	}

	private isTestFolderFile(path: string): boolean {
		const folder = this.plugin.settings?.testFolder ?? '_knowledge-tests';
		return path.startsWith(folder + '/');
	}

	private handleFileChange(file: TAbstractFile) {
		if (!(file instanceof TFile)) return;

		if (this.isTestFolderFile(file.path)) {
			this.needsFullRefresh = true;
			this.debouncedRun();
			return;
		}

		this.markAffected(file.path);
		this.debouncedRun();
	}

	private handleRename(file: TAbstractFile, oldPath: string) {
		if (!(file instanceof TFile)) return;

		if (this.isTestFolderFile(file.path) || this.isTestFolderFile(oldPath)) {
			this.needsFullRefresh = true;
			this.debouncedRun();
			return;
		}

		this.markAffected(file.path);
		this.markAffected(oldPath);
		this.debouncedRun();
	}

	private markAffected(path: string) {
		const tests = this.view.loadedTests?.tests ?? [];
		const normalizedPath = path.replace(/\.md$/, '');

		for (const test of tests) {
			// If it's the main note being tested
			if (test.notePath.replace(/\.md$/, '') === normalizedPath) {
				this.affectedTestIds.add(test.id);
				continue;
			}

			// If it's a target note for a link test
			if (test.type === 'link-exists') {
				const target = test.targetNotePath;
				if (target && target.replace(/\.md$/, '') === normalizedPath) {
					this.affectedTestIds.add(test.id);
					continue;
				}
			}

			// If it's a min-backlinks test, any file change could potentially add/remove a link to it
			if (test.type === 'min-backlinks') {
				this.affectedTestIds.add(test.id);
				continue;
			}
		}
	}

	private executeQueue() {
		if (this.needsFullRefresh) {
			this.needsFullRefresh = false;
			this.affectedTestIds.clear();
			
			void (async () => {
				await this.view.refreshTests();
				// Automatically run tests after they are reloaded so the user gets instant feedback
				await this.view.runAllTests();
			})();
		} else if (this.affectedTestIds.size > 0) {
			const ids = Array.from(this.affectedTestIds);
			this.affectedTestIds.clear();
			void this.view.runMultipleTests(ids);
		}
	}
}
