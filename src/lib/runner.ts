import { Browser } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import { Opts } from "./index.js";
import { Logger } from "./logger.js";

export async function loader(file: string) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Handle different file extensions
  const extensions = ['.js', '.mjs', '.ts'];
  let script = file;
  
  if (!extensions.some(ext => file.endsWith(ext))) {
    script = path.join(__dirname, `${file}.js`);
  }
  
  // Normalize path for cross-platform compatibility
  const resolvedPath = path.resolve(script);
  const normalizedPath = path.normalize(resolvedPath);
  
  // Use pathToFileURL for proper URL conversion
  const url = pathToFileURL(normalizedPath);
  
  const module = await import(url.href);
  const feature = path.parse(normalizedPath).name;
  
  return { plugin: module.default || module, feature };
}

export async function run(args: { file: string; browser: Browser, opts: unknown }) {
  try {
    Logger.log(`try ${args.file}`);
    const { plugin, feature } = await loader(args.file);

    const ctx = args.browser.contexts()[0];
    const op = args.opts as Partial<Opts<unknown>>;
    const opts = {
      ...op,
      run: { file: args.file },
      settings: {
        ...op?.settings,
         start: { 
          ...op?.settings?.start,
          feature,
        },
      },
    };
    await plugin(ctx, opts);
    console.log(`Try: ${args.file} success`);
  } catch (error) {
    console.error(`Catch: ${args.file} ${error instanceof Error ? error.message : String(error)}`);
    Logger.error("Error in runner", error);
  } finally {
    console.log(`Finally: ${args.file} completed finally block`);
  }
}
