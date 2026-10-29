import axios from 'axios';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';

export interface ExchangeRateResponse {
  source: 'live_external_api' | 'development_mock_fallback';
  base_code: string;
  conversion_rates: Record<string, number>;
  last_updated_utc: string;
}

export class ExternalService {
  /**
   * Fetch exchange rates from an external API using the API key securely retrieved from env.
   * NEVER hardcodes API keys in source code.
   */
  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    const apiKey = env.EXTERNAL_API_KEY;
    const apiUrl = env.EXTERNAL_API_URL;

    // Use mock fallback during testing or if placeholder/mock key is configured
    if (
      !apiKey ||
      apiKey.startsWith('mock_') ||
      apiKey === 'your_external_api_key_here' ||
      env.NODE_ENV === 'test'
    ) {
      return {
        source: 'development_mock_fallback',
        base_code: baseCurrency.toUpperCase(),
        conversion_rates: {
          USD: 1.0,
          EUR: 0.92,
          GBP: 0.79,
          SAR: 3.75,
          AED: 3.67,
          EGP: 48.5
        },
        last_updated_utc: new Date().toUTCString()
      };
    }

    try {
      // Call actual external API with API key from environment variable
      const response = await axios.get(`${apiUrl}/${apiKey}/latest/${baseCurrency.toUpperCase()}`, {
        timeout: 5000
      });

      if (response.data && response.data.result === 'success') {
        return {
          source: 'live_external_api',
          base_code: response.data.base_code,
          conversion_rates: response.data.conversion_rates,
          last_updated_utc: response.data.time_last_update_utc
        };
      }

      return {
        source: 'live_external_api',
        base_code: baseCurrency.toUpperCase(),
        conversion_rates: response.data.conversion_rates || response.data.rates || {},
        last_updated_utc: new Date().toUTCString()
      };
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new AppError(
          `External API error: ${error.response.data?.['error-type'] || error.response.statusText}`,
          502
        );
      }
      throw new AppError('Failed to fetch data from external API service', 502);
    }
  }
}

export const externalService = new ExternalService();
