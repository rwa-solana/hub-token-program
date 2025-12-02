"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIpfsRoutes = createIpfsRoutes;
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const multer_1 = __importDefault(require("multer"));
const IpfsController_1 = require("../controllers/IpfsController");
// Configure multer for memory storage - IMAGES ONLY
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 10, // Max 10 files at once
    },
    fileFilter: (req, file, cb) => {
        // Only allow images
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`));
        }
    },
});
function createIpfsRoutes() {
    const router = (0, express_1.Router)();
    const controller = tsyringe_1.container.resolve(IpfsController_1.IpfsController);
    // Public routes
    router.get('/status', controller.getStatus.bind(controller));
    router.get('/gateway/:hash', controller.getGatewayUrl.bind(controller));
    router.get('/metadata/:hash', controller.getMetadata.bind(controller));
    // Admin routes (require x-wallet-address header)
    router.post('/upload/image', upload.single('image'), controller.uploadImage.bind(controller));
    router.post('/upload/images', upload.array('images', 10), controller.uploadImages.bind(controller));
    // Metadata management
    router.post('/metadata', controller.createMetadata.bind(controller));
    router.put('/metadata', controller.updateMetadata.bind(controller));
    // Unpin content
    router.delete('/unpin/:hash', controller.unpin.bind(controller));
    return router;
}
//# sourceMappingURL=ipfsRoutes.js.map