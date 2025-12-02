import { Router } from 'express';
import { container } from 'tsyringe';
import { PropertyController } from '../controllers/PropertyController';

export function createPropertyRoutes(): Router {
  const router = Router();
  const controller = container.resolve(PropertyController);

  router.get('/', controller.getAll.bind(controller));
  router.get('/:mint', controller.getByMint.bind(controller));

  return router;
}
