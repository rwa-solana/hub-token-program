import { Router } from 'express';
import { container } from 'tsyringe';
import { AdminController } from '../controllers/AdminController';

export function createAdminRoutes(): Router {
  const router = Router();
  const controller = container.resolve(AdminController);

  // GET /api/admin/status - Check admin service status
  router.get('/status', controller.getStatus.bind(controller));

  // POST /api/admin/properties - Create new property
  router.post('/properties', controller.createProperty.bind(controller));

  // POST /api/admin/properties/:mint/toggle - Toggle property status
  router.post('/properties/:mint/toggle', controller.togglePropertyStatus.bind(controller));

  // POST /api/admin/mint - Mint tokens to investor
  router.post('/mint', controller.mintTokens.bind(controller));

  // POST /api/admin/revenue - Deposit revenue
  router.post('/revenue', controller.depositRevenue.bind(controller));

  return router;
}
