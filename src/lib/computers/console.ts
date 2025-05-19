
export async function askConsole(input: string): Promise<string> {
  console.log(`Ask:${input}`); // must remain ask for seperate process to interceptt

  // Create a new readline interface for this specific prompt
  const rl = (await import("node:readline")).createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Return a promise that resolves when the user enters a response
  return new Promise<string>((resolve) => {
    rl.question(`> `, async (answer) => {
      if (!answer.startsWith("Ans:")) return; // need clarification to proceed

      rl.close();
      resolve(answer.slice(4).trim()); // Remove the "Ans:" prefix and trim whitespace
    });
  });
}