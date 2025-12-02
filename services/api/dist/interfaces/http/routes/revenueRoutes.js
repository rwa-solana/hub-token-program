"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevenueRoutes = createRevenueRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const RevenueController_1 = require("../controllers/RevenueController");
function createRevenueRoutes() {
    const router = (0, express_1.Router)();
    const controller = tsyringe_1.container.resolve(RevenueController_1.RevenueController);
    router.get('/property/:mint', controller.getHistoryByProperty.bind(controller));
    return router;
}
//# sourceMappingURL=revenueRoutes.js.map