import { promptee } from "../../src/lib/ask.js";
import { Logger } from "../../src/lib/logger.js";
import { AI, Input, Term } from "../../src/types.js";
import { configure, Args, Options } from "../../src/scripts/reddit/reddit.js";
(async () => {
  const args: Args = {
    scope: "Communities",
    sort: "Comments",
    filter: "Year",
    search: ["pop"],
  };

  const ai: AI = {
    task: "",
    decorators: {
      system: "You are a Reddit bot.",
      prefix: "You are a social media copywriting guru who knows how to craft perfect replies.",
      human: "I are a Reddit user.",
      audience: "reddit website users",
      background: "",
      tone: "creative",
      suffix: "Please respond as creative and concisely as possible.",
    },
    generations: {
      type: "prompt",
      terms: [],
      input: {
        type: "prompt",
        data: "",
        reason: "",
      },
      range: {
        min: 0,
        max: 0,
      },
    },
  };
  // loop through the search terms and generate new ones
  const url =
    "https://www.reddit.com/r/law/comments/1kgl416/this_is_amazing_rep_lauren_underwood_grilled_dhs/";
  const audience = "reddit website users that search for law";
  const background = `the post is at ${url} some of the comment on the post are \n“That was not a question.” Great job Rep Underwood.\nI loved that shut down. We need more of this everywhere at all times to all these imbeciles.\nThis is the energy I want to see more of.`;
  const result = await promptee<Input[]>({
    ...ai,
    task: `respond to a reddit post with a comment`,
    decorators: {
      ...ai.decorators,
      system: "Your a reddit user commenting on a post",
      background,
      audience,
    },
    generations: {
      type: "comment",
      terms: args.search.map((data) => ({ data, type: "term", reason: "" })),
      input: {
        type: "title",
        data: "This is amazing Rep Lauren Underwood grilled DHS Secretary Kristi Noem on the funding cuts for programs and mass deportations",
        reason: "this is the title i want you to comment on",
      },
      range: {
        min: 9,
        max: 18,
      },
    },
  });
})();
