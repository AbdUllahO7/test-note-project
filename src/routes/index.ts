import { Router } from 'express';
import authRoutes from './auth.routes';
import notesRoutes from './notes.routes';
import externalRoutes from './external.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'notes-saas-api'
  });
});

router.use('/auth', authRoutes);
router.use('/notes', notesRoutes);
router.use('/external', externalRoutes);

export default router;

