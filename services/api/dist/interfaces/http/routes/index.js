"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRoutes = createApiRoutes;
const express_1 = require("express");
const propertyRoutes_1 = require("./propertyRoutes");
const kycRoutes_1 = require("./kycRoutes");
const investorRoutes_1 = require("./investorRoutes");
const revenueRoutes_1 = require("./revenueRoutes");
const ipfsRoutes_1 = require("./ipfsRoutes");
function createApiRoutes() {
    const router = (0, express_1.Router)();
    router.use('/properties', (0, propertyRoutes_1.createPropertyRoutes)());
    router.use('/kyc', (0, kycRoutes_1.createKycRoutes)());
    router.use('/investors', (0, investorRoutes_1.createInvestorRoutes)());
    router.use('/revenue', (0, revenueRoutes_1.createRevenueRoutes)());
    router.use('/ipfs', (0, ipfsRoutes_1.createIpfsRoutes)());
    // Health check
    router.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    return router;
}
//# sourceMappingURL=index.js.map