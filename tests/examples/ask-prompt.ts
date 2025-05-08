import { promptee } from "../../src/lib/ask.js";
import { AI, Term, Input } from "../../src/types.js";
import { configure, Args, Options } from "../../src/scripts/reddit/reddit.js";
import { Logger } from "../../src/lib/logger.js";
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
      sys: "",
      context: ""
    },
  };

  // Determine URLs based on args.search and settings
  const urls = [
    "https://www.reddit.com/r/AITAH/",
    "https://www.reddit.com/r/AITAH/search/?q=wtf&cId=065ac19a-7e1a-4ddc-a2bf-f265b37fe0cc&iId=828cb1c6-875a-48e7-be07-96ae622a9200",
    "https://www.reddit.com/search/?q=ai+stuff&type=communities",
    "https://www.reddit.com/r/mildlyinteresting/comments/1kepdzk/how_orange_my_hands_are_im_normally_paler_than_my/",
  ];
  const all = true;
  const options = configure({
    ai,
    args,
    settings: {
      start: {
        all,
        new: true,
        attempts: 9,
        feature: "reddit",
        rando: { min: 1, max: 3 },
        iterations: { min: 1, max: 1 },
        variations: { min: 1, max: 3 },
        urls,
      },
      timeouts: {
        navigate: 60,
        default: 30,
        wait: 15,
        naps: {
          min: 256,
          max: 512,
          multiplier: 0,
        },
      },
    },
  });
  if ((options.settings.start.all || args.search.length) && options.settings.start.variations.max > 1) {
    // loop through the search terms and generate new ones
    const result = await promptee<Term[]>({
      ...ai,
      task: `surf around reddit`,
      decorators: {
        ...ai.decorators,
        system: "You are a Reddit bot. You specialize in generating search terms.",
      },
      generations: {
        type: "search",
        terms: args.search.map((data) => ({ data, type: "term", reason: "context" })),
        input: {
          type: "search",
          data: JSON.stringify(options.args.search),
          reason: "surff reddit for posts and media",
        },
        range: {
          min: options.settings.start.variations.min,
          max: options.settings.start.variations.max,
        },
        sys: "",
        context: ""
      },
    });
    const terms = result.map((term) => term.term);
  }
})();
