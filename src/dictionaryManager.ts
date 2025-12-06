import { Notice, requestUrl } from "obsidian";
import type SelectSpellCheckPlugin from "../main";

export const DICTIONARY_REPO_BASE =
	"https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries";

export const VALID_DICTIONARIES = [
	{ code: "bg", name: "Bulgarian" },
	{ code: "br", name: "Breton" },
	{ code: "ca", name: "Catalan" },
	{ code: "ca-valencia", name: "Catalan (Valencia)" },
	{ code: "cs", name: "Czech" },
	{ code: "cy", name: "Welsh" },
	{ code: "da", name: "Danish" },
	{ code: "de", name: "German" },
	{ code: "de-AT", name: "German (Austria)" },
	{ code: "de-CH", name: "German (Switzerland)" },
	{ code: "el", name: "Greek" },
	{ code: "el-polyton", name: "Greek (Polyton)" },
	{ code: "en", name: "English" },
	{ code: "en-AU", name: "English (Australia)" },
	{ code: "en-CA", name: "English (Canada)" },
	{ code: "en-GB", name: "English (United Kingdom)" },
	{ code: "en-ZA", name: "English (South Africa)" },
	{ code: "eo", name: "Esperanto" },
	{ code: "es", name: "Spanish" },
	{ code: "es-AR", name: "Spanish (Argentina)" },
	{ code: "es-BO", name: "Spanish (Bolivia)" },
	{ code: "es-CL", name: "Spanish (Chile)" },
	{ code: "es-CO", name: "Spanish (Colombia)" },
	{ code: "es-CR", name: "Spanish (Costa Rica)" },
	{ code: "es-CU", name: "Spanish (Cuba)" },
	{ code: "es-DO", name: "Spanish (Dominican Republic)" },
	{ code: "es-EC", name: "Spanish (Ecuador)" },
	{ code: "es-GT", name: "Spanish (Guatemala)" },
	{ code: "es-HN", name: "Spanish (Honduras)" },
	{ code: "es-MX", name: "Spanish (Mexico)" },
	{ code: "es-NI", name: "Spanish (Nicaragua)" },
	{ code: "es-PA", name: "Spanish (Panama)" },
	{ code: "es-PE", name: "Spanish (Peru)" },
	{ code: "es-PH", name: "Spanish (Philippines)" },
	{ code: "es-PR", name: "Spanish (Puerto Rico)" },
	{ code: "es-PY", name: "Spanish (Paraguay)" },
	{ code: "es-SV", name: "Spanish (El Salvador)" },
	{ code: "es-US", name: "Spanish (United States of America)" },
	{ code: "es-UY", name: "Spanish (Uruguay)" },
	{ code: "es-VE", name: "Spanish (Venezuela)" },
	{ code: "et", name: "Estonian" },
	{ code: "eu", name: "Basque" },
	{ code: "fa", name: "Persian" },
	{ code: "fo", name: "Faroese" },
	{ code: "fr", name: "French" },
	{ code: "fur", name: "Friulian" },
	{ code: "fy", name: "Western Frisian" },
	{ code: "ga", name: "Irish" },
	{ code: "gd", name: "Scottish Gaelic" },
	{ code: "gl", name: "Galician" },
	{ code: "he", name: "Hebrew" },
	{ code: "hr", name: "Croatian" },
	{ code: "hu", name: "Hungarian" },
	{ code: "hy", name: "Armenian" },
	{ code: "hyw", name: "Western Armenian" },
	{ code: "ia", name: "Interlingua" },
	{ code: "ie", name: "Interlingue" },
	{ code: "is", name: "Icelandic" },
	{ code: "it", name: "Italian" },
	{ code: "ka", name: "Georgian" },
	{ code: "ko", name: "Korean" },
	{ code: "la", name: "Latin" },
	{ code: "lb", name: "Luxembourgish" },
	{ code: "lt", name: "Lithuanian" },
	{ code: "ltg", name: "Latgalian" },
	{ code: "lv", name: "Latvian" },
	{ code: "mk", name: "Macedonian" },
	{ code: "mn", name: "Mongolian" },
	{ code: "nb", name: "Norwegian Bokmål" },
	{ code: "nds", name: "Low German" },
	{ code: "ne", name: "Nepali" },
	{ code: "nl", name: "Dutch" },
	{ code: "nn", name: "Norwegian Nynorsk" },
	{ code: "oc", name: "Occitan" },
	{ code: "pl", name: "Polish" },
	{ code: "pt", name: "Portuguese" },
	{ code: "pt-PT", name: "Portuguese (Portugal)" },
	{ code: "ro", name: "Romanian" },
	{ code: "ru", name: "Russian" },
	{ code: "rw", name: "Kinyarwanda" },
	{ code: "sk", name: "Slovak" },
	{ code: "sl", name: "Slovenian" },
	{ code: "sr", name: "Serbian" },
	{ code: "sr-Latn", name: "Serbian (Latin script)" },
	{ code: "sv", name: "Swedish" },
	{ code: "sv-FI", name: "Swedish (Finland)" },
	{ code: "tk", name: "Turkmen" },
	{ code: "tlh", name: "Klingon" },
	{ code: "tlh-Latn", name: "Klingon (Latin script)" },
	{ code: "tr", name: "Turkish" },
	{ code: "uk", name: "Ukrainian" },
	{ code: "vi", name: "Vietnamese" },
];

export class DictionaryManager {
	private plugin: SelectSpellCheckPlugin;

	constructor(plugin: SelectSpellCheckPlugin) {
		this.plugin = plugin;
	}

	getDictionaryPath(code: string): { affPath: string; dicPath: string } {
		const baseDir = `${this.plugin.manifest.dir}/dic/${code}`;
		return {
			affPath: `${baseDir}/index.aff`,
			dicPath: `${baseDir}/index.dic`,
		};
	}

	async isDictionaryInstalled(code: string): Promise<boolean> {
		const { affPath, dicPath } = this.getDictionaryPath(code);
		const adapter = this.plugin.app.vault.adapter;

		return (
			(await adapter.exists(affPath)) && (await adapter.exists(dicPath))
		);
	}

	async getInstalledDictionaries(): Promise<string[]> {
		const installed: string[] = [];

		for (const dict of VALID_DICTIONARIES) {
			if (await this.isDictionaryInstalled(dict.code)) {
				installed.push(dict.code);
			}
		}

		return installed;
	}

	async downloadDictionary(name: string, code: string): Promise<boolean> {
		try {
			const adapter = this.plugin.app.vault.adapter;
			const { affPath, dicPath } = this.getDictionaryPath(code);

			const dirPath = `${this.plugin.manifest.dir}/dic/${code}`;
			await adapter.mkdir(dirPath);

			const affUrl = `${DICTIONARY_REPO_BASE}/${code}/index.aff`;
			const affResponse = await requestUrl(affUrl);

			if (affResponse.status !== 200) {
				throw new Error(
					`Failed to download .aff file: ${affResponse.status}`
				);
			}

			const affData = affResponse.text;
			await adapter.write(affPath, affData);

			const dicUrl = `${DICTIONARY_REPO_BASE}/${code}/index.dic`;
			const dicResponse = await requestUrl(dicUrl);

			if (dicResponse.status !== 200) {
				throw new Error(
					`Failed to download .dic file: ${dicResponse.status}`
				);
			}

			const dicData = dicResponse.text;
			await adapter.write(dicPath, dicData);

			new Notice(`Downloaded ${name} dictionary`);
			return true;
		} catch (error) {
			console.error(`Failed to download ${name} dictionary:`, error);
			new Notice(`Failed to download ${name} dictionary.`);
			return false;
		}
	}

	async deleteDictionary(name: string, code: string): Promise<boolean> {
		try {
			const adapter = this.plugin.app.vault.adapter;
			const dirPath = `${this.plugin.manifest.dir}/dic/${code}`;

			await adapter.rmdir(dirPath, true);
			new Notice(`Deleted ${name} dictionary`);
			return true;
		} catch (error) {
			console.error(`Failed to delete ${name} dictionary:`, error);
			new Notice(`Failed to delete ${name} dictionary`);
			return false;
		}
	}
}
