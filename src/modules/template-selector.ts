import { Question, ChoiceType } from "inquirer";
import * as fs from "fs";
import * as path from "path";
import { Templater, TemplateSettings } from "./templater";

export const templateSelector = (templatePath: string): Question => {
  const result: string[] = fs.readdirSync(templatePath);

  let question: Question = {
    type: "list",
    name: "selectapp",
    message: "Select an application"
  };

  let promts: ChoiceType[] = [];
  result.forEach((entry: string) => {
    const dir = path.join(templatePath, entry);
    const settings: TemplateSettings = Templater.FetchTemplateSettings(dir);

    promts.push({
      name: settings.name,
      value: entry
    });
  });

  question.choices = promts;

  return question;
};
