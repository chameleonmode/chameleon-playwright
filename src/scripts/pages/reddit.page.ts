import { Locator, Page } from 'playwright';
import * as data from  '../../data/redditData.json'

export default class RedditPage {
    page: Page;
    // LOCATORS
    readonly loginButton: Locator;
    readonly loginButtonOnModal: Locator;
    readonly commentAlertBanner:Locator;
    readonly xButton:Locator;
    readonly emailOrUsernameTextBox: Locator;
    readonly passwordTextBox: Locator;
    readonly userAgreement: Locator;
    readonly loginModal: Locator;
    readonly avatarIcon: Locator;
    readonly searchTextBox: Locator;
    readonly searchResults: Locator;
    readonly existingComments: Locator;
    readonly upVoteButton: Locator;
    readonly downVoteButton: Locator;
    readonly replyButton: Locator;
    readonly addCommentButton: Locator;
    readonly commentButton: Locator;
    readonly commentTextBox: Locator;
    readonly commentsData: Locator;
    readonly specificComment: (actualComment:string) =>Locator;
    readonly userCommentSection: (author:string) =>Locator;
    readonly actionToComment: (comment:string) =>Locator;
    readonly actionBar: Locator;
    readonly actionBarNumberOfVotes: Locator;
    readonly currentUserName: Locator;
    readonly mainThreadHeader:Locator;
    readonly replyTextBox: Locator;
    readonly replyCommentButton:Locator;

    constructor(page: Page) {
        this.page = page;
        //Login Page Locators
        this.loginButton = page.locator(`//a[@id='login-button']`)
        this.emailOrUsernameTextBox = page.locator(`//input[@id="login-username"]`);
        this.passwordTextBox = page.locator(`//input[@id="login-password"]`);
        this.avatarIcon = page.locator(`//button[@id='expand-user-drawer-button']`)
        this.loginButtonOnModal = page.getByRole('button', { name: 'Log In' })
        this.commentAlertBanner = page.getByRole('banner', {name:"Take a break for 5 seconds before trying again."})
        this.xButton = page.getByRole('button',{name:"close error button"} )
        this.userAgreement = page.locator(`//a[contains(@href, 'user-agreement')]`)
        this.loginModal = page.locator(`#login`)
        //Home Page Locator
        this.avatarIcon = page.locator(`//button[@id='expand-user-drawer-button']`)
        // this.searchTextBox = page.locator(`//input[@placeholder='Search Reddit']`)
        this.searchTextBox = page.locator(`faceplate-search-input`).getByRole('textbox')
        // this.searchTextBox = page.getByRole('textbox', {name: "Search Reddit"})
        this.searchResults = page.locator(`(//post-consume-tracker)`)
        //a[@data-testid="post-title"]
        this.addCommentButton = page.locator(`//faceplate-tracker[@noun='add_comment_button']`)
        this.commentButton = page.locator(`//button//span[@class='block relative']`)
        this.commentTextBox = page.locator(`//div[@name='body']`)
        this.existingComments = page.locator(`//shreddit-comment`)
        this.upVoteButton = this.page.getByRole('button', { name: 'Upvote' })
        this.downVoteButton = this.page.getByRole('button', { name: 'Downvote' })
        this.replyButton = this.page.getByRole('button', { name: 'Reply' })
        this.commentsData = page.locator(`//div[@slot="comment"]`)
        this.specificComment =(actualComment:string) => this.commentsData.locator(`//p[contains(text(),'${actualComment}' )]`)
        this.userCommentSection =(author:string)=> page.locator(`//shreddit-comment[@author='${author}']`)
        this.actionToComment =(comment:string) => page.locator(`//text()[contains(.,'${comment}')]/ancestor::*[self::shreddit-comment]`) // To Search for Parent with child text Note: child->parent->child
        this.actionBar = page.locator(`//shreddit-comment-action-row`)
        this.actionBarNumberOfVotes = page.locator(`shreddit-comment-action-row>>faceplate-number`) //To by pass shadow dom
        this.currentUserName = page.locator(`faceplate-loader>>toaster-lite>>faceplate-toast`)  //To by pass shadow dom
        this.mainThreadHeader = page.locator(`//h1[@slot="title"]`)
        this.replyTextBox = page.locator(`//div[@role="textbox"][contains(@aria-placeholder, 'Reply to u')]`)
        this.replyCommentButton = page.locator(`//button//span[@class='block relative']`)

        //span[@slot='content'][normalize-space()='Comment']

    }

    async searchAndOpenFirstTopic(searchText:string)
    {
        await this.loginModal.waitFor({state:'hidden'}) //wait for log in popup to close
        await this.page.waitForTimeout(data.megaLongPauseTime)
        await this.searchTextBox.waitFor({state:'visible'}) //wait for textbox to display
        await this.searchTextBox.click()
        await this.searchTextBox.fill(searchText)
        await this.searchTextBox.press("Enter")
        await this.page.waitForTimeout(data.longPauseTime)
        await this.searchResults.first().click() //Select 1st Record
        await this.page.waitForLoadState(`domcontentloaded`)
        await this.page.waitForTimeout(data.mediumPauseTime)
        //open first record
        await this.mainThreadHeader.waitFor({state:'visible'})
        console.log(await this.mainThreadHeader.textContent())
    }
    
    async goToRedditSite(){
        let maxIteration = 0 
        await this.page.goto(data.redditUrl)
        await this.page.waitForLoadState('domcontentloaded')
        while(await this.userAgreement.count()===0 && maxIteration<5) 
        {
            console.log("E " + await this.userAgreement.count())
            await this.page.waitForTimeout(data.longPauseTime)
            console.log("Waiting for Login pop-up screen " + maxIteration)
            maxIteration++
        }
    }

    async loginToReddit(email: string, password: string) {
        let maxIteration = 0, maxIteration2 = 0

        //Initial Login Button
        await this.loginButton.click()
        await this.page.waitForTimeout(data.megaLongPauseTime)
       
        //Enter Email
        await this.emailOrUsernameTextBox.waitFor({ state: 'visible' });
        await this.emailOrUsernameTextBox.fill(email);
        //Enter Password
        await this.passwordTextBox.waitFor({ state: 'visible' });
        await this.passwordTextBox.fill(password);
        await this.page.keyboard.press("Tab")
        
        //Click on login button
        while(await this.loginButtonOnModal.isEnabled() && maxIteration<5)
        {
            await this.page.waitForTimeout(data.mediumPauseTime);
            console.log("Waiting for Login " + maxIteration)
            maxIteration++
        }
        await this.loginButtonOnModal.isEnabled()
        await this.loginButtonOnModal.click()
        await this.page.waitForTimeout(data.megaLongPauseTime)
        while(await this.loginModal.isVisible() && maxIteration2 <5)
        {
            this.page.waitForTimeout(data.longPauseTime)
            console.log("Waiting for Login " + maxIteration2)
            maxIteration2 ++
        }
        await this.page.waitForTimeout(5000);
    }

    async getCurrentUser()
    {
        await this.currentUserName.first().waitFor({state:'visible'})
        const loggedIn = await this.currentUserName.textContent()
        console.log(loggedIn)
        return loggedIn
    }

    async getMainThreadHeaderName()
    {
        await this.mainThreadHeader.waitFor()
        const mainThreadHeader  = await this.mainThreadHeader.textContent()
        return mainThreadHeader
    }
 
    async addCommentToMainThread(comment:string)
    {
        await  this.page.waitForTimeout(data.megaLongPauseTime)
        await this.addCommentButton.waitFor({state:'visible'})
        await this.addCommentButton.click();
        await this.commentButton.waitFor({state:'visible'})
        await this.commentTextBox.fill(comment);
        await this.page.waitForTimeout(data.mediumPauseTime)
        await this.commentButton.click();
        await this.specificComment(comment).waitFor({state:'visible'})

        //For Handling Banner Message for frequent commenting
        while(await this.xButton.isVisible()){
            await  this.xButton.waitFor({state:'visible'})
            await this.commentButton.click()
            console.log("AAAAAAAAAAAAAAAAAAAAAA")
            await this.commentButton.click();
        }
    }


    async upVoteComment(commentToUpvote:string)
    {
        var toBeAdded :number
        await this.actionToComment(commentToUpvote).locator(this.upVoteButton).waitFor({state: 'visible'})
        //To check if Upvote is already pressed
        const upVotesIsPressed = await this.actionToComment(commentToUpvote).locator(this.upVoteButton).getAttribute('aria-pressed')
        //To check if Downvote is already pressed
        const downVotesIsPressed = await this.actionToComment(commentToUpvote).locator(this.downVoteButton).getAttribute('aria-pressed')
        // To Get Current Number of Comment Votes
        var currentNumberOfVotes = Number(await this.actionToComment(commentToUpvote).locator(this.actionBarNumberOfVotes).textContent())

        if(downVotesIsPressed==="true"){
            toBeAdded = 2
        }
        else{
            toBeAdded = 1
        }
        //Perform the below codes if Upvote is not yet pressed
        if(upVotesIsPressed==="false"){
            await this.actionToComment(commentToUpvote).locator(this.upVoteButton).click()   
            const newNumberOfVotes = currentNumberOfVotes + toBeAdded
        }
    }

    async downVoteComment(commentToUpvote:string)
    {
        var toBeSubtracted :number
        await this.actionToComment(commentToUpvote).locator(this.downVoteButton).waitFor({state: 'visible'})
        //To check if Upvote is already pressed
        const upVotesIsPressed = await this.actionToComment(commentToUpvote).locator(this.upVoteButton).getAttribute('aria-pressed')
        //To check if Downvote is already pressed
        const downVotesIsPressed = await this.actionToComment(commentToUpvote).locator(this.downVoteButton).getAttribute('aria-pressed')
        // To Get Current Number of Comment Votes
        var currentNumberOfVotes = Number(await this.actionToComment(commentToUpvote).locator(this.actionBarNumberOfVotes).textContent())
        if(upVotesIsPressed==="true"){
            toBeSubtracted = 2
        }
        else{
            toBeSubtracted = 1
        }
        //Perform the below codes if Upvote is not yet pressed
        if(downVotesIsPressed==="false"){
            await this.actionToComment(commentToUpvote).locator(this.downVoteButton).click()   
            const newNumberOfVotes = currentNumberOfVotes - toBeSubtracted
        }
    }


    async replyToComment(commentToReplyOn:string, reply:string)
    {
        await this.actionToComment(commentToReplyOn).locator(this.replyButton).waitFor({state: 'visible'})
        //To Click on reply button
        await this.actionToComment(commentToReplyOn).locator(this.replyButton).click()
        await this.replyTextBox.waitFor({state: 'visible'})
        await this.replyTextBox.fill(reply)
        await this.page.waitForTimeout(data.mediumPauseTime)
        await this.replyCommentButton.last().click();
        await this.specificComment(reply).waitFor({state:'visible'})
        await this.page.waitForTimeout(data.longPauseTime)
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
}