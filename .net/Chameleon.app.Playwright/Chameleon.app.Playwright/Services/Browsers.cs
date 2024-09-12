using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Chameleon.app.Playwright.Interfactes;
using Microsoft.Playwright;

namespace Chameleon.app.Playwright.Services;
public class ChromeiumPlaywrightBrowserInstance(IPlaywrightBrowserLaunchOptions options)
		: IPlaywrightBrowserInstance {
	private IBrowser? _browser;

	public IBrowserContext? BrowserContext => _browser!.Contexts.Count > 0 ? _browser.Contexts[0] : null;

	public async Task Close() {
		if (BrowserContext != null) 			await BrowserContext.CloseAsync();

		if (_browser != null) {
			await _browser.CloseAsync();
			_browser = null;
		}
	}

	public Task Open()
			=> TryOpenByCDP(0);

	private async Task TryOpenByCDP(int v) {
		ArgumentNullException.ThrowIfNull(options.Playwright);
		ArgumentNullException.ThrowIfNull(options.ScriptOptions);
		try {
			_browser = await options.Playwright.Chromium.ConnectOverCDPAsync($"http://localhost:{options.ScriptOptions.Port}");
		} catch {
			if (v < 6) {
				await Task.Delay(1000);
				await TryOpenByCDP(v + 1);
			} else {
				throw;
			}
		}
	}

	public async Task Record() {
		var page = await BrowserContext!.NewPageAsync();
		await page!.PauseAsync();
	}
}

public class ChromeiumPlaywrightBrowser
		: IChromeiumPlaywrightBrowser {
	public virtual async Task<IPlaywrightBrowserInstance> Open(IPlaywrightBrowserLaunchOptions o) {
		var browser = new ChromeiumPlaywrightBrowserInstance(o);
		await browser.Open();
		return browser;
	}
}