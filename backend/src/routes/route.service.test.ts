import { NotFoundError, BadRequestError } from '../shared/errors/app-error';

jest.mock('./route.repository');
import * as routeRepository from './route.repository';
import * as routeService from './route.service';
import { RouteRow } from './route.repository';

const mockRepo = routeRepository as jest.Mocked<typeof routeRepository>;

const now = new Date();
const mockRow: RouteRow = {
  id: 'route-1',
  origin_city: 'Bogotá',
  destination_city: 'Medellín',
  distance_km: 415,
  estimated_time_hours: 8.5,
  vehicle_type: 'TRACTOMULA',
  carrier: 'TransColombia',
  cost_usd: 1250,
  status: 'ACTIVA',
  is_active: true,
  created_at: now,
  updated_at: now,
};

describe('routeService.findById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return formatted route when found', async () => {
    // Given
    mockRepo.findById.mockResolvedValue(mockRow);

    // When
    const result = await routeService.findById('route-1');

    // Then
    expect(result.id).toBe('route-1');
    expect(result.originCity).toBe('Bogotá');
    expect(result.distanceKm).toBe(415);
    expect(result.createdAt).toBe(now.toISOString());
  });

  it('should throw NotFoundError when route does not exist', async () => {
    // Given
    mockRepo.findById.mockResolvedValue(null);

    // When / Then
    await expect(routeService.findById('nonexistent')).rejects.toThrow(NotFoundError);
  });
});

describe('routeService.findAll', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return paginated response', async () => {
    // Given
    mockRepo.findAll.mockResolvedValue({ rows: [mockRow], total: 1 });

    // When
    const result = await routeService.findAll({
      page: 1, limit: 20, sortBy: 'created_at', sortOrder: 'DESC',
    });

    // Then
    expect(result.data).toHaveLength(1);
    expect(result.data[0].originCity).toBe('Bogotá');
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('should calculate totalPages correctly', async () => {
    // Given
    mockRepo.findAll.mockResolvedValue({ rows: [], total: 45 });

    // When
    const result = await routeService.findAll({
      page: 1, limit: 20, sortBy: 'created_at', sortOrder: 'DESC',
    });

    // Then
    expect(result.pagination.totalPages).toBe(3); // ceil(45/20)
  });
});

describe('routeService.create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create and return formatted route', async () => {
    // Given
    mockRepo.create.mockResolvedValue(mockRow);

    // When
    const result = await routeService.create({
      originCity: 'Bogotá', destinationCity: 'Medellín',
      distanceKm: 415, estimatedTimeHours: 8.5,
      vehicleType: 'TRACTOMULA', carrier: 'TransColombia',
      costUsd: 1250, status: 'ACTIVA',
    });

    // Then
    expect(result.id).toBe('route-1');
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });
});

describe('routeService.update', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update and return formatted route', async () => {
    // Given
    mockRepo.findById.mockResolvedValue(mockRow);
    mockRepo.update.mockResolvedValue({ ...mockRow, cost_usd: 2000 });

    // When
    const result = await routeService.update('route-1', { costUsd: 2000 });

    // Then
    expect(result.costUsd).toBe(2000);
  });

  it('should throw NotFoundError when route does not exist', async () => {
    // Given
    mockRepo.findById.mockResolvedValue(null);

    // When / Then
    await expect(routeService.update('nonexistent', { costUsd: 2000 }))
      .rejects.toThrow(NotFoundError);
  });
});

describe('routeService.softDelete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should soft delete and return deactivated route', async () => {
    // Given
    mockRepo.findById.mockResolvedValue(mockRow);
    mockRepo.softDelete.mockResolvedValue({ ...mockRow, is_active: false, status: 'INACTIVA' });

    // When
    const result = await routeService.softDelete('route-1');

    // Then
    expect(result.status).toBe('INACTIVA');
    expect(result.isActive).toBe(false);
  });

  it('should throw NotFoundError when route does not exist', async () => {
    // Given
    mockRepo.findById.mockResolvedValue(null);

    // When / Then
    await expect(routeService.softDelete('nonexistent')).rejects.toThrow(NotFoundError);
  });
});

describe('routeService.importFromCsv', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should import valid CSV rows', async () => {
    // Given
    mockRepo.create.mockResolvedValue(mockRow);
    const csv = Buffer.from(
      'origin_city,destination_city,distance_km,estimated_time_hours,vehicle_type,carrier,cost_usd,status\n' +
      'Bogotá,Medellín,415,8.5,TRACTOMULA,TransColombia,1250,ACTIVA\n'
    );

    // When
    const result = await routeService.importFromCsv(csv);

    // Then
    expect(result.imported).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should report failed rows without stopping', async () => {
    // Given
    mockRepo.create.mockResolvedValue(mockRow);
    const csv = Buffer.from(
      'origin_city,destination_city,distance_km,estimated_time_hours,vehicle_type,carrier,cost_usd,status\n' +
      'Bogotá,Medellín,415,8.5,TRACTOMULA,TransColombia,1250,ACTIVA\n' +
      'A,,bad,bad,INVALID,X,0,BAD\n'
    );

    // When
    const result = await routeService.importFromCsv(csv);

    // Then
    expect(result.imported).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0].row).toBe(3);
  });

  it('should throw BadRequestError on empty CSV', async () => {
    // Given
    const csv = Buffer.from('origin_city,destination_city\n');

    // When / Then
    await expect(routeService.importFromCsv(csv)).rejects.toThrow(BadRequestError);
  });
});

describe('routeService.getStatsByStatus', () => {
  it('should delegate to repository', async () => {
    // Given
    const stats = [{ status: 'ACTIVA', count: 50 }];
    mockRepo.getStatsByStatus.mockResolvedValue(stats);

    // When
    const result = await routeService.getStatsByStatus();

    // Then
    expect(result).toEqual(stats);
  });
});

describe('routeService.getTopByCost', () => {
  it('should return formatted routes', async () => {
    // Given
    mockRepo.getTopByCost.mockResolvedValue([mockRow]);

    // When
    const result = await routeService.getTopByCost();

    // Then
    expect(result).toHaveLength(1);
    expect(result[0].originCity).toBe('Bogotá');
    expect(mockRepo.getTopByCost).toHaveBeenCalledWith(5);
  });
});
