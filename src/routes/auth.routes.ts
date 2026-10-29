import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { loginRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', loginRateLimiter, validateBody(loginSchema), authController.login);

export default router;

