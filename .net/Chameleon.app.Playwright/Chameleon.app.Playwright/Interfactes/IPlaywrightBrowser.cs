using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Chameleon.lib.Common.Interfaces;
using Chameleon.lib.Core.Automation.Interfaces;
using Microsoft.Playwright;

namespace Chameleon.app.Playwright.Interfactes;
public interface IPlaywrightBrowserLaunchOptions {
	IAutomationRunScriptOptions? ScriptOptions { get; set; }
	IPlaywright? Playwright { get; }
}

public interface IPlaywrightBrowserInstance {
	IBrowserContext? BrowserContext { get; }
	Task Open();
	Task Close();
	Task Record();
}

public interface IPlaywrightBrowser : ISingletonDependency {
	Task<IPlaywrightBrowserInstance> Open(IPlaywrightBrowserLaunchOptions options);
}

public interface IChromeiumPlaywrightBrowser
		: IPlaywrightBrowser {
}

