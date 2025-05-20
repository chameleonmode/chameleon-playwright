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
      system: "You are helpful.",
      prefix: "Think through every step in the detailed sections.",
      tone: "Shane Gillis",
      human: "Reddit content creator",
      audience: "Reddit website users",
      background: "I am surfing reddit",
      suffix: "Your solution must be perfect. If not, continue working on it.",
    },
  };

  const opts = { settings, args, ai };
  const options = configure(opts);
  if (options.settings.start.all && options.settings.start.variations.max > 1) {
    const min = options.settings.start.variations.min;
    const max = options.settings.start.variations.max;

    const result = await promptee.genorate({
      model: options.ai.model,
      decorators: options.ai.decorators,
      task: `generate search terms`,
      generations: {
        type: "term",
        sys: "you are creating variations of search terms",
        context: "current search terms",
        range: { min, max },
        input: {
          type: "search",
          data: options.args.search,
          reason: "list of search terms to generate variations for",
        },
      },
    });
    const terms = result.map((i) => i.data);
    options.args.search = [...options.args.search, ...terms].sort(() => Math.random() - 0.5);
    Logger.info("Generated search terms:", options.args.search, JSON.stringify(result));
  }
})();
