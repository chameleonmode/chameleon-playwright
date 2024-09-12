using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using Chameleon.app.Playwright.Interfactes;
using Chameleon.app.Playwright.Models;
using Chameleon.app.Playwright.Scripts;
using Chameleon.lib.Common;
using Chameleon.lib.Common.Enums;
using Chameleon.lib.Common.Interfaces;
using Chameleon.lib.Core.Automation.Interfaces;

using Microsoft.Extensions.Options;
using Microsoft.Playwright;

namespace Chameleon.app.Playwright.Services;
public class PlaywriteBrowserService(
		ICompileScriptService compileScriptService,
		IAutomationService automationService,
		IToastNotificationService toastNotificationService)
		: IPlaywriteBrowserService {
	public static readonly string recordcontent = @"
using Microsoft.Playwright;
using System.Collections.Generic;  // required for ""IDictionary<string, string>""
using System;
using System.Threading.Tasks;
using Chameleon.Interfaces.App.Automation.ExternalScript; // required for ""async Task""

public class ExternalScript : IExternalScript
{
    public async Task Run(IBrowserContext context, IDictionary<string, string> args)
    {
        IPage page = await context.NewPageAsync(); 

        // other actions 
        await page.PauseAsync();
    }
}
";
	private List<IPlaywrightBrowserInstance> RunningAutomationBrowsers { get; } = [];
	public static IPlaywrightBrowser? Get(SystemBrowserType browserType) => browserType switch {
		SystemBrowserType.Chrome or
		SystemBrowserType.Brave => IoC.GetService<IChromeiumPlaywrightBrowser>() as IPlaywrightBrowser,
		SystemBrowserType.Unknown => throw new NotImplementedException(),
		SystemBrowserType.Firefox => throw new NotImplementedException(),
		_ => throw new NotImplementedException(),
	};

	public async Task RunScript(
		IPlaywriteRunScriptOptions options,
		CancellationToken token) {
		try {
			var scripBody = options.Record ? recordcontent : options.Script.Id < 0 ?
							await automationService.GetScriptBody(options.Script.FilePath ?? throw new ArgumentNullException(nameof(options.Script.FilePath))) :
							await automationService.GetScriptBody(options.Script.Id);

			var instance = await compileScriptService.CompileScript(scripBody);
			ArgumentNullException.ThrowIfNull(instance);

			var browser = Get(options.BrowserType);
			ArgumentNullException.ThrowIfNull(browser);

			//TODO: singleton
			using var playwright = await Microsoft.Playwright.Playwright.CreateAsync();
			var launchOptions = new PlaywrightBrowserLaunchOptions {
				ScriptOptions = options,
				Playwright = playwright
			};
			var browserInstance = await browser.Open(launchOptions);
			ArgumentNullException.ThrowIfNull(browserInstance.BrowserContext);

			RunningAutomationBrowsers.Add(browserInstance);

			try {
				if (options.Record)
					await new ExternalScript().Run(browserInstance.BrowserContext).WaitAsync(token); //await browserInstance.Record().WaitAsync(token);
				else
					await instance.Run(browserInstance.BrowserContext, options.Script.Parameters.ParseArguments()).WaitAsync(token);
			} catch (Exception ex) {
				// await MesageBoxHelper.ShowErrorAsync("Script error", ex.Message);
				toastNotificationService.ShowError(ex.Message);
			}

			//TODO: move to IUserProfileActionsViewModel
			//foreach (IUserProfileActionsViewModel profile in userProfiles) {
			//	var browserWasNotOpened = profile.SBI == null;
			//	if (browserWasNotOpened) {
			//		await profile.OpenSystemBrowser(browserType).WaitAsync(token);
			//		if (!await profile.SBI.OPtcs.Task.WaitAsync(token))
			//			continue;
			//	}
			//	// Check if the browser process is not null and hasn't exited
			//	if (browserWasNotOpened &&
			//			profile.SBI != null &&
			//			profile.SBI.Brocess != null &&
			//			!profile.SBI.Brocess.HasExited) {
			//		try {
			//			await browserInstance.Close();
			//			// Attempt to close the browser gracefully
			//			profile.SBI.Brocess.CloseMainWindow();
			//			// Give the process some time to exit gracefully
			//			bool exitedGracefully = profile.SBI.Brocess.WaitForExit(2500); // Wait for 2.5 seconds
			//			if (!exitedGracefully) {
			//				// If the process hasn't exited within 5 seconds, kill it
			//				profile.SBI.Brocess.Kill();
			//				// Wait for the process to be killed
			//				profile.SBI.Brocess.WaitForExit();
			//			}
			//		} catch (Exception ex) {
			//			// Log or handle the exception if closing the process fails
			//			toastNotificationService.ShowError($"Failed to close the browser process: {ex.Message}");
			//		} finally {
			//			// Ensure the process is disposed
			//			//profile.SBI.Brocess.Dispose();
			//			//profile.SBI.Cleanup();
			//			RunningAutomationBrowsers.RemoveBrowser(browserInstance);
			//		}
			//	}
			//	// Stop loop if canceled
			//	if (token.IsCancellationRequested) {
			//		break;
			//	}
			//}
		} catch (Exception ex) {
			toastNotificationService.ShowError(ex.Message);
		} finally {
			// RiseFinishScriptExecutionEvent();
		}
	}
}

