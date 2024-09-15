using System.Threading;
using System.Threading.Tasks;

using Chameleon.lib.Common.Interfaces;

using Microsoft.Playwright;

namespace Chameleon.app.Playwright.Interfactes;
public interface IPlaywriteBrowserService
				: ISingletonDependency {
	IPlaywright? Playwright { get; set; }
	Task RunScript(IPlaywriteRunScriptOptions options, CancellationToken token);
}
