"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPropertyRoutes = createPropertyRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const PropertyController_1 = require("../controllers/PropertyController");
function createPropertyRoutes() {
    const router = (0, express_1.Router)();
    const controller = tsyringe_1.container.resolve(PropertyController_1.PropertyController);
    router.get('/', controller.getAll.bind(controller));
    router.get('/:mint', controller.getByMint.bind(controller));
    return router;
}
//# sourceMappingURL=propertyRoutes.js.map