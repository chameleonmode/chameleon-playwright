export async function askConsole(input: string): Promise<string> {
  console.log(`Ask:${input}`); // must remain ask for seperate process to intercept

  // Here you would typically call your AI/LLM endpoint with both the input and comSearch parameters
  // For now, we'll keep the readline interface but enhance it to show the context

  // Create a new readline interface for this specific prompt
  const rl = (await import("node:readline")).createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Return a promise that resolves when the user enters a response
  return new Promise<string>((resolve) => {
    rl.question(`> `, async (answer = "Ans:Interesting post about! Thanks for sharing.") => {
      if (!answer.startsWith("Ans:")) return; // need clarification to proceed

      rl.close();
      resolve(answer.slice(4).trim()); // Remove the "Ans:" prefix and trim whitespace
    });
  });
}

export async function askAI(opts: { input: string; feature: string; ai?: string; backgrounds?: string[] }) {
  const {
    input,
    feature,
    ai = "gpt",
    backgrounds = ["sarcastic", "informative", "relatable", "straightforward"],
  } = opts;

  const res = await fetch(`${process.env.API}/air/ask/${ai}?feature=${feature}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      background: backgrounds[Math.floor(Math.random() * backgrounds.length)],
      scenario: { keyword: input },
    }),
  });

  const {
    payload: { response },
  } = await res.json();
  return response;
}
