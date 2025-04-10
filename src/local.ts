// This file is used to run the local version of the plugin
// Usage: node src/local.ts <platform> <plugin> <options>
// Example: node src/local.ts reddit comment '{"search": "AI in healthcare"}'
const [platform, file, json] = process.argv.slice(2);
const pluginPath = `./scripts/${platform}/plugins/${file}`;
//const userDataDir = `.cache/${platform}`;
const userDataDir = "/Users/dev/Library/Application Support/Chameleon/Chrome/28296"; 
const opts = JSON.parse(json) || "{}";

async function main() {
  process.env.API = await (async () => {
    try {
      // Simple fetch check with AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300);

      await fetch("http://127.0.0.1:3042", { signal: controller.signal });
      clearTimeout(timeoutId);

      return "http://127.0.0.1:3042"; // Local server is available
    } catch (error) {
      return "https://chameleon-ws.onrender.com"; // Use fallback
    }
  })();

  const { chromium } = await import("@playwright/test");
  const { default: plugin } = await import(pluginPath);

  const context = await (async function(){
    try {
      // Try to connect to an already running Chrome instance
      return await chromium.connectOverCDP("http://localhost:3690");
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
      })
    }
  })()


  
  await plugin(context, opts);
}

main().catch(console.error);
