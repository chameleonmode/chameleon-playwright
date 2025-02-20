import { Page } from "playwright-core";
import RedditCommentVoteData from "../data/interfaces/RedditCommentVoteData";
import RedditPage from "./pages/redditCommentVote.page.js";

export async function redditCommentVote(
  page: Page,
  redditData: RedditCommentVoteData
): Promise<void> {
  console.log("Running redditCommentVote:", redditData);
  try {
    const redditPage = new RedditPage(page);
    //Step 1 - Launch Reddit
    await redditPage.goToRedditSite();
    //Step 2 - Login
    await redditPage.loginToReddit(
      redditData.reddit_username,
      redditData.test_password
    );
    //Step 3 - Search for topic and click on 1st test result
    await redditPage.searchAndOpenFirstTopic(redditData.textToSearch);
    //Step 4 - 1st Comment on main thread
    await redditPage.addCommentToMainThread(redditData.commenttoMainthread);
    //Step 5 - 2nd Comment on main thread
    await redditPage.addCommentToMainThread(redditData.commenttoMainthread2);
    //Step 6 - Click on upvote on specific comment
    await redditPage.upVoteComment(redditData.commenttoMainthread2);
    //Step 7 - Click downvote on specific comment
    await redditPage.downVoteComment(redditData.commenttoMainthread);
    //Step 8 - Reply to comment
    await redditPage.replyToComment(redditData.commenttoMainthread2, redditData.replToComment);
  } catch (error) {
    console.error("redditCommentVote test error:", error);
  } finally {
    console.log("redditCommentVote test completed finally");
  }
}

export default redditCommentVote;
