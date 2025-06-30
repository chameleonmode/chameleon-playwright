import util from "util";

export class Logger {
  static PRINT: boolean = true; // Set to false to disable logging

  private static prefix = () => {
    const date = new Date();
    return `${date.toISOString().split("T")[0]} ${date.toTimeString().split(" ")[0]}`;
  };

  static getCallerLine() {
    const stack = new Error().stack;
    // Skip Logger methods: Error() -> getCallerLine() -> print() -> public method -> actual caller
    const callerInfo = stack?.split('\n')[4]?.trim().replace(/^at /, '') || 'unknown';
    const match = callerInfo.match(/^(.+?)\s+\((.+)\)$/);
    const method = match?.[1] || 'unknown';
    const filename = match?.[2] || 'unknown';
    
    // Return full stack if method or filename is unknown
    if (method === 'unknown' || filename === 'unknown') {
      return { method: 'unknown', filename: stack || 'no stack available' };
    }
    
    return { method, filename };
  }

  private static print(level: string, color: string, message: string, objects: any[]) {
    if(!this.PRINT) return;
    const callerLine = this.getCallerLine();
    const output = objects.map((o) =>
      typeof o === "string" ? o : util.inspect(o, { depth: null, colors: true, compact: true })
    );
    console.log(`[${this.prefix()}] \x1b[${color}m${level}\x1b[0m \x1b[95m(${callerLine.method})\x1b[0m ${message} {\n ${callerLine.filename},\n`, ...output, `\n}`);
    //console.log(`[${this.prefix()}] \x1b[${color}m${level}\x1b[0m \x1b[95m(${callerLine.method}):\x1b[0m {\n ${callerLine.filename},\n \x1b[38;5;208m${message}\x1b[0m,\n`, ...output, `\n}`);
  }

  static log(message: string = "INFO", ...objects: any[]): any {
    this.print("LOG", "32", message, objects);
  }

  static info(message: string = "INFO", ...objects: any[]): void {
    this.print("INFO", "35", message, objects);
  }

  static debug(message: string = "DEBUG", ...objects: any[]): void {
    this.print("DEBUG", "36", message, objects);
  }

  static warn(message: string = "WARN", ...objects: any[]): void {
    this.print("WARN", "33", message, objects);
  }

  static error(message: string = "ERROR", ...objects: any[]): void {
    this.print("ERROR", "31", message, objects);
  }

  static trace(message: string = "TRACE", ...objects: any[]): Error {
    const error = new Error("Trace log");
    this.print("TRACE", "34", message, [...objects, error]);
    return error;
  }

  static ror(message: unknown, cause?: unknown) {
    const error = new Error(`${message}`, { cause });
    const pretty = { cause, stack: error.stack };
    this.error(`(error): ${error.message}`, pretty);
    return error;
  }
}
