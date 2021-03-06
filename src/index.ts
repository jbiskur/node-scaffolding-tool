#!/usr/bin/env node
import "core-js";

import { Command } from "commander";
import { prompt, Questions } from "inquirer";
import * as path from "path";
import install from "yarn-install";

import { pluginSelector } from "./modules/plugin-selector";
import { templateSelector } from "./modules/template-selector";
import { Templater } from "./modules/templater";

const commander = new Command();

const templatesDir = path.join(__dirname, "./../templates/");
const pluginsDir = path.join(__dirname, "./../");
const question = templateSelector(templatesDir);
const questions: Questions = [
  question,
  {
    name: "project",
    type: "input",
    message: "Project Name"
  }
];

let projectName = "";

commander
  .version("0.1.0")
  .action(() => {
    prompt(questions).then(({ selectapp, project }) => {
      projectName = project;
      const tempDir = path.join(templatesDir, selectapp);
      const templater = new Templater(tempDir, projectName);
      templater.CopyFiles({
        project
      });

      const availablePlugins = pluginSelector(tempDir, pluginsDir);

      prompt(availablePlugins.question).then(async ({ plugins }) => {
        await templater.ProcessPlugins(plugins, availablePlugins.mapping);
        process.chdir(`./${projectName}`);
        install();
      });
    });
  })
  .parse(process.argv);
