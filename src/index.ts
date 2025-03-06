import readline from "readline";
import run from "./lib/runner.js";

console.log("Starting...");

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error(`Unhandled Rejection at:, ${promise}, 'reason:', ${reason}`);
  process.exit(1);
});

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
            ask: async (input: string) => {
              console.log(`Ask:${input}`);

              // Create a new readline interface for this specific prompt
              const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
              });

              // Return a promise that resolves when the user enters a response
              return new Promise<string>((resolve) => {
                rl.question("> ", (answer) => {
                  if (!answer.startsWith("Answer:")) return;
                  
                  rl.close();
                  resolve(answer.slice(7));
                });
              });
            },
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
