"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKycRoutes = createKycRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const KycController_1 = require("../controllers/KycController");
function createKycRoutes() {
    const router = (0, express_1.Router)();
    const controller = tsyringe_1.container.resolve(KycController_1.KycController);
    // Civic Pass verification
    router.get('/verify/:wallet', controller.verify.bind(controller));
    // Gateway Token PDA lookup
    router.get('/gateway-token/:wallet', controller.getGatewayTokenPda.bind(controller));
    // Civic configuration info
    router.get('/config', controller.getConfig.bind(controller));
    // @deprecated - Use Civic frontend for Gateway Token creation
    router.post('/attestation', controller.createAttestation.bind(controller));
    return router;
}
//# sourceMappingURL=kycRoutes.js.map