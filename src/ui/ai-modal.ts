import { App, Modal, Setting, Notice } from 'obsidian';
import { fetchAiCompletion } from '../ai/service';
import { AI_SYSTEM_PROMPT } from '../ai/prompts';
import type MyPlugin from '../main';

export class AiConsentModal extends Modal {
	plugin: MyPlugin;
	actionType: 'explain' | 'generate';
	promptText: string;
	onComplete: (result: string) => void;

	constructor(
		app: App,
		plugin: MyPlugin,
		actionType: 'explain' | 'generate',
		promptText: string,
		onComplete: (result: string) => void
	) {
		super(app);
		this.plugin = plugin;
		this.actionType = actionType;
		this.promptText = promptText;
		this.onComplete = onComplete;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		contentEl.createEl('h2', { 
			text: this.actionType === 'explain' ? 'AI explanation' : 'Generate test with AI'
		});

		const warningDiv = contentEl.createDiv('kr-ai-warning');
		warningDiv.setText('Data privacy notice: The following prompt will be sent to the configured AI provider. Please review the content below before proceeding.');

		contentEl.createEl('h4', { text: 'Prompt to be sent:' });
		
		const promptArea = contentEl.createEl('textarea', { cls: 'kr-ai-prompt-area' });
		promptArea.value = this.promptText;
		promptArea.readOnly = this.actionType === 'explain';

		if (this.actionType === 'generate') {
			promptArea.readOnly = false;
			promptArea.placeholder = 'Describe what you want to test...';
		}

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => {
					this.close();
				})
			)
			.addButton(btn => btn
				.setButtonText('Ask AI')
				.setCta()
				.onClick(() => {
					btn.setButtonText('Thinking...').setDisabled(true);
					
					void (async () => {
						try {
							const result = await fetchAiCompletion({
								baseUrl: this.plugin.settings.aiProviderUrl,
								apiKey: this.plugin.settings.aiApiKey,
								model: this.plugin.settings.aiModel,
								systemPrompt: AI_SYSTEM_PROMPT,
								userPrompt: promptArea.value
							});
							this.onComplete(result);
							this.close();
						} catch (e) {
							new Notice(`AI Error: ${e instanceof Error ? e.message : String(e)}`);
							btn.setButtonText('Ask AI').setDisabled(false);
						}
					})();
				})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class AiResultModal extends Modal {
	title: string;
	resultText: string;

	constructor(app: App, title: string, resultText: string) {
		super(app);
		this.title = title;
		this.resultText = resultText;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		contentEl.createEl('h2', { text: this.title });
		
		const textarea = contentEl.createEl('textarea', { cls: 'kr-ai-result-area' });
		textarea.value = this.resultText;
		textarea.readOnly = true;

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Close')
				.onClick(() => {
					this.close();
				})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
