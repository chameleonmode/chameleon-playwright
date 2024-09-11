using System.Collections.Generic;
using System.Threading.Tasks;

using Microsoft.Playwright;

namespace Chameleon.app.Playwright.Interfactes;
public interface IExternalScript {
	Task Run(IBrowserContext browserContext, IDictionary<string, string> parameters);
}
