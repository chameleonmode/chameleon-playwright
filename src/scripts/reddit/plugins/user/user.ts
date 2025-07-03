import { Funco, Parameters } from "../../../../lib/index.js";
import { Options } from "../../configure.js";
import Reddito, { Reddit } from "../../reddit.js";

export class User {
	constructor(readonly reddit: Reddit) {}
	// check the member is following a user or not if not then follow the user.
	async follow() {
		await this.reddit.click('div[slot="button-follow"] button:has-text("Follow")');
	}
}

export default async function (params: Parameters<Options>, action: Funco) {
	const { reddit } = await Reddito(params, action);
	const user = new User(reddit);
	return { reddit, user };
}
