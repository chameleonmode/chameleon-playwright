using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Chameleon.app.Playwright.Interfactes;
using Chameleon.lib.Common.Enums;
using Chameleon.lib.Core.Automation.Interfaces;

namespace Chameleon.app.Playwright.Models;
public class PlaywriteRunScriptOptions : IPlaywriteRunScriptOptions {
	public int Port { get; set; }
	public bool Record { get; set; }
	public SystemBrowserType BrowserType { get; set; }
	public IAutomationScriptDescription? Script { get; set; }
	public IBundledScript? BundledScript { get; set; }
}
