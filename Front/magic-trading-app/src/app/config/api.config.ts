import { environment } from '../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.production 
    ? 'https://your-production-api.com/api'
    : 'http://localhost:3000/api'
};
