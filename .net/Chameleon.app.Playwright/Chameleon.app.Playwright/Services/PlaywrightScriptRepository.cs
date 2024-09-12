using System.Collections.Generic;

using Chameleon.app.Playwright.Interfactes;

namespace Chameleon.app.Playwright.Services;
public class PlaywrightScriptRepository : IPlaywrightScriptRepository {
	public IList<IBundledScript> BundledScripts { get; } = [];
}
