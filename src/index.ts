import readline from "readline";
import run from "./lib/playwrightRunner.js";


readline
  .createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  })
  .on("line", async (line) => {
    if (line.startsWith("{")) {
      const jsonCommand = JSON.parse(line);
      const args = {
        file: jsonCommand.name,
        port: parseInt(jsonCommand.port, 10),
        data: JSON.stringify(jsonCommand.data),
      };
      await run(args);
    } else {
      const args = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const command = args.shift();
      switch (command) {
        case "exit":
          console.log("Exiting...");
          process.exit(0);
        default:
          console.log(`Unknown command: ${command}`);
          console.log("Available commands: run, config, list, exit");
      }
    }
  });

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error(`Unhandled Rejection at:, ${promise}, 'reason:', ${reason}`);
  process.exit(1);
});

console.log("command (run, exit):");
