import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const color = statusCode >= 500 ? '\x1b[31m' : // red
                  statusCode >= 400 ? '\x1b[33m' : // yellow
                  statusCode >= 300 ? '\x1b[36m' : // cyan
                  '\x1b[32m'; // green

    console.log(
      `${color}${method}\x1b[0m ${originalUrl} - ${statusCode} - ${duration}ms`
    );
  });

  next();
}
