export default async function ask(input: string): Promise<string> {
  console.log(`Ask:${input}`);

  // Create a new readline interface for this specific prompt
  const rl = (await import("node:readline")).createInterface({
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
}
