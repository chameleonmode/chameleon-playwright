import { requests, App, AI, Thread, state } from "./index.js";
import { Logger } from "./logger.js";
import { bang } from "./utils.js";

export namespace promptee {
	export const heading = { "Content-Type": "application/json", ai: "origato" };

	export async function endpoint(route: string) {
		const from = `${(state.api ||= await (async () => {
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
		})())}/${route}`;
		return bang("Fetching", from);
	}

	function promptio<T>(ctx: Partial<requests.Prompt<T>>) {
		const prompt: requests.Prompt<T> = {
			...ctx,
			model: ctx.model || "o4-mini",
			task: bang("prompt request task", ctx.task),
			decorators: bang("prompt request decorators", state.ai?.decorators, state),
			generations: bang("prompt request generations", ctx.generations),
		};
		const headers = { ...heading, model: prompt.model };
		return { method: "POST", headers, body: JSON.stringify(prompt) };
	}

	async function requesito<T, TT>(route: string, ctx: Partial<requests.Prompt<T>>) {
		const request = await fetch(await endpoint(route), promptio(ctx));
		const out = bang("request response", await request.json());
		return out.reply as requests.Output<TT>[];
	}

	export async function ranking(ctx: Partial<requests.Prompt<Thread[]>>) {
		return await requesito<Thread[], Thread[]>("robo/ranking", ctx);
	}

	export async function content<T>(ctx: Partial<requests.Prompt<T>>) {
		return await requesito<T, string>("robo/content", ctx);
	}
}
// stamets

export async function req<T>(
	route: string,
	args: {
		body?: any;
		method?: string;
		headers?: Record<string, string>;
	}
) {
	const from = await promptee.endpoint(route);
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
