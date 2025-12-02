import { Router } from 'express';
import { container } from 'tsyringe';
import { RevenueController } from '../controllers/RevenueController';

export function createRevenueRoutes(): Router {
  const router = Router();
  const controller = container.resolve(RevenueController);

  router.get('/property/:mint', controller.getHistoryByProperty.bind(controller));

  return router;
}
