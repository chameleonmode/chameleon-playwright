import { Findo, InitParams } from "../../../../lib/types/index.js";
import { Pager } from "../../../pager.js";
import { Options } from "../../configure.js";
import Reddit from "../../reddit.js";

export class User {
	constructor(readonly pager: Pager) {}
	// check the member is following a user or not if not then follow the user.
	async follow() {
		await this.pager.click('div[slot="button-follow"] button:has-text("Follow")');
	}
}

export default async function (
	params: InitParams<Options>,
	action: (url?: string, thread?: Findo) => Promise<unknown>
) {
	const { reddit } = await Reddit(params, action);
	const user = new User(reddit);
	return { reddit, user };
}
