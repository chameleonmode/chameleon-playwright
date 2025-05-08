import { AI, App, Tone } from "../types.js";
import { Logger } from "./logger.js";
import { rando } from "./utils.js";


export const state: App = { api: undefined };
export const tones: Tone[] = ["sarcastic", "informative", "relatable", "straightforward"];

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

export async function promptee<T>(
  ctx: AI,
  {
    method = "POST",
    path = "/promptee/prompter",
    headers = {
      "Content-Type": "application/json",
      ai: "origato",
      type: ctx.generations.type,
    },
  } = {}
) {
  ctx.decorators.tone ||= rando(tones);
  const body = JSON.stringify(ctx);
  const from = `${await endpoint()}${path}`
  Logger.log("Request:", { from, method, headers, body });

  const res = await fetch(from, {
    method,
    headers,
    body,
  });

  const response = await res.json();
  Logger.log("Generated:", response);

  const reply = response.res as T;
  Logger.log("Reply:", reply);

  return reply;
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
