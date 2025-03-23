import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

export async function loader(file: string): Promise<any> {
  // Recreate dirname for ES module
  const dirname = path.dirname(fileURLToPath(import.meta.url));

  // Attempting to load script from the specified file
  const scriptPath = file.endsWith("js") ? file : path.join(dirname, "scripts", `${file}.js`);
  const module = await import(pathToFileURL(scriptPath).href);
  return module.default || module[file];
}

export default async function run({ file, port, options }: { file: string; port: number; options: unknown }) {
  try {
    console.log(`Try: ${file} Port: ${port}`);
    const script = await loader(file);
    const browser = await (
      await import("@playwright/test")
    ).chromium.connectOverCDP(`http://localhost:${port}`);
    await script(browser, options);
    console.log(`Try: ${file} success`);
  } catch (error) {
    console.error(`Catch: ${file} ${(error as Error).message}`);
  } finally {
    console.log(`Finally: ${file} completed finally block`);
  }
}
