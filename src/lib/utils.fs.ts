import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath, pathToFileURL } from "url";

// Recreate __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadScript(file: string): Promise<any> {
  console.log(`Attempting to load script from: ${file}`);
  const scriptPath = (await fileExists(file)) ? file : path.join(__dirname, "..", "/scripts", `${file}.js`);
  const scriptUrl = pathToFileURL(scriptPath).href;
  try {
    const module = await import(scriptUrl);
    return module.default || module[file];
  } catch (error) {
    console.error(`Error loading test script: ${(error as Error).message}`);
    return null;
  }
}

export const fileExists = async (path: string): Promise<any> => {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    console.error(`Error reading JSON file: ${(error as Error).message}`);
  }
  return false;
};
