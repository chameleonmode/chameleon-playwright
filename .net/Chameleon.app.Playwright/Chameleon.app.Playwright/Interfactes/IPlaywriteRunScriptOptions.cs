using Chameleon.app.Playwright.Interfactes;
using Chameleon.lib.Common.Enums;

namespace Chameleon.lib.Core.Automation.Interfaces;
public interface IPlaywriteRunScriptOptions {
		int Port { get; set; }
		bool Record { get; set; }
		SystemBrowserType BrowserType { get; set; }
		IAutomationScriptDescription Script { get; set; }
		IBundledScript? BundledScript { get; set; }
}
