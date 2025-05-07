import { State } from "../app";
import { AI, Kind, Tone } from "../scripts/types";

export const tones: Tone[] = ["sarcastic", "informative", "relatable", "straightforward"];
export const state: State = { api: undefined };
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

export async function promptee(
  ctx: AI,
  {
    method = "POST",
    path = "/prompter",
    headers = {
      "Content-Type": "application/json",
      ai: "origato",
    },
  } = {}
) {
  const body = JSON.stringify(ctx);
  const res = await fetch(`${await endpoint()}${path}`, {
    method,
    headers,
    body,
  });

  const { text, obj } = await res.json();
  return text as string; // Return the generated keywords
}

async function endpoint() {
  return (state.api ||= await (async () => {
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
  })());
}
