import { Logger } from "../../src/lib/logger.js";
import { promptee } from "../../src/lib/requests.js";
import { AI } from "../../src/lib/types/index.js";
(async () => {
  const ai: AI = {
    model: "o4-mini",
    decorators: {
      system: "You are a Reddit content creator who writes casual, engaging comments.",
      tone: "Shane Gillis",
      human: "Reddit content creator",
      audience: "Reddit website users",
      background: "I am surfing reddit",
    },
  };

  const result = await promptee.prompt({
    model: ai.model,
    decorators: ai.decorators,
    task: `respond to this reddit post`,
    generations: {
      type: "comment",
      range: { min: 1, max: 1 },
      input: {
        data: [
          "Finding a magazine with something you love on it, a band or an actor or whatever. Now if you love something you can immediately consume every piece of media on that thing, which is also cool, but I’ll always miss turning the corner at the grocery store and seeing that Spin is doing an all punk issue, or the Rolling Stone issue after Hunter Thompson died, and being like FUCK YES. Edited to add: and the smell! The ink plus the paper and the perfume samples, incredible.",
          "Internet before corporate got hold of it. Was truly a wild west era",
          "I miss when internet fandom communities were built around teenage nerds who knew HTML and how to open a Geocities domain.",
        ],
        user_intent: "existing array comments on the post",
      },
    },
  });
  Logger.log("", { result });
})();
