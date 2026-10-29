import { Request, Response, NextFunction } from 'express';
import { externalService } from '../services/external.service';

export class ExternalController {
  async getExchangeRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const base = (req.query.base as string) || 'USD';
      const data = await externalService.getExchangeRates(base);

      res.status(200).json({
        success: true,
        message: 'External exchange rates fetched successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

export const externalController = new ExternalController();

