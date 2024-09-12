using System.Threading;
using System.Threading.Tasks;

using Chameleon.app.Playwright.Interfactes;
using Chameleon.lib.Common.Interfaces;

namespace Chameleon.lib.Core.Automation.Interfaces;
public interface IPlaywriteBrowserService
				: ISingletonDependency {
	Task RunScript(
					IPlaywriteRunScriptOptions options,
					CancellationToken token);
}
