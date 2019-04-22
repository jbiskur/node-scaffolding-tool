#!/usr/bin/env node
import "core-js";
import { Command } from "commander";
import { prompt, Questions } from "inquirer";
import * as path from "path";
import { templateSelector } from "./modules/template-selector";
import { Templater } from "./modules/templater";
import { pluginSelector } from "./modules/plugin-selector";

const commander = new Command();

const templatesDir = path.join(__dirname, "./../templates/");
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

      prompt(pluginSelector(tempDir)).then(async args => {
        console.log(args);
        // await templater.ProcessPlugins(plugins);
      });
    });
  })
  .parse(process.argv);
