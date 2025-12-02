import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}
export declare function errorHandler(error: ApiError, req: Request, res: Response, next: NextFunction): void;
export declare class NotFoundError extends Error implements ApiError {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
export declare class BadRequestError extends Error implements ApiError {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
export declare class UnauthorizedError extends Error implements ApiError {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
export declare class ForbiddenError extends Error implements ApiError {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
//# sourceMappingURL=errorHandler.d.ts.map