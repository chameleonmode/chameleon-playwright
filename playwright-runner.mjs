import readline from "readline";
import { config } from "./scripts/base.mjs";
import playwright from "playwright-core";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scriptsDirectory = path.join(__dirname, 'scripts');

// Set up stdin reader
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => {
  handleCommand(line);
});

async function handleCommand(commandString) {
  try {
    const command = JSON.parse(commandString);
    console.log("Received command:", command);

    switch (command.action) {
      case "runTest":
        await runTest(command.name, command.data);
        break;
      case "setConfig":
        config[command.key] = command.value;
        console.log(`Config updated: ${command.key} = ${command.value}`);
        break;
      default:
        console.error(`Unknown command action: ${command.action}`);
    }
  } catch (error) {
    console.error("Error parsing command:", error);
    console.error("Received command string:", commandString);
  }
}

async function runTest(testName, testData) {
  console.log(`Running test: ${testName}`);
  console.log(`Test data: ${JSON.stringify(testData)}`);

  try {
    const testScript = await loadTestScript(testName);
    if (!testScript) {
      throw new Error(`Test script for "${testName}" not found`);
    }

    const browser = await playwright.chromium.connectOverCDP(
      `http://localhost:${config.cdpPort}`
    );
    const context = browser.contexts()[0];
    const page = await context.newPage();

    await testScript(page, testData);

    console.log(`Test ${testName} completed successfully`);
    await browser.close();
  } catch (error) {
    console.error(`Test ${testName} failed: ${error.message}`);
  }
}

async function loadTestScript(testName) {
  const scriptPath = path.join(scriptsDirectory, `${testName}.mjs`);
  try {
    console.log(`Attempting to load script from: ${scriptPath}`);
    const module = await import(`file://${scriptPath}`);
    return module.default || module[testName];
  } catch (error) {
    console.error(`Error loading test script: ${error.message}`);
    return null;
  }
}

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Cleaning up...");
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});