import { environment } from '../../environments/environment';

export const API_CONFIG = {
  baseUrl: environment.production 
    ? (environment as any).apiUrl || 'http://localhost:3000/api' // Set apiUrl in environment.prod.ts
    : 'http://localhost:3000/api'
};
