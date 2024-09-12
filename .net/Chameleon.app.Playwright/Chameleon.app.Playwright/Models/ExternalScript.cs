using System.Collections.Generic;
using System.Threading.Tasks;

using Chameleon.app.Playwright.Interfactes;
using Chameleon.lib.Core.Automation.Interfaces;

using Microsoft.Playwright;

namespace Chameleon.app.Playwright.Models;
public class ExternalScript : IExternalScript {
	public async Task Run(IBrowserContext context, IDictionary<string,string>? pargs = null) {
		// use to run script in a new tab 
		// IPage page = await context.NewPageAsync(); 
		// use to run script in the first tab 
		var page = context.Pages[0];

		// __________paste the recorded content under here____________________

		// __________paste the recorded content above here____________________

		// use this anywhere in the script to pause the script 
		await page.PauseAsync();
		// use this anywhere in the script to add delay
		// await Task.Delay(1000); 
	}
}
