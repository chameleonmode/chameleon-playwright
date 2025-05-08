import { chromium } from "@playwright/test";

async function main() {
  const [file, json, dir] = process.argv.slice(2);
  const pluginPath = `./${file}`;
  const userDataDir = dir || "/Users/dev/Library/Application Support/Chameleon/Chrome/29256";
  const opts = json ? JSON.parse(json) || "{}" : undefined;
  const { default: plugin } = await import(pluginPath); 

  const ctx = await(async function () {
    try {
      // Try to connect to an already running Chrome instance
      const browser = await chromium.connectOverCDP("http://localhost:9613");
      const context = browser.contexts()[0];
      // Add stealth features to avoid detection
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });

        // Add more stealth features as needed
        const originalQuery = window.navigator.permissions.query;
        // @ts-ignore
        window.navigator.permissions.query = (parameters) => {
          parameters.name === "notifications"
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);
        };
      });
      return context;
    } catch (error) {
      // Ensure the context is connected to the newly launched browser
      return await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        executablePath: (() => {
          switch (process.platform) {
            case "win32":
              return process.arch === "x64"
                ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                : "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
            case "darwin":
              return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
            case "linux":
              return "/usr/bin/google-chrome";
            default:
              return undefined;
          }
        })(),
        // adding args might create issues with some plugins on different platforms leave it empty
        args: ["--remote-debugging-port=3690"],
      });
    }
  })();

  await plugin(ctx, opts);
}

main().catch((error) => {
  console.log(`Error: ${error}`, error);
  process.exit(1);
});
