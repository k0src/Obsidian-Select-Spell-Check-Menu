import { App, PluginSettingTab, Setting } from "obsidian";
import type SelectSpellCheckPlugin from "../main";

export interface SelectSpellCheckSettings {
	customDictionary: string;
	enableNumberKeySelection: boolean;
}

export const DEFAULT_SETTINGS: SelectSpellCheckSettings = {
	customDictionary: "",
	enableNumberKeySelection: true,
};

export class SelectSpellCheckSettingTab extends PluginSettingTab {
	plugin: SelectSpellCheckPlugin;

	constructor(app: App, plugin: SelectSpellCheckPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Enable number key selection")
			.setDesc("Press 1-9 or 0 to quickly select suggestions.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableNumberKeySelection)
					.onChange(async (value) => {
						this.plugin.settings.enableNumberKeySelection = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Custom dictionary")
			.setDesc("Add custom words to your dictionary (one per line)")
			.addTextArea((text) =>
				text
					.setPlaceholder("Enter words, one per line")
					.setValue(this.plugin.settings.customDictionary)
					.onChange(async (value) => {
						this.plugin.settings.customDictionary = value;
						await this.plugin.saveSettings();
						await this.plugin.loadDictionary();
					})
			);
	}
}
