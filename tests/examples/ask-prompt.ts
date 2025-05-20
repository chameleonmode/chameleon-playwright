import { Logger } from "../../src/lib/logger.js";
import { AI, Input } from "../../src/types/index.js";
import { promptee } from "../../src/lib/requests.js";
import { configure, Args } from "../../src/scripts/reddit/reddit.js";
(async () => {
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
      system: "You are th expert",
      prefix: "Think through every step in the detailed sections.",
      tone: "Shane Gillis",
      human: "Reddit content creator",
      audience: "Reddit website users",
      background: "I am surfing reddit",
      suffix: "Your solution must be perfect. If not, continue working on it.",
    },
  };

  const result = await promptee.prompt({
    model: ai.model,
    decorators: ai.decorators,
    task: `respond to this reddit post`,
    generations: {
      sys: "Match word count and casual tone to the range of existing comments",
      type: "comment",
      range: { min: 1, max: 1 },
      context:
        "https://www.reddit.com/r/AskReddit/comments/1kptz1u/people_over_35_whats_something_you_genuinely_miss/",
      input: {
        type: "comment",
        data: [
          "Finding a magazine with something you love on it, a band or an actor or whatever. Now if you love something you can immediately consume every piece of media on that thing, which is also cool, but I’ll always miss turning the corner at the grocery store and seeing that Spin is doing an all punk issue, or the Rolling Stone issue after Hunter Thompson died, and being like FUCK YES. Edited to add: and the smell! The ink plus the paper and the perfume samples, incredible.",
          "Internet before corporate got hold of it. Was truly a wild west era",
          "I miss when internet fandom communities were built around teenage nerds who knew HTML and how to open a Geocities domain.",
        ],
        reason: "existing array comments on the post",
      },
    },
  });
  Logger.log("", { result: JSON.stringify(result) });
})();
