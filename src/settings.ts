import { App, PluginSettingTab, Setting } from 'obsidian';
import KnowledgeRegressionPlugin from './main';

export interface KnowledgeRegressionSettings {
	testFolder: string;
	aiEnabled: boolean;
	aiProviderUrl: string;
	aiModel: string;
	aiApiKey: string;
}

export const DEFAULT_SETTINGS: KnowledgeRegressionSettings = {
	testFolder: '_knowledge-tests',
	aiEnabled: false,
	aiProviderUrl: 'https://api.openai.com/v1',
	aiModel: 'gpt-4o-mini',
	aiApiKey: '',
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

		new Setting(containerEl)
			.setName('AI assistance (optional)')
			.setHeading();

		new Setting(containerEl)
			.setName('Enable AI features')
			.setDesc('Shows AI assistance buttons for generating and explaining tests. Requires an API provider.')
			.addToggle((toggle) => 
				toggle
					.setValue(this.plugin.settings.aiEnabled)
					.onChange(async (value) => {
						this.plugin.settings.aiEnabled = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (this.plugin.settings.aiEnabled) {
			new Setting(containerEl)
				.setName('Provider URL')
				.setDesc('The base URL for the OpenAI-compatible API (e.g. OpenAI, Ollama, OpenRouter).')
				.addText((text) =>
					text
						.setPlaceholder('https://api.openai.com/v1')
						.setValue(this.plugin.settings.aiProviderUrl)
						.onChange(async (value) => {
							this.plugin.settings.aiProviderUrl = value;
							await this.plugin.saveSettings();
						}),
				);

			new Setting(containerEl)
				.setName('Model')
				.setDesc('The model ID to use.')
				.addText((text) =>
					text
						.setPlaceholder('gpt-4o-mini')
						.setValue(this.plugin.settings.aiModel)
						.onChange(async (value) => {
							this.plugin.settings.aiModel = value;
							await this.plugin.saveSettings();
						}),
				);

			new Setting(containerEl)
				.setName('API key')
				.setDesc('Stored locally in plain text (data.json). Do not commit your vault to public repositories!')
				.addText((text) => {
					text.inputEl.type = 'password';
					text
						.setPlaceholder('sk-...')
						.setValue(this.plugin.settings.aiApiKey)
						.onChange(async (value) => {
							this.plugin.settings.aiApiKey = value;
							await this.plugin.saveSettings();
						});
				});
		}
	}
}
