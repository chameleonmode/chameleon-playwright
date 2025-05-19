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
      tone: "fun and whimsical, in the style of shane gillis",
      system: "You are a helpful social media assistant.",
      prefix: "As a social media expert you know how to make perfect decisions so consider the following:",
      human: "I am a reddit content creator, who creates interesting content",
      audience: "The target audience are reddit website users",
      background: "I currently am on reddit.com and looking for content",
      suffix: "Respond as creative as possible.",
    },
  };

  const result = await promptee.prompt<Input[]>({
    model: ai.model,
    decorators: ai.decorators,
    task: `respond to this reddit post with a comment`,
    image: {
      des: "screenshot of the post",
      b64: "iVBORw0KGgoAAAANSUhEUgAABQAAAA4VCAIAAADGmq9yAAAAAXNSR0IArs4c6QAAIABJREFUeJzs3WdYFFcXAOAzs32X3nsRRRQVEVGx994L9hJbYkvUFGM0URNNoiaaaKKfvUSNLRZUVCzYu4KKNEGqFOll+87M92MRkLrAwoKc9/FJdqfcubvL7M6Ze++5BMMwgBBCCCGEEEIIfexIXVcAIYQQQgghhBCqCxgAI4QQQgghhBBqFDAARgghhBBCCCHUKGAAjBBCCCGEEEKoUcAAGCGEEEIIIYRQo4ABMEIIIYQQQgihRgEDYIQQQgghhBBCjQJb1xVACFWfQqlSqFQKpUpF0TRNMzivN0IIoQ8RAARBkCTJZpFcDpvLZnM5ePmHauqjvwLR7YkjfX5bGnRTGvZEmRCpSk9iJHkMTWv3EARJEkJ9tpkNx95V0KK9wLOHwKObdg9RbxEf3Z8rQh8/FUVJZAqpXEFp+9sQIYTQR49FkgI…PfVDRfb3Wwt/f3lQlN9rUaJrN3Jg3dpNsqtWnwEK367Wobrip7+8bHRhHRqXPfXq69snHVsqGLsN3ONkyt0Zh9lXfTr9XacrlcLtd4RafX6/V6s53MBocNh0qtcXSwN+ulwQ/Pfe1JQAIMAAAAAHDfbd+9N3PRfLNNmGCY5DcV23fv5dnZMYzhtkq14clMdhEywK+ABBgAAAAA4P4a/uAqWGQwGLq6b7J7g2GAFH4LJMAAAAAAAABgFbALNAAAAAAAAFgFJMAAAAAAAABgFZAAAwAAAAAAgFVAAgwAAAAAAABWAQkwAAAAAAAAWAUkwAAAAAAAAGAVkAADAAAAAACAVUACDAAAAAAAAFYBCTAAAAAAAABYBSTAAAAAAAAAYBWQAAMAAAAAAIBVQAIMAAAAAAAAVgEJMAAAAAAAAFgFJMAAAAAAAABgFZAAAwAAAAAAgFVAAgwAAAAAAABW4UfDxKkE8KX0vAAAAABJRU5ErkJggg==",
    },
    generations: {
      sys: "Your commenting on a reddit post use between minimum 9 to maximum 54 words in your response data",
      type: "comment",
      context: `currently @https://www.reddit.com/r/AskReddit/comments/1kptz1u/people_over_35_whats_something_you_genuinely_miss/
some comments on the post are:
- Finding a magazine with something you love on it, a band or an actor or whatever. Now if you love something you can immediately consume every piece of media on that thing, which is also cool, but I’ll always miss turning the corner at the grocery store and seeing that Spin is doing an all punk issue, or the Rolling Stone issue after Hunter Thompson died, and being like FUCK YES. Edited to add: and the smell! The ink plus the paper and the perfume samples, incredible.
- Internet before corporate got hold of it. Was truly a wild west era
- I miss when internet fandom communities were built around teenage nerds who knew HTML and how to open a Geocities domain."`,
      input: {
        type: "title",
        data: "People over 35, what's something you genuinely miss that younger generations will probably never experience?",
        reason: "this is the title of the post",
      },
      range: { min: 1, max: 1 },
    },
  });
  Logger.log("", { result: JSON.stringify(result) });
})();
