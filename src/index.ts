#!/usr/bin/env node

import readline from 'readline';
import fs from 'fs/promises';
import { loadConfig, saveConfig, loadCommandJson } from "./lib/configManager.js";
import { runTest } from "./lib/playwrightRunner.js";
import { Config } from "./lib/types.js";

async function handleCommand(line: string) {
  let args: string[];
  let command: string | undefined;

  if (line.startsWith('{') && line.endsWith('}')) {
    console.log(('JsonCommand data:'), line);
    const jsonCommand =  await loadCommandJson(line);
    console.log(('JsonCommand data:'), jsonCommand);
    args = [jsonCommand.name, "-p", jsonCommand.port.toString(), "-d", JSON.stringify(jsonCommand.data)]
    command = jsonCommand["action"];
  } else {
    args = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    command = args.shift();
  }

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
      console.log(('Exiting...'));
      process.exit(0);
    default:
      console.log((`Unknown command: ${command}`));
      console.log(('Available commands: run, config, list, exit'));
  }
}

async function handleRunCommand(args: string[]) {
  const testName = args[0];
  if (!testName) {
    console.log(('Test name is required.'));
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
    console.log(('CDP port number is required. Use the -p or --port option to specify it.'));
    return;
  }

  let testData: any = {};

  if (file) {
    try {
      const fileContent = await fs.readFile(file, 'utf-8');
      testData = JSON.parse(fileContent);
    } catch (error) {
      console.error((`Error reading file: ${(error as Error).message}`));
      return;
    }
  } else if (data) {
    try {
      testData = JSON.parse(data);
    } catch (error) {
      console.error((`Error parsing test data: ${(error as Error).message}`));
      console.log(('Received data:'), data);
      return;
    }
  }

  console.log((`Running test: ${testName}`));
  console.log(('Test data:'), testData);
  console.log((`Using CDP port: ${port}`));

  // Run the test
  await runTest(testName, testData, port);
}

async function handleConfigCommand(args: string[]) {
  const config = await loadConfig();
  const [key, value] = args;

  if (!key) {
    console.log(('Config key is required.'));
    return;
  }

  if (value === undefined) {
    // Get configuration value
    const configValue = config[key as keyof Config];
    if (configValue === undefined) {
      console.log((`Configuration key "${key}" not found.`));
    } else {
      console.log((`${key}: ${configValue}`));
    }
  } else {
    // Set configuration value
    config[key as keyof Config] = value;
    await saveConfig(config);
    console.log((`Configuration updated: ${key} = ${value}`));
  }
}

function handleListCommand() {
  console.log(("Available tests:"));
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

console.log(('Playwright Test Runner'));
console.log(('Type a command (run, config, list, exit):'));

rl.on('line', (line) => {
  handleCommand(line);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error(
    (`Unhandled Rejection at:, ${promise}, 'reason:', ${reason}`)
  );
  process.exit(1);
});
