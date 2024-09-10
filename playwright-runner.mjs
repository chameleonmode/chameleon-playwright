import readline from "readline";
import { gsiteCase } from "./scripts/gsites.mjs";
import { config } from "./scripts/base.mjs";
import playwright from "playwright-core";

// (async () => {
//   const browser = await playwright.chromium.connectOverCDP(
//     "http://localhost:9669"
//   );
//   const context = browser.contexts()[0];
//   const page = await context.newPage();
//   await page.goto("https://example.com");

//   // Gracefully close up everything
//   await context.close();
//   await browser.close();
// })();

// Set up stdin reader
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => {
  handleCommand(line);
});

function handleCommand(commandString) {
  try {
    const command = JSON.parse(commandString);
    console.log("Received command:", command);

    switch (command.action) {
      case "runTest":
        runTest(command.name, command.data);
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
    await gsiteCase(testData);
    // await test(testName, async ({ page }) => {
    //     // Example test using testData
    //     await page.goto(testData.url);
    //     await page.screenshot({ path: `${testName}.png` });
    // });
    console.log(`Test ${testName} completed successfully`);
  } catch (error) {
    console.error(`Test ${testName} failed: ${error.message}`);
  }
}

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Cleaning up...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
