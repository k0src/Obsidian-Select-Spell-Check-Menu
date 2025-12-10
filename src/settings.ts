import { App, PluginSettingTab, Setting, setIcon } from "obsidian";
import type SelectSpellCheckPlugin from "../main";
import { VALID_DICTIONARIES } from "./dictionaryManager";

export interface SelectSpellCheckSettings {
	customDictionary: string;
	enableNumberKeySelection: boolean;
	currentDictionary: string;
}

export const DEFAULT_SETTINGS: SelectSpellCheckSettings = {
	customDictionary: "",
	enableNumberKeySelection: true,
	currentDictionary: "en",
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

		const customWordsSetting = new Setting(containerEl)
			.setName("Custom words")
			.setDesc("Add custom words to your dictionary (one per line)");

		customWordsSetting.addTextArea((text) => {
			text.setPlaceholder("Enter words, one per line")
				.setValue(this.plugin.settings.customDictionary)
				.onChange(async (value) => {
					this.plugin.settings.customDictionary = value;
					await this.plugin.saveSettings();
					await this.plugin.loadDictionary();
				});
			text.inputEl.addClass("quick-spellcheck-textarea");
		});

		void this.addDictionarySelection(containerEl);
	}

	private async addDictionarySelection(
		containerEl: HTMLElement
	): Promise<void> {
		const installedDictionaries =
			await this.plugin.dictionaryManager.getInstalledDictionaries();

		const setting = new Setting(containerEl)
			.setName("Spell check language")
			.setDesc("");

		setting.addDropdown((dropdown) => {
			for (const dict of VALID_DICTIONARIES) {
				if (installedDictionaries.includes(dict.code)) {
					dropdown.addOption(dict.code, dict.name);
				}
			}

			dropdown
				.setValue(this.plugin.settings.currentDictionary)
				.onChange(async (value) => {
					this.plugin.settings.currentDictionary = value;
					await this.plugin.saveSettings();
					await this.plugin.loadDictionary();
				});
		});

		const downloadContainer = containerEl.createDiv(
			"dictionary-download-container"
		);

		downloadContainer.createSpan({
			text: "Available dictionaries",
		});

		const downloadList = downloadContainer.createDiv(
			"dictionary-download-list"
		);

		for (const dict of VALID_DICTIONARIES) {
			const isInstalled = installedDictionaries.includes(dict.code);
			const itemEl = downloadList.createDiv("dictionary-item");

			itemEl.createSpan({
				text: dict.name,
				cls: "dictionary-item-text",
			});

			if (isInstalled) {
				const installed = itemEl.createDiv("dictionary-item-installed");
				installed.createSpan({
					text: "Installed",
					cls: "dictionary-item-installed-text",
				});

				const deleteBtn = installed.createEl("button", {
					cls: "clickable-icon dictionary-item-delete-btn",
				});
				setIcon(deleteBtn, "trash-2");

				if (installedDictionaries.length === 1) {
					deleteBtn.disabled = true;
					deleteBtn.addClass("delete-disabled");
				}

				deleteBtn.onclick = async () => {
					if (installedDictionaries.length === 1) return;

					deleteBtn.disabled = true;
					const success =
						await this.plugin.dictionaryManager.deleteDictionary(
							dict.name,
							dict.code
						);

					if (success) {
						if (
							this.plugin.settings.currentDictionary === dict.code
						) {
							const remainingDicts = installedDictionaries.filter(
								(d) => d !== dict.code
							);
							if (remainingDicts.length > 0) {
								this.plugin.settings.currentDictionary =
									remainingDicts[0];
								await this.plugin.saveSettings();
								await this.plugin.loadDictionary();
							}
						}
						void this.display();
					} else {
						deleteBtn.disabled = false;
					}
				};
			} else {
				const downloadBtn = itemEl.createEl("button", {
					text: "Download",
					cls: "mod-cta dictionary-item-download-btn",
				});
				downloadBtn.onclick = async () => {
					downloadBtn.disabled = true;
					downloadBtn.textContent = "Downloading...";

					const success =
						await this.plugin.dictionaryManager.downloadDictionary(
							dict.name,
							dict.code
						);

					if (success) {
						void this.display();
					} else {
						downloadBtn.disabled = false;
						downloadBtn.textContent = "Download";
					}
				};
			}
		}
	}
}
