export type Scenario = {
  input: string;
  type: "comment" | "post" | "reply" | "title";
  tone?: "sarcastic" | "informative" | "relatable" | "straightforward";
  range?:
    | "3-9"
    | "10-20"
    | "10-30"
    | "10-40"
    | "10-50"
    | "20-30"
    | "20-40"
    | "20-50"
    | "50-100"
    | "100-250"
    | "200-500"
    | "500-1000";
};
export const tones: Scenario["tone"][] = ["sarcastic", "informative", "relatable", "straightforward"];
export type Generate = "search";

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

export async function askAI(opts: {
  ai?: string;
  feature: string;
  background?: string;
  scenario: Scenario;
}) {
  const { feature, scenario, ai = "gpt", background = "" } = opts;
  const res = await fetch(`${await endpoint()}/air/ask/${ai}?feature=${feature}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      background,
      scenario,
    }),
  });

  const {
    payload: { response },
  } = await res.json();
  return response as string;
}

export async function generation(opts: {
  ai?: string;
  type: Generate;
  amount: number;
  keyword: string;
  feature: string;
}) {
  const { ai = "openai", type, amount, keyword, feature } = opts;
  const res = await fetch(`${await endpoint()}/air/${ai}/gen/${type}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      keyword,
      feature,
    }),
  });

  const { text, queries } = await res.json();
  return queries as string[]; // Return the generated keywords
}

async function endpoint() {
  return process.env.API ||= await (async () => {
    try {
      // Simple fetch check with AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300);

      await fetch("http://127.0.0.1:3042", { signal: controller.signal });
      clearTimeout(timeoutId);

      return "http://127.0.0.1:3042"; // Local server is available
    } catch (error) {
      return "https://chameleon-ws.onrender.com"; // Use fallback
    }
  })();
}
