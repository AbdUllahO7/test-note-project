import { Router } from 'express';
import { externalController } from '../controllers/external.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Only authenticated users can access external integration endpoint
router.use(authenticate);

router.get('/rates', externalController.getExchangeRates);

export default router;
