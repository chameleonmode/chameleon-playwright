import { state, tones } from "../types";
import { requests } from "../types/ai.js";
import { Logger } from "./logger.js";
import { rando } from "./utils.js";

export async function endpoint() {
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

export async function req<T>(
  route: string,
  args: {
    body?: any;
    method?: string;
    headers?: Record<string, string>;
  }
) {
  const from = `${await endpoint()}${route}`;
  const init = {
    headers: {
      "Content-Type": "application/json",
      ...args.headers,
    },
    method: args.method ?? "POST",
    body: args.body ? JSON.stringify(args.body) : undefined,
  };
  Logger.log("Request:", { from, init: JSON.stringify(init) });

  const request = await fetch(from, init);
  const response = await request.json();
  Logger.log("Generated:", response);

  return response as T;
}

export namespace promptee {
  type Response = {
    [string: string]: any;
  };

  async function requesito(route: string, ctx: requests.Genoration) {
    ctx.decorators.tone ||= rando(tones);
    const args = { headers: { ai: "origato", model: ctx.model }, body: ctx };
    return await req<Response>("/promptee" + route, args);
  }

  function responsito<T>(request: Response) {
    const response = request.res as T;
    Logger.log("Reply:", response);
    return response;
  }

  export async function prompt<T>(ctx: requests.Prompt) {
    const request = await requesito("/prompt", ctx);
    return responsito<T>(request);
  }

  export async function genorate<T>(ctx: requests.Genoration) {
    const request = await requesito("/genorate", ctx);
    return responsito<T>(request);
  }
}
