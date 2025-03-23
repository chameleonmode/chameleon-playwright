import readline from "node:readline";
import run from "./lib/runner.js";

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
            options: jsonLine.options
          });
          break;
        default:
          console.log(`Unknown command: ${jsonLine.arg}`);
          console.log("Available commands: run, exit");
      }
    } else {
      console.log(`Received: ${line}`);
      if (line.startsWith("Answer:")) return;
      const args = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const command = args.shift();
      switch (command) {
        case "exit":
          console.log("Exiting...");
          process.exit(0);
        case "response":
          console.log("Exiting...");
          process.exit(0);
        default:
          console.log(`Unknown command: ${command}`);
          console.log("Available commands: run, exit");
      }
    }
  });

console.log("command (run, exit):");
