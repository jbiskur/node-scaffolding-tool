import { Question, ChoiceType } from "inquirer";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import { Templater, PluginSettings } from "./templater";

export interface PluginDictionary {
  question: Question;
  mapping: Record<string, string>;
}

function ExtractChoices(result: string[], pluginPath: string, promts: ChoiceType[], mapping: Record<string, string>) {
  result.forEach((entry: string) => {
    const dir = path.join(pluginPath, entry);
    const settings: PluginSettings = Templater.FetchPluginSettings(dir, null);
    promts.push({
      name: settings.name,
      value: entry
    });
    mapping[entry] = pluginPath;
  });
}

export const pluginSelector = (pluginPath: string, globalPluginPath: string): PluginDictionary => {
  pluginPath = path.join(pluginPath, "plugins");
  let result: string[] = fs.readdirSync(pluginPath);

  let question: Question = {
    type: "checkbox",
    name: "plugins",
    message: "Choose which plugins to install with the app"
  };

  let mapping: Record<string, string> = {};

  let promts: ChoiceType[] = [];
  ExtractChoices(result, pluginPath, promts, mapping);

  const globalPath = path.join(globalPluginPath, "plugins");
  result = fs.readdirSync(globalPath);
  ExtractChoices(result, globalPath, promts, mapping);

  question.choices = promts;

  return {
    question,
    mapping
  };
};
