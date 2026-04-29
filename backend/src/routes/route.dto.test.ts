import { createRouteSchema, updateRouteSchema, routeFilterSchema } from './route.dto';

describe('createRouteSchema', () => {
  const validRoute = {
    originCity: 'Bogotá',
    destinationCity: 'Medellín',
    distanceKm: 415,
    estimatedTimeHours: 8.5,
    vehicleType: 'TRACTOMULA',
    carrier: 'TransColombia S.A.',
    costUsd: 1250,
    status: 'ACTIVA',
  };

  it('should validate a correct route', () => {
    const result = createRouteSchema.safeParse(validRoute);
    expect(result.success).toBe(true);
  });

  it('should default status to ACTIVA', () => {
    const { status, ...withoutStatus } = validRoute;
    const result = createRouteSchema.parse(withoutStatus);
    expect(result.status).toBe('ACTIVA');
  });

  it('should reject invalid vehicleType', () => {
    const result = createRouteSchema.safeParse({ ...validRoute, vehicleType: 'BICICLETA' });
    expect(result.success).toBe(false);
  });

  it('should reject negative distanceKm', () => {
    const result = createRouteSchema.safeParse({ ...validRoute, distanceKm: -10 });
    expect(result.success).toBe(false);
  });

  it('should reject zero costUsd', () => {
    const result = createRouteSchema.safeParse({ ...validRoute, costUsd: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject originCity shorter than 2 chars', () => {
    const result = createRouteSchema.safeParse({ ...validRoute, originCity: 'A' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid vehicle types', () => {
    for (const type of ['CAMION', 'TRACTOMULA', 'FURGONETA', 'MOTO_CARGO']) {
      const result = createRouteSchema.safeParse({ ...validRoute, vehicleType: type });
      expect(result.success).toBe(true);
    }
  });

  it('should accept all valid statuses', () => {
    for (const status of ['ACTIVA', 'INACTIVA', 'SUSPENDIDA', 'EN_MANTENIMIENTO']) {
      const result = createRouteSchema.safeParse({ ...validRoute, status });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateRouteSchema', () => {
  it('should allow partial updates', () => {
    const result = updateRouteSchema.safeParse({ costUsd: 2000 });
    expect(result.success).toBe(true);
  });

  it('should allow empty object', () => {
    const result = updateRouteSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('routeFilterSchema', () => {
  it('should provide defaults for pagination', () => {
    const result = routeFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortBy).toBe('created_at');
    expect(result.sortOrder).toBe('DESC');
  });

  it('should coerce string numbers to numbers', () => {
    const result = routeFilterSchema.parse({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('should reject limit over 100', () => {
    const result = routeFilterSchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });
});
