import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { Opts } from "./types/index.js";

export async function loader(file: string) {
  // Recreate dirname for ES module
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Attempting to load script from the specified file
  const script = file.endsWith(".js") ? file : path.join(__dirname, `${file}.js`);

  // Use URL object directly instead of pathToFileURL
  const url = new URL(`file://${path.resolve(script)}`);
  const module = await import(url.href);
  const feature = url.href.split("/").pop()?.split(".")[0];
  return { plugin: module.default || module, feature };
}

export async function run(args: { file: string; port: number; opts: unknown }) {
  try {
    console.log(`Try: ${args.file} Port: ${args.port}`);
    const { plugin, feature } = await loader(args.file);
    const browser = await chromium.connectOverCDP(`http://localhost:${args.port}`);

    const ctx = browser.contexts()[0];
    // Add stealth features to avoid detection
    // Add standard Playwright stealth features to avoid detection
    await ctx.addInitScript(() => {
      // Hide webdriver property
      Object.defineProperty(navigator, "webdriver", { get: () => false });

      // Hide automation-related properties
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
      Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });

            // Add more stealth features as needed
      const query = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => {
        if (parameters.name === "notifications") {
          const result: PermissionStatus = {
            name: "notifications",
            state: Notification.permission as PermissionState,
            onchange: null,
            addEventListener: function() {},
            removeEventListener: function() {},
            dispatchEvent: function() { return false; }
          };
          return Promise.resolve(result);
        }
        return query(parameters);
      };
    });
    const op = args.opts as Partial<Opts<unknown>>;
    const opts = {
      ...op,
      run: { file: args.file, port: args.port },
      settings: {
         start: { 
          feature,
          ...op?.settings?.start,
        } 
      },
    };
    await plugin(ctx, opts);
    console.log(`Try: ${args.file} success`);
  } catch (error: unknown) {
    console.error(`Catch: ${args.file} ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    console.log(`Finally: ${args.file} completed finally block`);
  }
}
