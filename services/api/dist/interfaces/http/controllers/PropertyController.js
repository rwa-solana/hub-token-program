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
exports.PropertyController = void 0;
const tsyringe_1 = require("tsyringe");
const GetPropertiesUseCase_1 = require("../../../application/use-cases/GetPropertiesUseCase");
const GetPropertyByMintUseCase_1 = require("../../../application/use-cases/GetPropertyByMintUseCase");
let PropertyController = class PropertyController {
    getPropertiesUseCase;
    getPropertyByMintUseCase;
    constructor(getPropertiesUseCase, getPropertyByMintUseCase) {
        this.getPropertiesUseCase = getPropertiesUseCase;
        this.getPropertyByMintUseCase = getPropertyByMintUseCase;
    }
    async getAll(req, res, next) {
        try {
            const { status, minValue, maxValue, propertyType } = req.query;
            const filter = {
                status: status,
                minValue: minValue ? Number(minValue) : undefined,
                maxValue: maxValue ? Number(maxValue) : undefined,
                propertyType: propertyType,
            };
            const properties = await this.getPropertiesUseCase.execute({ filter });
            res.json({
                success: true,
                data: properties,
                count: properties.length,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getByMint(req, res, next) {
        try {
            const { mint } = req.params;
            const property = await this.getPropertyByMintUseCase.execute(mint);
            if (!property) {
                res.status(404).json({
                    success: false,
                    error: 'Property not found',
                });
                return;
            }
            res.json({
                success: true,
                data: property,
            });
        }
        catch (error) {
            next(error);
        }
    }
};
exports.PropertyController = PropertyController;
exports.PropertyController = PropertyController = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [GetPropertiesUseCase_1.GetPropertiesUseCase,
        GetPropertyByMintUseCase_1.GetPropertyByMintUseCase])
], PropertyController);
//# sourceMappingURL=PropertyController.js.map