// This file is used to run the local version of the plugin
// Usage: node src/local.ts <platform> <plugin> <options>
// Example: node src/local.ts reddit comment '{"search": "AI in healthcare"}'
const [platform, file, json] = process.argv.slice(2);
const pluginPath = `./scripts/${platform}/plugins/${file}`;
//const userDataDir = `.cache/${platform}`;
const userDataDir = "/Users/dev/Library/Application Support/Chameleon/Chrome/29256";
const opts = json ? JSON.parse(json) || "{}" : undefined;

async function main() {
  const { chromium } = await import("@playwright/test");
  const context = await (async function () {
    try {
      // Try to connect to an already running Chrome instance
      return (await chromium.connectOverCDP("http://localhost:9613")).contexts()[0];
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

  const { default: plugin } = await import(pluginPath);
  await plugin(context, opts);
}

main().catch(console.error);
