import { Plugin, WorkspaceLeaf } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	type KnowledgeRegressionSettings,
	KnowledgeRegressionSettingTab,
} from './settings';
import {
	KnowledgeRegressionView,
	VIEW_TYPE_KNOWLEDGE_REGRESSION,
} from './ui/sidebar-view';

export default class KnowledgeRegressionPlugin extends Plugin {
	settings!: KnowledgeRegressionSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_KNOWLEDGE_REGRESSION,
			(leaf) => new KnowledgeRegressionView(leaf, this)
		);

		this.addRibbonIcon('shield-check', 'Knowledge regression', () => {
			void this.activateView();
		});

		this.addCommand({
			id: 'open-view',
			name: 'Open view',
			callback: () => {
				void this.activateView();
			},
		});

		this.addSettingTab(new KnowledgeRegressionSettingTab(this.app, this));
	}

	onunload() {
		// Obsidian auto-cleans up views, commands, and settings tabs
	}

	async activateView() {
		const { workspace } = this.app;
		
		let leaf: WorkspaceLeaf | null | undefined = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_KNOWLEDGE_REGRESSION);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_KNOWLEDGE_REGRESSION, active: true });
			}
		}

		if (leaf) {
			// "Reveal" the leaf in case it is in a collapsed sidebar
			void workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<KnowledgeRegressionSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
