import { TrackingResponse } from './tracking.dto';
import { logger } from '../config/logger';
import { env } from '../config/env';

/**
 * In-memory cache for SOAP tracking responses.
 * TTL is configurable via SOAP_CACHE_TTL_SECONDS env var.
 */
const cache = new Map<string, { data: TrackingResponse; expiresAt: number }>();

/**
 * Colombian cities used for mock location generation.
 */
const COLOMBIAN_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Ibagué',
  'Cúcuta', 'Villavicencio', 'Pasto', 'Montería', 'Neiva',
  'Armenia', 'Popayán', 'Sincelejo', 'Valledupar', 'Tunja',
];

/**
 * Generate a deterministic but varied mock response based on routeId.
 * Simulates what the real SOAP service would return.
 * @param routeId The route identifier
 * @returns Mock tracking data
 */
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
 * TrackingAdapter abstracts the SOAP tracking service communication.
 * The rest of the system never knows there is SOAP behind this interface.
 * Uses an in-memory cache with configurable TTL.
 *
 * In production, this would make actual SOAP calls.
 * Currently uses a mock that generates deterministic responses.
 */
export const trackRoute = async (routeId: string): Promise<TrackingResponse> => {
  const cached = cache.get(routeId);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    logger.debug({ routeId }, 'Tracking cache hit');
    return cached.data;
  }

  logger.info({ routeId }, 'Fetching tracking data (mock SOAP)');

  // In production, this would be:
  // const soapClient = await createClientAsync(env.SOAP_TRACKING_URL);
  // const [result] = await soapClient.TrackRouteAsync({ routeId });
  const response = generateMockResponse(routeId);

  cache.set(routeId, {
    data: response,
    expiresAt: now + env.SOAP_CACHE_TTL_SECONDS * 1000,
  });

  return response;
};

/**
 * Clear the tracking cache. Useful for testing.
 */
export const clearCache = (): void => {
  cache.clear();
};
