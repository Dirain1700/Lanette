import type { IGameCachedData, IGameFile } from "../types/games";
import { game as questionAndAnswerGame, QuestionAndAnswer } from './templates/question-and-answer';

const HIDDEN_POKEMON = "______";

class EeveesEvolutionaryLines extends QuestionAndAnswer {
	static cachedData: IGameCachedData = {};

	static loadData(): void {
		const hints: Dict<string[]> = {};
		const hintKeys: string[] = [];

		for (const pokemon of Games.getPokemonList()) {
			if (pokemon.prevo || !pokemon.evos.length) continue;

			const evolutionLines = Dex.getEvolutionLines(pokemon);
			const key = evolutionLines.map(x => x.join(",")).join("|");
			hints[key] = [pokemon.name];
			hintKeys.push(key);
		}

		this.cachedData.hintAnswers = hints;
		this.cachedData.hintKeys = hintKeys;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async onSetGeneratedHint(hintKey: string): Promise<string> {
		const evolutionLines = hintKey.split("|").map(x => x.split(","));
		const branchEvolution = evolutionLines.length > 1;
		const hiddenLine = this.sampleOne(evolutionLines);
		const lineHints: string[] = [];
		for (const line of evolutionLines) {
			if (line === hiddenLine) {
				let hidden = this.sampleOne(line);
				while (branchEvolution && hidden === line[0]) {
					hidden = this.sampleOne(line);
				}

				this.answers = [hidden];
				lineHints.push(line.map(x => x === hidden ? HIDDEN_POKEMON : x).join(", "));
			} else {
				lineHints.push(line.join(", "));
			}
		}

		this.hint = "<b>Randomly generated evolution line</b>: <i>" + lineHints.join(" or ") + "</i>";
		return hintKey;
	}
}

export const game: IGameFile<EeveesEvolutionaryLines> = Games.copyTemplateProperties(questionAndAnswerGame, {
	aliases: ['eevees', 'eel', 'eeveesevolutionaryline'],
	category: 'knowledge-2',
	class: EeveesEvolutionaryLines,
	commandDescriptions: [Config.commandCharacter + "g [Pokemon]"],
	defaultOptions: ['points'],
	description: "Players guess Pokemon that are missing from the given evolution lines!",
	freejoin: true,
	name: "Eevee's Evolutionary Lines",
	mascot: "Eevee",
	minigameCommand: 'evolutionaryline',
	minigameCommandAliases: ['eline'],
	minigameDescription: "Use <code>" + Config.commandCharacter + "g</code> to guess the Pokemon that is missing from the given " +
		"evolution line!",
	modes: ["collectiveteam", "pmtimeattack", "spotlightteam", "survival", "timeattack"],
});
