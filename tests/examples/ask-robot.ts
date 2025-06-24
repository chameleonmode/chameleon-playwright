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
	// // spawn detached so Chrome keeps running after your script exits:
	// const child = spawn(
	//   getChromePath(),
	//   [`--remote-debugging-port=9613`, `--user-data-dir=/Users/dev/src/chameleon-playwright/.cache/examples`],
	//   {
	//     detached: true,
	//     stdio: "ignore",
	//   }
	// );
	// // allow parent to exit independently:
	// child.unref();
	const browser = await chromium.connectOverCDP(`http://localhost:9613`);
	const page = browser.contexts()[0].pages()[0];
	// const page = await browser.contexts()[0].newPage();
	// await page.goto(
	// 	"https://www.reddit.com/r/whatisit/comments/1li4jky/bitcoin_token_things_found_on_car_door_handle/"
	// );
	const locator = page.locator("#i18n-shreddit-post-translator-content >> shreddit-post");
	await locator.waitFor();
	// Screenshot the element only (no surrounding content)
	const screenshot = (
		await locator.screenshot({
			scale: "css",
			type: "jpeg",
			quality: 72,
		})
	).toString("base64");
	const content = await locator.evaluate((root) => {
		const relevantAttrPrefixes = [
			"post-",
			"subreddit-",
			"author-",
			"content-",
			"comment-",
			"domain",
			"id",
			"title",
			"href",
			"src",
			"datetime",
		];

		const extractAttributes = (el: Element) => {
			const data: Record<string, string> = {};
			for (const { name, value } of el.attributes) {
				if (relevantAttrPrefixes.some((prefix) => name.startsWith(prefix) || prefix === name)) {
					data[name] = value;
				}
			}
			return data;
		};

		const extractTextContent = (node: Node): string => {
			if (node.nodeType === Node.TEXT_NODE) {
				return node.textContent?.trim() || "";
			}
			if (node.nodeType === Node.ELEMENT_NODE) {
				return Array.from(node.childNodes)
					.map(extractTextContent)
					.filter(Boolean)
					.join(" ")
					.replace(/\s+/g, " ")
					.trim();
			}
			return "";
		};

		const extractMedia = (el: Element) =>
			Array.from(el.querySelectorAll("img, video"))
				.map((node) => ({ type: node.tagName.toLowerCase(), src: node.getAttribute("src") }))
				.filter((item) => item.src);

		return {
			tag: "shreddit-post",
			attributes: extractAttributes(root),
			title: root.querySelector("h1")?.textContent?.trim() || null,
			flair: root.querySelector("shreddit-post-flair")?.textContent?.trim() || null,
			body: extractTextContent(root.querySelector('[slot="text-body"]') || root),
			media: extractMedia(root),
		};
	});
	Logger.log("Post data:", content);

	const commentoe = async () => {
		try {
			const loca = page.locator("shreddit-comment");
			const count = await loca.count();
			const length = count;
			const comments: { id: string; index: number; text: string; attributes: any; locator: Locator }[] = [];
			for (let i = 1; i < 10; i++) {
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
					comments.push({ id: crypto.randomUUID(), index: i, text, attributes, locator });
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
	// const randomComment = rando(comments);
	// Logger.log("Random Comment:", randomComment);
	const result = await promptee.robot({
		model: "o4-mini",
		decorators: {
			tone: "Shane Gillis",
			human: "Reddit content creator",
			audience: "Reddit website users",
			background: "I am surfing reddit",
			system: "You are a Reddit-native assistant",
		},
		task: "generate_reddit_reply",
		image: {
			des: "post screenshot",
			b64: [screenshot],
		},
		generations: {
			type: "reply",
			range: { min: 1, max: 1 },
			input: {
				data: {
					post: {
						id: crypto.randomUUID(),
						url: page.url(),
						content: content,
						comments: comments,
					},
					target: {
						type: "unknown"
					},
				},
				user_intent: "Select a comment aligned with users metadata and generate a reply to it",
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
