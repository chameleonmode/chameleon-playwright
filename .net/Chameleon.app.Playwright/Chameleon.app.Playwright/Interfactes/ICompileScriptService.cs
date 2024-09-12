using System.Threading.Tasks;

using Chameleon.lib.Common.Interfaces;

namespace Chameleon.app.Playwright.Interfactes;
public interface ICompileScriptService
		: ISingletonDependency {
	Task<IExternalScript?> CompileScript(string script);
}
