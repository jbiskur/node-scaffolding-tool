#!/usr/bin/env node
import "core-js";
import { Command } from "commander";
import { prompt } from "inquirer";
import * as path from "path";
import { templateSelector } from "./modules/template-selector";

const commander = new Command();

const templatesDir = path.join(__dirname, "./../templates/");
const question = templateSelector(templatesDir);

commander
  .version("0.1.0")
  .action(() => {
    prompt([question]).then(answers => console.log(answers));
  })
  .parse(process.argv);
