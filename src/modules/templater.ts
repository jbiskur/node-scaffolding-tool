import * as fs from "fs";
import * as fse from "fs-extra";
import { prompt, Question } from "inquirer";
import * as _ from "lodash";
import * as path from "path";

export interface TemplateSettings {
  name: string;
  filesToProcess: string[];
}

interface PluginProcessor {
  files: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  package: Record<string, any>;
}

export interface PluginSettings {
  name: string;
  options?: Question[];
  processors?: Record<string, PluginProcessor>[];
  filesToProcess?: string[];
  doNotProcess?: string[];
}

const templateIgnorePatterns: RegExp[] = [new RegExp(/^(\\|\/)?plugins/, "i"), new RegExp(/template.json/, "i")];
const pluginIngorePatterns: RegExp[] = [new RegExp(/plugin.json/, "i"), new RegExp(/package.json/, "i")];

export class Templater {
  templatePath: string;
  projectPath: string;
  projectName: string;
  projectJSONPath: string;
  files: string[] = [];
  filesToIgnore: string[] = [];
  templateSettings: TemplateSettings;

  constructor(templatePath: string, projectName: string) {
    this.templatePath = templatePath;
    this.projectName = projectName;
    this.projectPath = path.join(process.cwd(), projectName);
    this.projectJSONPath = path.join(this.projectPath, "package.json");
    this.templateSettings = Templater.FetchTemplateSettings(templatePath);

    this.files = this.scanFiles(this.templatePath);
    this.processIngore();
  }

  public static FetchTemplateSettings(templatePath: string): TemplateSettings {
    return JSON.parse(fs.readFileSync(path.join(templatePath, "template.json"), "utf8"));
  }

  public static FetchPluginSettings(pluginPath: string, projectName: string): PluginSettings {
    const json = JSON.parse(fs.readFileSync(path.join(pluginPath, "plugin.json"), "utf8"));
    if (json.options.length) {
      for (let i = 0; i < json.options.length; i++) {
        if (json.options[i].when) {
          const check = json.options[i].when;
          json.options[i].when = answers => {
            return answers[check];
          };
        }

        if (json.options[i].default && json.options[i].default == "--name--") {
          json.options[i].default = projectName;
        }
      }
    }
    return json;
  }

  public static forceCopyFileSync(file: string, newFile: string) {
    fse.ensureDirSync(path.dirname(newFile));
    fs.copyFileSync(file, newFile);
  }

  public CopyFiles(parameters: Record<string, string>): void {
    const copyList = _.difference(this.files, this.filesToIgnore);
    copyList.forEach(file => {
      this.processTemplateFiles(file, parameters);
    });
  }

  public async ProcessPlugins(selected: string[], mappings: Record<string, string>) {
    for (let i = 0; i < selected.length; i++) {
      const pluginName = selected[i];
      const pluginPath = path.join(mappings[pluginName], pluginName);
      const pluginSettings: PluginSettings = Templater.FetchPluginSettings(pluginPath, this.projectName);
      let ignore = _.clone(pluginIngorePatterns);
      if (pluginSettings.options) {
        const answers = await prompt(pluginSettings.options);

        if (pluginSettings.doNotProcess) {
          for (let index = 0; index < pluginSettings.doNotProcess.length; index++) {
            const pluginFileName = pluginSettings.doNotProcess[index];
            ignore.push(new RegExp(`${pluginName}[\\\\\\\/\\w\\d- ]*${pluginFileName}`, "i"));
          }
        }
        let pluginFiles = this.scanFiles(pluginPath);
        const copiedFiles = this.processPluginFiles(pluginPath, answers, pluginSettings.processors);
        pluginFiles = _.difference(pluginFiles, copiedFiles);
        pluginFiles.forEach(file => {
          switch (path.basename(file)) {
            case "package.json":
              this.processJSONFile(this.projectJSONPath, JSON.parse(fs.readFileSync(file, "utf8")));
              break;
            case "launch.json":
              const relativeFile = file.replace(pluginPath, "");
              const newFilePath = path.join(this.projectPath, relativeFile);
              this.mergeConfigurations(newFilePath, JSON.parse(fs.readFileSync(file, "utf8")));
              break;
            default:
              if (!this.test(file, ignore)) {
                const relativeFile = file.replace(pluginPath, "");
                const newFilePath = path.join(this.projectPath, relativeFile);
                Templater.forceCopyFileSync(file, newFilePath);

                const compiled = _.template(fs.readFileSync(newFilePath, "utf8"));
                fs.writeFileSync(newFilePath, compiled(answers));
              }
              break;
          }
        });
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processJSONFile(filePath: string, additionalJSON: Record<string, any>) {
    const orgJSON = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const newFile = _.merge(orgJSON, additionalJSON);
    fs.writeFileSync(filePath, JSON.stringify(newFile, null, 2));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mergeConfigurations(filePath: string, additionalJSON: Record<string, any>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orgJSON: Record<string, any> = null;
    if (fs.existsSync(filePath)) {
      orgJSON = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
      orgJSON = {
        version: "0.2.0",
        configurations: []
      };
    }
    const newFile = _.cloneDeep(orgJSON);
    newFile.configurations.push(additionalJSON.configurations);
    newFile.configurations = _.flatten(newFile.configurations);
    fse.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(newFile, null, 2));
  }

  private test(file: string, ignorePattern: RegExp[]): boolean {
    let found = false;
    for (let i = 0; i < ignorePattern.length; i++) {
      if (ignorePattern[i].test(file)) {
        found = true;
        i = ignorePattern.length;
      }
    }

    return found;
  }

  private processPluginFiles(
    pluginPath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: Record<string, any>,
    processors: Record<string, PluginProcessor>[]
  ): string[] {
    const copiedFiles: string[] = [];
    for (let questionName in answers) {
      if (processors && processors[questionName]) {
        const process: PluginProcessor = processors[questionName];
        process.files.forEach(file => {
          const filePath = path.join(pluginPath, file);
          const newFilePath = path.join(this.projectPath, file);
          Templater.forceCopyFileSync(filePath, newFilePath);

          const compiled = _.template(fs.readFileSync(newFilePath, "utf8"));
          fs.writeFileSync(newFilePath, compiled(answers));

          copiedFiles.push(filePath);
        });

        this.processJSONFile(this.projectJSONPath, process.package);
      }
    }

    return copiedFiles;
  }

  private processTemplateFiles(file: string, parameters: Record<string, string>): void {
    const relativeFile = this.extractRelativeFile(file);
    const newFilePath = path.join(this.projectPath, relativeFile);
    let process = false;
    if (this.templateSettings.filesToProcess) {
      for (let i = 0; i < this.templateSettings.filesToProcess.length; i++) {
        const newExp = RegExp(this.templateSettings.filesToProcess[i], "i");
        if (newExp.test(relativeFile)) {
          process = true;
          i = this.templateSettings.filesToProcess.length;
        }
      }
    }

    Templater.forceCopyFileSync(file, newFilePath);

    if (process) {
      const content = fs.readFileSync(newFilePath, "utf8");
      const compiled = _.template(content);
      const replaced = compiled(parameters);
      fs.writeFileSync(newFilePath, replaced);
    }
  }

  private extractRelativeFile(file: string): string {
    return file.replace(this.templatePath, "");
  }

  private processIngore(): void {
    this.files.forEach(file => {
      const relativePath = this.extractRelativeFile(file);
      let ignoreFile = this.test(relativePath, templateIgnorePatterns);
      if (ignoreFile) {
        this.filesToIgnore.push(file);
      }
    });
  }

  private scanFiles(scanPath): string[] {
    let scan = fs.readdirSync(scanPath).map(file => path.join(scanPath, file));
    let files: string[] = [];

    scan.forEach(file => {
      if (fs.statSync(file).isDirectory()) {
        files = _.concat(files, this.scanFiles(file));
      } else {
        files.push(file);
      }
    });

    return files;
  }
}
