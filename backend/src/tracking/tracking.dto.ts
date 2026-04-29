export interface TrackingRequest {
  routeId: string;
}

export interface TrackingResponse {
  routeId: string;
  lastLocation: string;
  progressPercent: number;
  etaMinutes: number;
  timestamp: string;
}
