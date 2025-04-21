import Facebook from "../../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    options: {
        postText: string;
    }
) {
    // Step 1 - Launch facebook
    const page = await Facebook(await context.newPage());
    
    // Step 2 - Creat Post
    await page.createPostFaceook(await page.ai("want to create an post: ", { input: options.postText, type: "post", range:"10-40" }));
}