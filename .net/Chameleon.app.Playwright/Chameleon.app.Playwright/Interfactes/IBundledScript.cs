using Chameleon.lib.Core.Automation.Interfaces;
using Microsoft.Playwright;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Chameleon.app.Playwright.Interfactes;
public interface IBundledScript {
	Task Run(IBrowserContext browserContext, IList<IAutomationParameterValue>? pargs = null);
}
