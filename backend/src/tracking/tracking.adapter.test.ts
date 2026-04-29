import { trackRoute, clearCache } from './tracking.adapter';

describe('trackRoute', () => {
  beforeEach(() => clearCache());

  it('should return tracking data with all required fields', async () => {
    // When
    const result = await trackRoute('route-abc');

    // Then
    expect(result.routeId).toBe('route-abc');
    expect(result.lastLocation).toBeDefined();
    expect(typeof result.progressPercent).toBe('number');
    expect(result.progressPercent).toBeGreaterThanOrEqual(5);
    expect(result.progressPercent).toBeLessThanOrEqual(100);
    expect(typeof result.etaMinutes).toBe('number');
    expect(result.etaMinutes).toBeGreaterThanOrEqual(10);
    expect(result.timestamp).toBeDefined();
  });

  it('should return deterministic results for the same routeId', async () => {
    // When
    const first = await trackRoute('route-xyz');
    clearCache();
    const second = await trackRoute('route-xyz');

    // Then
    expect(first.lastLocation).toBe(second.lastLocation);
    expect(first.progressPercent).toBe(second.progressPercent);
  });

  it('should return different results for different routeIds', async () => {
    // When
    const a = await trackRoute('route-aaa');
    const b = await trackRoute('route-zzz');

    // Then — at least one field should differ
    const isDifferent =
      a.lastLocation !== b.lastLocation ||
      a.progressPercent !== b.progressPercent ||
      a.etaMinutes !== b.etaMinutes;
    expect(isDifferent).toBe(true);
  });

  it('should return cached data on second call within TTL', async () => {
    // Given
    const first = await trackRoute('route-cache');

    // When — immediate second call
    const second = await trackRoute('route-cache');

    // Then — same timestamp means it was cached
    expect(second.timestamp).toBe(first.timestamp);
  });
});

describe('clearCache', () => {
  it('should clear the cache so next call generates fresh data', async () => {
    // Given
    const first = await trackRoute('route-clear');

    // When
    clearCache();
    // Small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 10));
    const second = await trackRoute('route-clear');

    // Then — timestamp should be different after cache clear
    expect(second.timestamp).not.toBe(first.timestamp);
  });
});
