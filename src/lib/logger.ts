// // File: src/utils/logger.ts - Logging utility
// export class Logger {
// 	private static prefix = () => {
// 		const date = new Date();
// 		return `${date.toISOString().split("T")[0]} ${date.toTimeString().split(" ")[0]}`;
// 	};
// 	private static suffix = (message: string, objects: any) => {
//     return {
//       message: JSON.stringify(message),
//       objects: JSON.stringify(objects, null, 2),
//     };
// 	};

// 	static log(message: string = "Chamelioneer", ...objects: any[]): void {
// 		console.log(`[${this.prefix()}] \x1b[32mLOG\x1b[0m`, this.suffix(message, objects ));
// 	}

// 	static info(message: string = "Chamelioneer", ...objects: any[]): void {
// 		console.log(`[${this.prefix()}] \x1b[35mINFO\x1b[0m`, this.suffix(message, objects ));
// 	}

// 	static debug(message: string = "Chamelioneer", ...objects: any[]): void {
// 		console.log(`[${this.prefix()}] \x1b[36mDEBUG\x1b[0m`, this.suffix(message, objects ));
// 	}

// 	static warn(message: string = "Chamelioneer", ...objects: any[]): void {
// 		console.warn(`[${this.prefix()}()] \x1b[33mWARN\x1b[0m`, this.suffix(message, objects ));
// 	}

// 	static error(message: string = "Chamelioneer", ...objects: any[]): void {
// 		console.error(`[${this.prefix()}] \x1b[31mERROR\x1b[0m`, this.suffix(message, objects ));
// 	}
// }
import util from "util";

export class Logger {
	private static prefix = () => {
		const date = new Date();
		return `${date.toISOString().split("T")[0]} ${date.toTimeString().split(" ")[0]}`;
	};

	private static print(level: string, color: string, message: string, objects: any[]) {
		const output = objects.map((o) =>
			typeof o === "string" ? o : util.inspect(o, { depth: null, colors: true, compact: true })
		);
		console.log(`[${this.prefix()}] \x1b[${color}m${level}\x1b[0m`, message, ...output);
	}

	static return<T>(message: string = "Chamelioneer", objects: T): T {
		this.print("LOG", "32", message, [objects]);
		return objects;
	}

	static log(message: string = "Chamelioneer", ...objects: any[]): any {
		this.print("LOG", "32", message, objects);
	}

	static info(message: string = "Chamelioneer", ...objects: any[]): void {
		this.print("INFO", "35", message, objects);
	}

	static debug(message: string = "Chamelioneer", ...objects: any[]): void {
		this.print("DEBUG", "36", message, objects);
	}

	static warn(message: string = "WARN", ...objects: any[]): void {
		this.print("WARN", "33", message, objects);
	}

	static error(message: string = "ERROR", ...objects: any[]): void {
		this.print("ERROR", "31", message, objects);
	}

	static trace(message: string = "Chamelioneer", ...objects: any[]): Error {
		const error = new Error("Trace log");
		this.print("TRACE", "34", message, [...objects, error]);
		return error;
	}

	static ror(message: unknown, cause?: unknown) {
		const error = new Error(`${message}`, { cause });
		const pretty = { cause, stack: error.stack };
		this.error(`(error): ${error.message}`, pretty);
		return error;
	}
}
