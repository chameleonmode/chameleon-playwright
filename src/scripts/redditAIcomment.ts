import { Page } from "playwright-core";
import SitePage, { Options } from "./pages/reddit.page.js";

export default async function (page: Page, opts: Options): Promise<void> {
  console.log("Running redditCommentVote:", opts);
  try {
    const redditPage = new SitePage(page);
    //Step 1 - Launch Reddit
    await redditPage.goToRedditSite();
    //Step 2 - Login
    await redditPage.loginToReddit(opts.reddit_username, opts.test_password);
    //Step 3 - Search for topic and click on 1st test result
    await redditPage.searchAndOpenFirstTopic(opts.textToSearch);
    //Step 4 - 1st Comment on main thread
    await redditPage.addCommentToMainThread(opts.commenttoMainthread);
    //Step 5 - 2nd Comment on main thread
    await redditPage.addCommentToMainThread(opts.commenttoMainthread2);
    //Step 6 - Click on upvote on specific comment
    await redditPage.upVoteComment(opts.commenttoMainthread2);
    //Step 7 - Click downvote on specific comment
    await redditPage.downVoteComment(opts.commenttoMainthread);
    //Step 8 - Reply to comment
    await redditPage.replyToComment(opts.commenttoMainthread2, opts.replToComment);
  } catch (error) {
    console.error("redditCommentVote test error:", error);
  } finally {
    console.log("redditCommentVote test completed finally");
  }
}
