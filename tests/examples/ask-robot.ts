import { Page, Browser, chromium, BrowserContext, Locator } from "@playwright/test";
import { Logger } from "../../src/lib/logger.js";
import { promptee } from "../../src/lib/requests.js";
import { getChromePath, rando } from "../../src/lib/utils.js";
import { spawn } from "child_process";

async function firstVisible(location: Locator) {
	const locations = await location.count();
	for (let i = 0; i < locations; i++) {
		const element = location.nth(i);
		if (await element.isVisible()) {
			await element.scrollIntoViewIfNeeded();
			const text = await element.evaluate((ele) => ele?.textContent?.replace(/\s+/g, " ").trim());
			if (!text) continue; // Skip if no text content
			return text;
		}
	}
	throw new Error(`No visible elements found for selector: ${location}`);
}

async function txtContent(selector: string, locator: Locator) {
	const location = locator.locator(selector);
	return await firstVisible(location);
}
async function main() {
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
	const browser = await chromium.connectOverCDP(`http://localhost:9613`);
	const page = await browser.contexts()[0].newPage();
	await page.goto(
		"https://www.reddit.com/r/AskReddit/comments/1kptz1u/people_over_35_whats_something_you_genuinely_miss/"
	);

	// Wait for the target div to be present
	await page.waitForSelector("#i18n-shreddit-post-translator-content");
	// Recursively serialize light DOM + shadow DOM
	const rawHTML = await page.$eval("#i18n-shreddit-post-translator-content", (root) => {
		const relevantTags = new Set([
			"shreddit-post",
			"div",
			"h1",
			"h2",
			"h3",
			"p",
			"img",
			"video",
			"a",
			"time",
			"span",
		]);
		const allowedAttrs = ["id", "class", "href", "src", "alt", "title", "datetime"];
		const attrPrefixes = ["post-", "data-", "content-", "subreddit-", "author-", "comment-"];

		function serialize(node: any) {
			let html = "";

			if (node.nodeType === Node.ELEMENT_NODE) {
				const tag = node.tagName.toLowerCase();
				if (!relevantTags.has(tag)) return "";

				html += `<${tag}`;

				for (const attr of node.attributes) {
					const name = attr.name;
					if (allowedAttrs.includes(name) || attrPrefixes.some((prefix) => name.startsWith(prefix))) {
						html += ` ${name}="${attr.value.replace(/"/g, "&quot;")}"`;
					}
				}

				html += ">";
				for (const child of node.childNodes) {
					html += serialize(child);
				}

				// Shadow DOM support
				const shadow = node.shadowRoot;
				if (shadow) {
					for (const child of shadow.childNodes) {
						html += serialize(child);
					}
				}

				html += `</${tag}>`;
			} else if (node.nodeType === Node.TEXT_NODE) {
				const clean = node.textContent?.trim();
				if (clean) {
					html += clean.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
				}
			}

			return html.replace(/\s+/g, " ").trim(); // Normalize whitespace
		}

		return serialize(root);
	});

	Logger.log("Cleaned HTML payload:", rawHTML);

	const commentoe = async () => {
		try {
			const loca = page.locator("shreddit-comment");
			const count = await loca.count();
			const length = count;
			const comments: { index: number; text: string; attributes: any; locator: Locator }[] = [];
			for (let i = 0; i < length; i++) {
				try {
					const locator = loca.nth(i);
					const text = await txtContent("div[slot='comment']", locator);
					if (!text) continue; // Skip if no text content
					const attributes = await locator.evaluate((node) => {
						const attrs: Record<string, string> = {};
						for (const attr of node.attributes) {
							attrs[attr.name] = attr.value;
						}
						return attrs;
					});
					comments.push({ index: i, text, attributes, locator });
				} catch (error) {
					Logger.log(`Error processing comment ${i}:`, error);
					continue; // Skip this comment and continue with the next
				}
			}
			return comments;
		} catch (error) {
			Logger.log("Error in commentoe function:", error);
			return []; // Return empty array as fallback
		}
	};
	const comments = await commentoe();
	const randomComment = rando(comments);
	const result = await promptee.robot({
		model: "o4-mini",
		decorators: {
			tone: "Shane Gillis",
			human: "Reddit content creator",
			audience: "Reddit website users",
			background: "I am surfing reddit",
		},
		task: "generate_reddit_reply",
		image: {
			des: "page screenshot",
			b64: [
				(
					await page.screenshot({
						fullPage: true,
						scale: "css",
						type: "jpeg",
						quality: 18,
					})
				).toString("base64"),
			],
		},
		generations: {
			type: "reply",
			range: { min: 1, max: 1 },
			input: {
				data: {
					post: {
						url: page.url(),
						rawHTML,
						comments: comments.map((c) => ({
							index: c.index,
							text: c.text,
							attributes: c.attributes,
						})),
					},
					target: {
						type: "comment",
						text: randomComment.text,
						attributes: randomComment.attributes,
						index: randomComment.index,
					},
				},
				reason: "Replying to a nostalgic comment about early internet culture.",
				user_intent: "Generate a reply to this comment",
			},
		},
	});
	Logger.log("result", { result });
}

main().catch((error) => {
	Logger.log("Error (string):", String(error));
	Logger.log("Error (JSON):", JSON.stringify(error, null, 2));
	Logger.log("Error keys:", Object.keys(error));
	Logger.log("Error prototype:", Object.getPrototypeOf(error));
	Logger.log("Full error object:", error);
	process.exit(1);
});
