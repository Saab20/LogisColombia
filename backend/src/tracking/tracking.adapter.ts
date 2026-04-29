import { TrackingResponse } from './tracking.dto';
import { logger } from '../config/logger';
import { env } from '../config/env';

/** Caché en memoria con TTL configurable para respuestas de tracking. */
const cache = new Map<string, { data: TrackingResponse; expiresAt: number }>();

/** Ciudades colombianas para ubicaciones mock. */
const COLOMBIAN_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Ibagué',
  'Cúcuta', 'Villavicencio', 'Pasto', 'Montería', 'Neiva',
  'Armenia', 'Popayán', 'Sincelejo', 'Valledupar', 'Tunja',
];

/** Genera respuesta mock determinística basada en el routeId. */
const generateMockResponse = (routeId: string): TrackingResponse => {
  const hash = routeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const cityIndex = hash % COLOMBIAN_CITIES.length;
  const progress = Math.min(100, Math.max(5, (hash % 95) + 5));
  const eta = Math.max(10, 600 - progress * 5 + (hash % 60));

  return {
    routeId,
    lastLocation: COLOMBIAN_CITIES[cityIndex],
    progressPercent: progress,
    etaMinutes: eta,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Obtiene datos de tracking para una ruta. Usa caché con TTL.
 * En producción se reemplazaría el mock por la llamada SOAP real.
 */
export const trackRoute = async (routeId: string): Promise<TrackingResponse> => {
  const cached = cache.get(routeId);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    logger.debug({ routeId }, 'Tracking cache hit');
    return cached.data;
  }

  logger.info({ routeId }, 'Fetching tracking data (mock SOAP)');

  const response = generateMockResponse(routeId);

  cache.set(routeId, {
    data: response,
    expiresAt: now + env.SOAP_CACHE_TTL_SECONDS * 1000,
  });

  return response;
};

/** Limpia el caché. Se usa en tests. */
export const clearCache = (): void => {
  cache.clear();
};
