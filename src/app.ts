import readline from "node:readline";
import { Logger } from "./lib/logger.js";
import { run } from "./lib/runner.js";
import { Playwrighteer } from "./computer/playwrighteer.js";

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    readline
      .createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      })
      .on("line", (line) => {
        if (line.startsWith("{")) {
          const jsonLine = JSON.parse(line);
          switch (jsonLine.arg) {
            case "run":
              run({
                file: jsonLine.file,
                port: jsonLine.port,
                options: jsonLine.options,
              });
              break;
            default:
              Logger.log(`Unknown command: ${jsonLine.arg}`);
              Logger.log("Available commands: run, exit");
          }
        } else {
          Logger.log(`Received: ${line}`);
          const args = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
          const command = args.shift();
          switch (command) {
            case "exit":
              Logger.log("Exiting...");
              process.exit(0);
            default:
              Logger.log(`Unknown command: ${command}`);
          }
        }
      });
    Logger.log("command ({arg: 'run', file, port, options}, exit):");
  } else {
    const playwrighter = new Playwrighteer();
    if (!args[0].startsWith("{")){
      await playwrighter.run(args);
    }else{
      await playwrighter.cua(args[0]);
    }
  }
}

main().catch((error) => {
  Logger.log(`Error: ${error}`, error);
  process.exit(1);
});
