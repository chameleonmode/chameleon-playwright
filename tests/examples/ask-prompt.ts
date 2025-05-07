import { promptee } from "../../src/lib/ask.js";
(async () => {
  //   {
  //   "system": "You are a creative pet name generator with a knack for unique names.",
  //   "human": "I am a dog enthusiast and veterinarian.",
  //   "tone": "use a friendly tone.",
  //   "task": "Generate a list of 10 unique dog names.",
  //   "decorators": {
  //     "prefix": "Consider the following:",
  //     "suffix": "Please respond as creative and concisely as possible."
  //   }
  // }
  const res = await promptee({
    task: "Generate a list of 10 unique dog names.",
    decorators: {
      human: "I am a dog enthusiast and veterinarian.",
      system: "You are a creative pet name generator with a knack for unique names.",
      audience: "reddit website users",
      tone: "use a friendly tone.",
      prefix: "Consider the following:",
      suffix: "Please respond as creative and concisely as possible.",
      background: "",
    },
    generations: {
      terms: [
        {
          term: "dog names",
          reason: "i like dogs",
        },
      ],
      input: [
        {
          type: "comment",
          data: "",
          reason: "",
        },
      ],
      range: {
        min: 0,
        max: 0,
      },
    },
  });
  console.log(res);
})();
