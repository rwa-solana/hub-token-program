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
exports.InvestorController = void 0;
const tsyringe_1 = require("tsyringe");
const GetInvestorPortfolioUseCase_1 = require("../../../application/use-cases/GetInvestorPortfolioUseCase");
const GetClaimableRevenueUseCase_1 = require("../../../application/use-cases/GetClaimableRevenueUseCase");
let InvestorController = class InvestorController {
    getInvestorPortfolioUseCase;
    getClaimableRevenueUseCase;
    constructor(getInvestorPortfolioUseCase, getClaimableRevenueUseCase) {
        this.getInvestorPortfolioUseCase = getInvestorPortfolioUseCase;
        this.getClaimableRevenueUseCase = getClaimableRevenueUseCase;
    }
    async getPortfolio(req, res, next) {
        try {
            const { wallet } = req.params;
            const portfolio = await this.getInvestorPortfolioUseCase.execute(wallet);
            res.json({
                success: true,
                data: portfolio,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getClaimable(req, res, next) {
        try {
            const { wallet } = req.params;
            const claimable = await this.getClaimableRevenueUseCase.execute(wallet);
            res.json({
                success: true,
                data: claimable,
            });
        }
        catch (error) {
            next(error);
        }
    }
};
exports.InvestorController = InvestorController;
exports.InvestorController = InvestorController = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [GetInvestorPortfolioUseCase_1.GetInvestorPortfolioUseCase,
        GetClaimableRevenueUseCase_1.GetClaimableRevenueUseCase])
], InvestorController);
//# sourceMappingURL=InvestorController.js.map