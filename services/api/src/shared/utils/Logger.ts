import { injectable } from 'tsyringe';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@injectable()
export class Logger {
  private context: string = 'App';

  setContext(context: string): void {
    this.context = context;
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\x1b[90m[${this.timestamp()}] [DEBUG] [${this.context}]\x1b[0m`, message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.log(`\x1b[36m[${this.timestamp()}] [INFO] [${this.context}]\x1b[0m`, message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`\x1b[33m[${this.timestamp()}] [WARN] [${this.context}]\x1b[0m`, message, ...args);
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    console.error(`\x1b[31m[${this.timestamp()}] [ERROR] [${this.context}]\x1b[0m`, message, ...args);
    if (error?.stack) {
      console.error(error.stack);
    }
  }

  private timestamp(): string {
    return new Date().toISOString();
  }
}
