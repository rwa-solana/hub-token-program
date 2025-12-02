"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvestorRoutes = createInvestorRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const InvestorController_1 = require("../controllers/InvestorController");
function createInvestorRoutes() {
    const router = (0, express_1.Router)();
    const controller = tsyringe_1.container.resolve(InvestorController_1.InvestorController);
    router.get('/:wallet/portfolio', controller.getPortfolio.bind(controller));
    router.get('/:wallet/claimable', controller.getClaimable.bind(controller));
    return router;
}
//# sourceMappingURL=investorRoutes.js.map