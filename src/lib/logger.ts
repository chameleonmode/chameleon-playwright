// File: src/utils/logger.ts - Logging utility
export class Logger {
  private static prefix = "Logger";
  
  static info(message: string, ...optional: any[]): void {
    console.log(`[${this.prefix}] INFO: ${message}`, optional);
  }
  
  static warn(message: string, ...optional: any[]): void {
    console.warn(`[${this.prefix}] WARN: ${message}`, optional);
  }
  
  static error(message: string, error: unknown, ...optional: any[]): void {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${this.prefix}] ERROR: ${message} - ${errorMsg}`, error, optional);
  }
}