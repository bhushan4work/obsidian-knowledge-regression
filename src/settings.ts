import { App, PluginSettingTab, Setting } from 'obsidian';
import KnowledgeRegressionPlugin from './main';

export interface KnowledgeRegressionSettings {
	testFolder: string;
}

export const DEFAULT_SETTINGS: KnowledgeRegressionSettings = {
	testFolder: '_knowledge-tests',
};

export class KnowledgeRegressionSettingTab extends PluginSettingTab {
	plugin: KnowledgeRegressionPlugin;

	constructor(app: App, plugin: KnowledgeRegressionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Test folder')
			.setDesc('The vault folder where your knowledge test definitions are stored.')
			.addText((text) =>
				text
					.setPlaceholder('_knowledge-tests')
					.setValue(this.plugin.settings.testFolder)
					.onChange(async (value) => {
						this.plugin.settings.testFolder = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
