import { spawn } from "child_process";
import { Playwrighteer } from "../../src/lib/computers/browser";
import { Logger } from "../../src/lib/logger";
import { getChromePath } from "../../src/lib/utils";

async function main() {
	// spawn detached so Chrome keeps running after your script exits:
	const child = spawn(
		getChromePath(),
		["--disable-extensions", "--disable-file-system", `--remote-debugging-port=9613`, `--user-data-dir=/Users/dev/src/chameleon-playwright/.cache/examples`],
		{
			detached: true,
			stdio: "ignore",
		}
	);
	// allow parent to exit independently:
	child.unref();
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
