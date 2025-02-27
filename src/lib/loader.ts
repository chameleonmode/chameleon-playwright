import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// Recreate __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function (file: string): Promise<any> {
  console.log(`Attempting to load script from: ${file}`);
  const scriptPath = file.endsWith("js") ? file : path.join(__dirname, "scripts", `${file}.js`);
  const scriptUrl = pathToFileURL(scriptPath).href;
  const module = await import(scriptUrl);
  return module.default || module[file];
}
