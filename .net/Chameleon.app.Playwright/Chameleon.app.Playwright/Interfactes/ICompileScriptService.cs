using System.Threading.Tasks;

using Chameleon.lib.Common.Interfaces;
using Chameleon.lib.Core.Automation.Interfaces;

namespace Chameleon.app.Playwright.Interfactes;
public interface ICompileScriptService
		: ISingletonDependency {
	Task<IExternalScript?> CompileScript(string script);
}
