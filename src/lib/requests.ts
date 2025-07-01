import { requests, App } from "./types/index.js";
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

	async function requesito<T>(route: string, ctx: requests.Prompt<T>) {
		ctx.decorators.tone ||= "adaptive to the task, data, user metadata and user intent";
		const args = { headers: { ai: "origato", model: ctx.model }, body: ctx };
		Logger.log("Requesting:", ctx.generations);
		return await req<Response>("/robo/" + route, args);
	}

	function responsito<T>(request: Response) {
		const out = request.reply as requests.Output<T>[];
		return out;
	}

	export async function prompt<T>(ctx: requests.Prompt<T>) {
		const request = await requesito("prompt", ctx);
		return responsito(request);
	}

	export async function genorate<T>(ctx: requests.Prompt<T>) {
		const request = await requesito("genorate", ctx);
		return responsito(request);
	}

	export async function robot<T, TT>(ctx: requests.Prompt<T>) {
    const request = await requesito<T>("robot", ctx);
    return responsito<TT>(request);
	}
}
