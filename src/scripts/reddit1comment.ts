import { Page } from "@playwright/test";
import SitePage, { Options } from "./pages/reddit.page.js";

export default async function (page: Page, opts: Options): Promise<void> {
  console.log("Running redditCommentVote:", opts);
  try {
    const redditPage = new SitePage(page);
    //Step 1 - Launch Reddit
    await redditPage.goToRedditSite();
    //Step 2 - Login
    await redditPage.loginToReddit(opts.username, opts.password);
    //Step 3 - Search for topic and click on 1st test result
    await redditPage.searchAndOpenFirstTopic(opts.search);
    //Step 4 - 1st Comment on main thread
    await redditPage.addCommentToMainThread(opts.comment1);
    //Step 5 - 2nd Comment on main thread
    // await redditPage.addCommentToMainThread(opts.comment2);
    //Step 6 - Click on upvote on specific comment
    // await redditPage.upVoteComment(opts.comment2);
    //Step 7 - Click downvote on specific comment
    // await redditPage.downVoteComment(opts.comment1);
    //Step 8 - Reply to comment
    // await redditPage.replyToComment(opts.comment2, opts.reply_comment2);
  } catch (error) {
    console.error("redditCommentVote test error:", error);
  } finally {
    console.log("redditCommentVote test completed finally");
  }
}
