import { tones, Output, requests, App, Model, Decorations } from "./types/index.js";
import { Logger } from "./logger.js";
import { rando } from "./utils.js";

export const state: App = { api: undefined };

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
	Logger.log("Request:", { to: from });

	const request = await fetch(from, init);
	const response = await request.json();
	Logger.log("Response:", response);

	return response as T;
}

export namespace promptee {
	type Response = {
		[string: string]: any;
	};

	async function requesito(route: string, ctx: requests.Genoration) {
		ctx.decorators.tone ||= rando(tones);
		const args = { headers: { ai: "origato", model: ctx.model }, body: ctx };
		return await req<Response>("/promptee/" + route, args);
	}

	function responsito(request: Response) {
		const out = request.reply as Output[];
		return out;
	}

	export async function prompt(ctx: requests.Prompt) {
		const request = await requesito("prompt", ctx);
		return responsito(request);
	}

	export async function genorate(ctx: requests.Genoration) {
		const request = await requesito("genorate", ctx);
		return responsito(request);
	}

	export async function robot(ctx: requests.Prompt) {
    const request = await requesito("robot", ctx);
    return responsito(request);
	}
}
