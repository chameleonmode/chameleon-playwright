import { Browser } from "@playwright/test";
import path from "path";

export async function loader(file: string) {
  // Recreate dirname for ES module
  const __filename = (await import("url")).fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Attempting to load script from the specified file
  const script = file.endsWith(".js") ? file : path.join(__dirname, `${file}.js`);

  // Use URL object directly instead of pathToFileURL
  const url = new URL(`file://${path.resolve(script)}`);
  const module = await import(url.href);
  return module.default || module[file];
}

export async function run(args: { file: string; port: number; options: unknown }, bro?: Browser) {
  try {
    console.log(`Try: ${args.file} Port: ${args.port}`);
    const script = await loader(args.file);
    const browser = bro || await (
      await import("@playwright/test")
    ).chromium.connectOverCDP(`http://localhost:${args.port}`);

    const ctx = browser.contexts()[0];
    // Add stealth features to avoid detection
    await ctx.addInitScript(() => {
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
    await script(ctx, args.options);
    console.log(`Try: ${args.file} success`);
  } catch (error: unknown) {
    console.error(`Catch: ${args.file} ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    console.log(`Finally: ${args.file} completed finally block`);
  }
}
