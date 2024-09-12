#!/usr/bin/env node

import readline from 'readline';
import chalk from "chalk";
import fs from 'fs/promises';
import { loadConfig, saveConfig } from "./configManager.js";
import { runTest } from "./playwrightRunner.js";
import { Config } from "./types.js";

async function handleCommand(line: string) {
  const args = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const command = args.shift();

  switch (command) {
    case 'run':
      await handleRunCommand(args);
      break;
    case 'config':
      await handleConfigCommand(args);
      break;
    case 'list':
      handleListCommand();
      break;
    case 'exit':
      console.log(chalk.blue('Exiting...'));
      process.exit(0);
    default:
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log(chalk.yellow('Available commands: run, config, list, exit'));
  }
}

async function handleRunCommand(args: string[]) {
  const testName = args[0];
  if (!testName) {
    console.log(chalk.red('Test name is required.'));
    return;
  }

  let port: number | undefined;
  let data: string | undefined;
  let file: string | undefined;

  for (let i = 1; i < args.length; i += 2) {
    switch (args[i]) {
      case '-p':
      case '--port':
        port = parseInt(args[i + 1], 10);
        break;
      case '-d':
      case '--data':
        data = args[i + 1];
        // Remove surrounding quotes if present
        if (data.startsWith("'") && data.endsWith("'")) {
          data = data.slice(1, -1);
        }
        break;
      case '-f':
      case '--file':
        file = args[i + 1];
        break;
    }
  }
  
  if (!port) {
    console.log(chalk.red('CDP port number is required. Use the -p or --port option to specify it.'));
    return;
  }

  let testData: any = {};

  if (file) {
    try {
      const fileContent = await fs.readFile(file, 'utf-8');
      testData = JSON.parse(fileContent);
    } catch (error) {
      console.error(chalk.red(`Error reading file: ${(error as Error).message}`));
      return;
    }
  } else if (data) {
    try {
      testData = JSON.parse(data);
    } catch (error) {
      console.error(chalk.red(`Error parsing test data: ${(error as Error).message}`));
      console.log(chalk.yellow('Received data:'), data);
      return;
    }
  }

  console.log(chalk.blue(`Running test: ${testName}`));
  console.log(chalk.blue('Test data:'), testData);
  console.log(chalk.blue(`Using CDP port: ${port}`));

  // Run the test
  await runTest(testName, testData, port);
}

async function handleConfigCommand(args: string[]) {
  const config = await loadConfig();
  const [key, value] = args;

  if (!key) {
    console.log(chalk.red('Config key is required.'));
    return;
  }

  if (value === undefined) {
    // Get configuration value
    const configValue = config[key as keyof Config];
    if (configValue === undefined) {
      console.log(chalk.yellow(`Configuration key "${key}" not found.`));
    } else {
      console.log(chalk.green(`${key}: ${configValue}`));
    }
  } else {
    // Set configuration value
    config[key as keyof Config] = value;
    await saveConfig(config);
    console.log(chalk.green(`Configuration updated: ${key} = ${value}`));
  }
}

function handleListCommand() {
  console.log(chalk.blue("Available tests:"));
  // You'll need to implement a way to discover available tests
  // This is just a placeholder
  console.log("  - gsites");
  console.log("  - example");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

console.log(chalk.green('Playwright Test Runner'));
console.log(chalk.yellow('Type a command (run, config, list, exit):'));

rl.on('line', (line) => {
  handleCommand(line);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error(
    chalk.red(`Unhandled Rejection at:, ${promise}, 'reason:', ${reason}`)
  );
  process.exit(1);
});
