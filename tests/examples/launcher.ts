import { Logger } from "../../src/lib/logger";
import { launcher } from "../../src/lib/utils";

async function main() {
	await launcher();
}

main().catch((error) => {
	Logger.log(`Error: ${error}`, error);
	process.exit(1);
});
