import Reddit from "../page.js";
import ask from "../../../lib/ask.js";

export default async function (
  context: import('@playwright/test').BrowserContext,
  options: {
    search: string;
    comSearch: string;
    replyMessage?: string;
    triggerWords?: string[]; // Array of words/sentences that will trigger a reply if found in comment
    caseSensitive?: boolean; // Whether trigger matching should be case sensitive
    replyIfNoMatch?: boolean; // Whether to reply to random comment if no triggers match (default true)
  }
) {
  const page = new Reddit(await context.newPage());

  // Step 1 - Launch Reddit
  await page.goToStartPage();

  // // Step 2 - Search for topic and click on 1st test result
  await page.search(options.search);
  await page.findRandomThread();

  // Step 3 - Find comment matching the trigger words
  const isCommentAvaible = await page.findCommentWithTriggers(
    options.triggerWords || ["Thanks for your comment. I currently have a free lance developer"],
    options.caseSensitive || false
  );

  if (isCommentAvaible) {
    const commentElement = isCommentAvaible?.elem;
    const commentText = isCommentAvaible?.comment;
    console.log("Comment Found:- ", commentText);

    await commentElement.scrollIntoViewIfNeeded();

    const input = await page.PosttitleText();
    const result = await ask(input);
    await page.replyToSearchComment(commentElement, result);
    console.log("Clicked on the comment.", result);
  } else {
    console.log("No comment found with the specified triggers.");
  }
  // if (matchingComment) {
  //   const input = await page.PosttitleText();
  //   const generatedReply = await ask(input, options.comSearch);

  //   await page.addCommentToThread(generatedReply);
  // } else {
  //   // If no matching comment is found, skip the reply and log a message
  //   console.log("No matching comment found. Skipping reply.");
  // }

  // Step 5 - Check and join the subreddit if not already a member (if needed)
  // await page.checkAndJoinSubreddit();
}
