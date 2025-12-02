"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueController = void 0;
const tsyringe_1 = require("tsyringe");
const GetRevenueHistoryUseCase_1 = require("../../../application/use-cases/GetRevenueHistoryUseCase");
let RevenueController = class RevenueController {
    getRevenueHistoryUseCase;
    constructor(getRevenueHistoryUseCase) {
        this.getRevenueHistoryUseCase = getRevenueHistoryUseCase;
    }
    async getHistoryByProperty(req, res, next) {
        try {
            const { mint } = req.params;
            const history = await this.getRevenueHistoryUseCase.execute(mint);
            if (!history) {
                res.status(404).json({
                    success: false,
                    error: 'Property not found',
                });
                return;
            }
            res.json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            next(error);
        }
    }
};
exports.RevenueController = RevenueController;
exports.RevenueController = RevenueController = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [GetRevenueHistoryUseCase_1.GetRevenueHistoryUseCase])
], RevenueController);
//# sourceMappingURL=RevenueController.js.map