import { Router } from 'express';
import { container } from 'tsyringe';
import { InvestorController } from '../controllers/InvestorController';

export function createInvestorRoutes(): Router {
  const router = Router();
  const controller = container.resolve(InvestorController);

  router.get('/:wallet/portfolio', controller.getPortfolio.bind(controller));
  router.get('/:wallet/claimable', controller.getClaimable.bind(controller));

  return router;
}
