import { Playwrighteer } from "../../src/lib/computers/browser";
import { Logger } from "../../src/lib/logger";
import { launcher } from "../../src/lib/utils";

async function main() {
	// await launcher();
	const args = process.argv.slice(2);
	Logger.log("Starting Runner...", args);

	const play = async ({ file, port, opts }: { file: string; port?: string; opts?: string | unknown }) => {
		const computer = new Playwrighteer();
		await computer.runner({ file, port, opts });
	};
	const [file, port, opts] = args;
	await play({ file, port, opts: opts ? JSON.parse(opts) : undefined });
}

main().catch((error) => {
	Logger.log(`Error: ${error}`, error);
	process.exit(1);
});
