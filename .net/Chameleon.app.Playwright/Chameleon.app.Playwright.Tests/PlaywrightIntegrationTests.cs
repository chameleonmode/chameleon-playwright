using Chameleon.app.Playwright.Interfactes;
using Chameleon.app.Playwright.Scripts;
using Chameleon.lib.Common.Util;
using Chameleon.lib.Common;
using Chameleon.app.Playwright.Models;
using Chameleon.lib.Common.Enums;
using Chameleon.lib.Core.Automation.Models;
using Chameleon.lib.Core.Automation.Interfaces;
using Chameleon.lib.Core.Automation.Services;
using Microsoft.Extensions.DependencyInjection;
using Chameleon.app.Playwright.Services;
using System.Text;

namespace Chameleon.app.Playwright.Tests;
public class PlaywrightIntegrationTests : PlaywrightTestsBase, IDisposable {
	public PlaywrightIntegrationTests() : base()
	{
		void setup(bool init)
		{
			var repo = IoC.GetService<IPlaywrightScriptRepository>();
			repo!.BundledScripts.Add(new GoogleCTRClickThrough());
			repo!.BundledScripts.Add(new KeepGmailAlive());
			repo!.BundledScripts.Add(new URLsexplorer());
			// Setup code
			Port = Netil.NextFreePort(Port);
			CachePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
			BrowserProcess = GrowserProcess(CachePath, [$"--remote-debugging-port={Port}"]);

			_tcs.SetResult(true);
		}
		IoC.Instance.Configure((services) => {
			_ = services
			//lib.Core
			.AddSingleton<IAutomationScriptApi, AutomationScriptApi>()
			.AddSingleton<IAutomationScriptRepository, AutomationScriptRepository>()
			.AddSingleton<IAutomationService, AutomationService>()
			//app.Playwright
			.AddSingleton<ICompileScriptService, CompileScriptService>()
			.AddSingleton<IPlaywriteBrowserService, PlaywriteBrowserService>()
			.AddSingleton<IPlaywrightScriptRepository, PlaywrightScriptRepository>()
			.AddSingleton<IChromeiumPlaywrightBrowser, ChromeiumPlaywrightBrowser>();
		});
		// Setup IoC
		IoC.Instance.Init(action: setup);
	}

	[Fact]
	public async Task TestBundledScripts()
	{
		_ = await _tcs.Task;
		if (BrowserProcess != null) {
			await LaunchBrowser();

			var repo = IoC.GetService<IPlaywrightScriptRepository>();
			var playBrowserService = IoC.GetService<IPlaywriteBrowserService>();

			await playBrowserService!.RunScript(new PlaywriteRunScriptOptions {
				Port = Port,
				Record = false,
				BundledScript = repo!.BundledScripts[0],
				BrowserType = SystemBrowserType.Chrome,
				Script = new AutomationScriptDescription {
					Parameters = [
							new AutomationParameterValue {
								Name = "keyword", Value = "you"
							},
							new AutomationParameterValue {
								Name = "targetUrl", Value = "youtube.com"
							},
							new AutomationParameterValue {
								Name = "pagescount", Value = "3"
							},
							new AutomationParameterValue {
								Name = "timeout", Value = "10"
							}
					]
				}
			}, CancellationToken.None);

			playBrowserService.Playwright?.Dispose();
			await BrowserProcess.WaitForExitAsync();
		}
	}

	public async void Dispose()
	{
		await DisposeBrowser();
		GC.SuppressFinalize(this);
	}
}
