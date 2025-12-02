import { Router } from 'express';
import { container } from 'tsyringe';
import { KycController } from '../controllers/KycController';

export function createKycRoutes(): Router {
  const router = Router();
  const controller = container.resolve(KycController);

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
