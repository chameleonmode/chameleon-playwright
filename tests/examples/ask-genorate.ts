import { Logger } from "../../src/lib/logger.js";
import { promptee } from "../../src/lib/requests.js";
import { AI, Input, Settings } from "../../src/types/index.js";
import { configure, Args } from "../../src/scripts/reddit/reddit.js";
import { rando } from "../../src/lib/utils.js";

(async () => {
  const settings: Settings = {
    start: {
      all: true,
      new: true,
      attempts: 9,
      feature: "reddit",
      rando: { min: 1, max: 1 },
      iterations: { min: 1, max: 1 },
      variations: { min: 1, max: 3 },
      urls: [],
    },
    timeouts: {
      navigate: 60,
      default: 30,
      wait: 15,
      naps: { min: 256, max: 512 },
    },
  };
  const args: Args = {
    scope: "Posts",
    sort: "Relevance",
    filter: "All",
    search: ["popeye"],
    artifacters: [{ type: "selections", data: ["vote"] }],
  };
  const ai: AI = {
    model: "gpt",
    decorators: {
      tone: "inteligent and whimsical",
      system: "You are a helpful social media assistant.",
      prefix: "As a social media expert consider the following:",
      human: "I am a reddit content creator, who creates interesting content",
      audience: "The target audience are reddit website users",
      background: "I currently am on reddit.com and looking for content",
      suffix: "Respond as creative as possible.",
    },
  };

  const opts = { settings, args, ai };
  const options = configure(opts);
  if (options.settings.start.all && options.settings.start.variations.max > 1) {
    const result = await promptee.genorate<Input[]>({
      model: options.ai.model,
      task: `generate search terms to browse reddit`,
      decorators: options.ai.decorators,
      generations: {
        type: "term",
        sys: "you are creating variations of search terms",
        context: "current search terms",
        input: {
          type: "search",
          data: JSON.stringify(options.args.search),
          reason: "list of search terms to generate variations for",
        },
        range: {
          min: options.settings.start.variations.min,
          max: options.settings.start.variations.max,
        },
      },
    });
    const terms = result.map((i) => i.data);
    options.args.search = [...options.args.search, ...terms].sort(() => Math.random() - 0.5);
    Logger.info("Generated search terms:", options.args.search, JSON.stringify(result));
  }
})();
