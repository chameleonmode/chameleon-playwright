import { spawn } from "child_process";
import { Logger } from "./logger.js";

/**
 * sleeps for a specified number of milliseconds.
 * @example
 * // Sleeps for 1000 milliseconds (1 second)
 * await sleep(1000);
 * console.log("Slept for 1 second");
 * // => Slept for 1 second
 * @param ms - The number of milliseconds to sleep.
 * @returns A promise that resolves after the specified time.
 */
export const delay = (ms: number) => {
	return new Promise<number>((resolve) => {
		setTimeout(() => resolve(ms), ms);
	});
};

export async function sleepo({ min = 256, max = 512, multiplier = 0 } = {}) {
	const ms = random(min, max);
	const span = Math.floor(ms * (multiplier > 0 ? multiplier : rando(3, 6)));
	return await delay(span);
}
/**
 * Generates a random integer between the smallest and largest values provided.
 * @example
 * // Returns a random integer between 1 and 10 (inclusive)
 * const randomNum = random(1, 10);
 * console.log(randomNum);
 * // => 5
 *
 * // Works with any number of arguments
 * const randomNum = random(5, 10, 3); // Returns random integer between 3 and 10
 *
 * @param values - One or more numbers from which to determine the range
 * @returns A random integer between the smallest and largest values (inclusive)
 */
export function random(...values: number[]): number {
	const smallest = Math.min(...values);
	const largest = Math.max(...values);
	const floor = Math.floor(Math.random() * (largest - smallest) + smallest);
	return floor;
}

/**
 * Generates a random boolean or a random element from an array.
 * @example
 * // Returns a random boolean
 * const randomBool = rando();
 * console.log(randomBool);
 * // => true
 *
 * // Returns a random number between 1 and 10
 * const randomNum = rando(10);
 * console.log(randomNum);
 * // => 7
 *
 * // Returns a random element from the array
 * const randomElement = rando([1, 2, 3, 4, 5]);
 * console.log(randomElement);
 * // => 3
 */
export function rando(): boolean;
export function rando(number: number): number;
export function rando(min: number, max: number): number;
export function rando<T>(list: T[]): T;
export function rando<T>(thing?: T[] | number, thinger?: number): T | boolean | number {
	return Array.isArray(thing)
		? thing[Math.floor(Math.random() * thing.length)]
		: thing && thinger
		? random(thinger, thing)
		: thing && typeof thing === "number"
		? Math.floor(Math.random() * thing)
		: Math.random() < 0.5;
}

export async function tryForEach<T>(promises: Promise<T>[]) {
	const fulfilled: T[] = [];
	const errors: unknown[] = [];

	await Promise.allSettled(promises).then((outcomes) =>
		outcomes.forEach((outcome, index) => {
			if (outcome.status === "fulfilled") {
				fulfilled.push(outcome.value);
			} else {
				errors.push(outcome.reason);
			}
		})
	);

	return { fulfilled, errors };
}

export async function trySequentially<T>(promises: (() => Promise<T>)[], { first = true } = {}) {
	const fulfilled: T[] = [];
	const errors: unknown[] = [];

	// We need functions that return promises, not promises themselves,
	// because promises start executing immediately when created

	for (let i = 0; i < promises.length; i++) {
		try {
			// Execute the current promise-returning function
			const filled = await promises[i]();
			fulfilled.push(filled);

			// If we get here, the promise fulfilled successfully
			if (first) break;
		} catch (error) {
			// Store the error and continue to the next promise
			errors.push(error);
		}
	}

	// If we've tried all promises and none succeeded
	return { fulfilled, errors };
}

export async function tryOnFirst<T>(promises: Promise<T>[]) {
	const errors: unknown[] = [];

	// Create a race to find the first fulfilled promise
	// Rejected promises are converted to never-resolving promises
	// so they don't win the race
	const racingPromises = promises.map((promise, index) =>
		promise.catch((error) => {
			errors[index] = error;
			// Return a never-resolving promise when catching errors
			return new Promise<never>(() => {});
		})
	);

	// If all promises reject, this will hang, so we need a fallback
	const fallbackPromise = Promise.all(
		promises.map((p, index) =>
			p.catch((err) => {
				if (!errors[index]) errors[index] = err;
				return null;
			})
		)
	).then(() => {
		// This only resolves when all promises have settled
		// If we reach here and haven't returned yet, all promises rejected
		throw new Error("All promises rejected");
	});

	try {
		// Race between the first fulfilled promise and the fallback
		const result = await Promise.race([...racingPromises, fallbackPromise]);
		return { result, errors };
	} catch (error) {
		// If all promises rejected, we'd end up here
		return { errors };
	}
}

export function deepMerge(target: any, source: any) {
	if (!source) return target;
	const output = { ...target };

	Object.keys(source).forEach((key) => {
		if (source[key] instanceof Object && key in target) {
			output[key] = deepMerge(target[key], source[key]);
		} else {
			output[key] = source[key];
		}
	});

	return output;
}

export function getOSName() {
	const osType = process.platform;
	if (osType === "darwin") return "macOS";
	if (osType === "win32") return "Windows";
	return "Linux";
}

export function getChromePath() {
	switch (process.platform) {
		case "win32":
			return process.arch === "x64"
				? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
				: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
		case "darwin":
			return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
		case "linux":
			return "/usr/bin/google-chrome";
		default:
			return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
	}
}

export async function launcher() {
	// spawn detached so Chrome keeps running after your script exits:
	const child = spawn(
		getChromePath(),
		[`--remote-debugging-port=9613`, `--user-data-dir=/Users/dev/src/chameleon-playwright/.cache/examples`],
		{
			detached: true,
			stdio: "ignore",
		}
	);
	// allow parent to exit independently:
	child.unref();
	await delay(3000); // Give it a moment to start up
}

export function er(message: unknown, cause?: unknown) {
	const error = new Error(`${message}`, { cause });
	const pretty = { cause, stack: error.stack };
	Logger.error(`(error): ${error.message}`, pretty);
	return error;
}

export function bang<T>(
	message: string,
	expect: T,
	source?: unknown,
	{ print = true, caller = Logger.getCallerLine() } = {}
) {
	if (print) {
		Logger.debug(
			`bang`,
			`\x1b[38;5;208mmessage:\x1b[0m`,
			message,
			`\n`,
			`expect:`,
			expect,
			`\n`,
			`source:`,
			source,
			`\n`,
			"caller: {\n\t",
			caller.method,
			`\n\t`,
			caller.filename,
			"\n",
			"}"
		);
	}
	if (expect) return expect;
	throw er(message, { source, expect });
}

export function bing<T>(message: string, expect: unknown, returnz: T, source: unknown) {
	const caller = Logger.getCallerLine();
	if (bang(message, expect, source, { caller })) return returnz;
	throw er(message, { source, expect });
}
