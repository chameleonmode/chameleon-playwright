using System.Collections.Generic;

namespace Chameleon.app.Playwright.Interfactes;
public interface IPlaywrightScriptRepository {
	IList<IBundledScript> BundledScripts { get; }
}
