import { Page } from "@playwright/test";
export default async function (page: Page, opts: any): Promise<void> {
  console.log("Running redditCommentVote:", opts);
}
// Test Case flow
// login to reddit
// search for specific topic
// open first topic
// add a comment
// add a second comment
// upvote 1st comment
// verifying the count of votes
// downvote 2nd comment
// verifying the count of votes
//reply to 2nd comment
