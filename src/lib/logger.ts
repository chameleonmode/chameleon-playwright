// File: src/utils/logger.ts - Logging utility
export class Logger {
	private static prefix = () => {
		const date = new Date();
		return `${date.toISOString().split("T")[0]} ${date.toTimeString().split(" ")[0]}`;
	};
	private static suffix = (message: string, objects: any) => {
    return {
      message: JSON.stringify(message),
      objects: JSON.stringify(objects, null, 2),
    };
	};

	static log(message: string = "Chamelioneer", ...objects: any[]): void {
		console.log(`[${this.prefix()}] \x1b[32mLOG\x1b[0m`, this.suffix(message, objects ));
	}

	static info(message: string = "Chamelioneer", ...objects: any[]): void {
		console.log(`[${this.prefix()}] \x1b[35mINFO\x1b[0m`, this.suffix(message, objects ));
	}

	static debug(message: string = "Chamelioneer", ...objects: any[]): void {
		console.log(`[${this.prefix()}] \x1b[36mDEBUG\x1b[0m`, this.suffix(message, objects ));
	}

	static warn(message: string = "Chamelioneer", ...objects: any[]): void {
		console.warn(`[${this.prefix()}()] \x1b[33mWARN\x1b[0m`, this.suffix(message, objects ));
	}

	static error(message: string = "Chamelioneer", ...objects: any[]): void {
		console.error(`[${this.prefix()}] \x1b[31mERROR\x1b[0m`, this.suffix(message, objects ));
	}
}
