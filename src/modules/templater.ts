import * as fs from "fs";
import * as path from "path";

export interface TemplateSettings {
  name: string;
}

export class Templater {
  public static FetchTemplateSettings(templatePath: string): TemplateSettings {
    return JSON.parse(fs.readFileSync(path.join(templatePath, "template.json"), "utf8"));
  }
}
