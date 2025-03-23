import path from "path";

export async function loader(file: string): Promise<any> {
  // Recreate dirname for ES module
  const __filename = (await import("url")).fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Attempting to load script from the specified file
  const script = file.endsWith("js") ? file : path.join(__dirname, "scripts", `${file}.js`);

  // Use URL object directly instead of pathToFileURL
  const url = new URL(`file://${path.resolve(script)}`);
  const module = await import(url.href);
  return module.default || module[file];
}

export default async function run(args: { file: string; port: number; options: unknown }) {
  try {
    console.log(`Try: ${args.file} Port: ${args.port}`);
    const script = await loader(args.file);
    const browser = await (
      await import("@playwright/test")
    ).chromium.connectOverCDP(`http://localhost:${args.port}`);
    await script(browser.contexts()[0], args.options);
    console.log(`Try: ${args.file} success`);
  } catch (error: unknown) {
    console.error(`Catch: ${args.file} ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    console.log(`Finally: ${args.file} completed finally block`);
  }
}
