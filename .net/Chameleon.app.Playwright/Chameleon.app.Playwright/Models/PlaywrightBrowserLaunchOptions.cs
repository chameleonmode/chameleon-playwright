using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Chameleon.app.Playwright.Interfactes;
using Chameleon.lib.Core.Automation.Interfaces;
using Microsoft.Playwright;

namespace Chameleon.app.Playwright.Models;
public class PlaywrightBrowserLaunchOptions
		: IPlaywrightBrowserLaunchOptions {
	public IPlaywright? Playwright { get; set; }
	public IAutomationRunScriptOptions? ScriptOptions { get; set; }
}
