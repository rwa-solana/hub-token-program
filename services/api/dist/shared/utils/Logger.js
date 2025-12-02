"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const tsyringe_1 = require("tsyringe");
let Logger = class Logger {
    context = 'App';
    setContext(context) {
        this.context = context;
    }
    debug(message, ...args) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`\x1b[90m[${this.timestamp()}] [DEBUG] [${this.context}]\x1b[0m`, message, ...args);
        }
    }
    info(message, ...args) {
        console.log(`\x1b[36m[${this.timestamp()}] [INFO] [${this.context}]\x1b[0m`, message, ...args);
    }
    warn(message, ...args) {
        console.warn(`\x1b[33m[${this.timestamp()}] [WARN] [${this.context}]\x1b[0m`, message, ...args);
    }
    error(message, error, ...args) {
        console.error(`\x1b[31m[${this.timestamp()}] [ERROR] [${this.context}]\x1b[0m`, message, ...args);
        if (error?.stack) {
            console.error(error.stack);
        }
    }
    timestamp() {
        return new Date().toISOString();
    }
};
exports.Logger = Logger;
exports.Logger = Logger = __decorate([
    (0, tsyringe_1.injectable)()
], Logger);
//# sourceMappingURL=Logger.js.map