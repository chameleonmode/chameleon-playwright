import fs from 'fs/promises';

export interface Config {
  [key: string]: string;
}

export interface IConsoleCommand {
  name: string;
  port: number;
  data: any;
  [action: string]: string | number | any; // Adjusted index signature
}

const CONFIG_FILE = 'config.json';

export async function loadConfig(): Promise<Config | undefined> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data) as Config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Error loading config: ${(error as Error).message}`);
    }
  }
}

export async function loadCommandJson(json: string): Promise<IConsoleCommand | undefined> {
  try {
    return JSON.parse(json) as IConsoleCommand;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Error loading config: ${(error as Error).message}`);
    }
  }
}

export async function saveConfig(config: Config): Promise<void> {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Error saving config: ${(error as Error).message}`);
  }
}
