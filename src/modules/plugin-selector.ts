import { Question, ChoiceType } from "inquirer";
import * as fs from "fs";
import * as path from "path";
import { Templater, PluginSettings } from "./templater";

export const pluginSelector = (pluginPath: string): Question => {
  pluginPath = path.join(pluginPath, "plugins");
  const result: string[] = fs.readdirSync(pluginPath);

  let question: Question = {
    type: "checkbox",
    name: "plugins",
    message: "Choose which plugins to install with the app"
  };

  let promts: ChoiceType[] = [];
  result.forEach((entry: string) => {
    const dir = path.join(pluginPath, entry);
    const settings: PluginSettings = Templater.FetchPluginSettings(dir, null);

    promts.push({
      name: settings.name,
      value: entry
    });
  });

  question.choices = promts;

  return question;
};
