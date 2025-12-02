export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare class Logger {
    private context;
    setContext(context: string): void;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, error?: Error, ...args: unknown[]): void;
    private timestamp;
}
//# sourceMappingURL=Logger.d.ts.map