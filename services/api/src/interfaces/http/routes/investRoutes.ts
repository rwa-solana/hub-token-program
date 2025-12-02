import { Router } from 'express';
import { container } from 'tsyringe';
import { InvestController } from '../controllers/InvestController';

export function createInvestRoutes(): Router {
  const router = Router();
  const investController = container.resolve(InvestController);

  // POST /api/v1/invest - Process investment (mint tokens to investor)
  router.post('/', (req, res, next) => investController.invest(req, res, next));

  return router;
}
