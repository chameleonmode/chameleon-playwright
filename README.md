# Chameleon Playwright JS Scripts and Plugins Runner 

## src
 - index.ts for running already open browsers to connect via cli
    - npm run dev:*
 - local.ts for running directly to userdata dir without cdp connection on already open browsers
    - npm run local:*
 - /lib
    - library/utility/inherited funtionality for the rest of the project functions 
 - /scripts
    - each website like reddit for example has a page object containing all the playwright page locators and buisness logic of the plugins
    - /plugins
        - this directory contains all of the seperate plugin/automation functionality based from the page module/object

## tests
 - in progress...

 ## TODOS


	// actionable scenario when user is doing something on a post: TODO: finish
	// async actionado() {
	// 	const compleations: string[] = [];
	// 	const acto = rando() && ["comment", "reply"].includes(this.opts.settings.start.feature);
	// 	this.bang("acto?", acto);

	// 	//
	// 	const actionable = this.opts.args.artifacters.find(
	// 		(art) => art.type === "selections" && art.data.find((d: string) => ["join", "vote"].includes(d))
	// 	)?.data as string[];
	// 	this.bang("Actionable", actionable.length > 0, { actionable });
	// 	if (!actionable.includes("vote")) actionable.push("vote");

	// 	// Execute each actionable function from the selectionator
	// 	const actions: Record<string, () => Promise<void>> = {
	// 		join: async () => {
	// 			await this.subreddit.joiner();
	// 		},
	// 		vote: async () => {
	// 			await this.subreddit.voter(false);
	// 		},
	// 	};

	// 	for (const selection of actionable) {
	// 		try {
	// 			if (!compleations.includes("join")) this.bang("action", rando(), { selection });
	// 			await actions[selection]();
	// 			compleations.push(selection);
	// 		} catch (error) {
	// 			Logger.warn(`Error performing action "${selection}":`, error);
	// 		}
	// 	}
	// 	this.bang("Actionable completions", compleations.length, { compleations });
	// 	return compleations.length;
	// }


		// TODO:
		// const tried = await tryForEach([
		// 	this.navigate(url),
		// 	(async () => {
		// 		Logger.debug("variations:", this.opts.settings.start.variations);
		// 		// generate additional search terms
		// 		const genorate = this.opts.args.search.length > 0 && this.opts.settings.start.variations.max > 0;
		// 		if (genorate) {
		// 			const result = await promptee.genorate({
		// 				model: this.opts.ai.model,
		// 				decorators: this.opts.ai.decorators,
		// 				task: `generate search terms`,
		// 				generations: {
		// 					type: "term",
		// 					sys: "you are creating variations of search terms",
		// 					context: "current search terms",
		// 					range: this.opts.settings.start.variations,
		// 					input: {
		// 						type: "search",
		// 						data: this.opts.args.search,
		// 						reason: "list of search terms to generate variations for",
		// 					},
		// 				},
		// 			});
		// 			const terms = result.map((i) => i.data);
		// 			this.opts.args.search = [...this.opts.args.search, ...terms].sort(() => Math.random() - 0.5);
		// 			Logger.info("Generated search terms:", this.opts.args.search, result);
		// 		}
		// 	})(),
		// ]);
		// this.bang("Navigation", tried.fulfilled.length > 0, { url, tried });