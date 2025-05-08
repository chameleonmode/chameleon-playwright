// File: src/utils/logger.ts - Logging utility
export class Logger {
  private static prefix = () => {
    const date = new Date();
    return `${date.toISOString().split("T")[0]} ${date.toTimeString().split(" ")[0]}`;
  };

  static log(message: string, ...optional: any[]): void {
    console.log(`[${this.prefix()}] \x1b[32mLOG:\x1b[0m ${message}`, optional);
  }

  static info(message: string, ...optional: any[]): void {
    console.log(`[${this.prefix()}] \x1b[34mINFO:\x1b[0m ${message}`, optional);
  }

  static debug(message: string, ...optional: any[]): void {
    console.log(`[${this.prefix()}] \x1b[36mDEBUG:\x1b[0m ${message}`, optional);
  }

  static warn(message: string, ...optional: any[]): void {
    console.warn(`[${this.prefix()}()] \x1b[33mWARN:\x1b[0m ${message}`, optional);
  }

  static error(message: string, error?: unknown, ...optional: any[]): void {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${this.prefix()}] \x1b[31mERROR:\x1b[0m ${message} - ${errorMsg}`, error, optional);
  }
}
