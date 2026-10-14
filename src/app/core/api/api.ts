import { environment } from '../../../environments/environment';

/** URL base del backend VisionLab-API (sin "/" final). */
export const API_URL = environment.apiUrl.replace(/\/$/, '');
