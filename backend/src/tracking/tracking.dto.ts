/** Petición de tracking (uso interno). */
export interface TrackingRequest {
  routeId: string;
}

/** Respuesta de tracking que se devuelve al cliente. */
export interface TrackingResponse {
  routeId: string;
  lastLocation: string;
  progressPercent: number;
  etaMinutes: number;
  timestamp: string;
}
