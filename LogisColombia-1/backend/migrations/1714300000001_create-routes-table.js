/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.createTable('routes', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    origin_city: {
      type: 'varchar(100)',
      notNull: true,
    },
    destination_city: {
      type: 'varchar(100)',
      notNull: true,
    },
    distance_km: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    estimated_time_hours: {
      type: 'numeric(6,2)',
      notNull: true,
    },
    vehicle_type: {
      type: 'varchar(20)',
      notNull: true,
      check: "vehicle_type IN ('CAMION', 'TRACTOMULA', 'FURGONETA', 'MOTO_CARGO')",
    },
    carrier: {
      type: 'varchar(100)',
      notNull: true,
    },
    cost_usd: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: "'ACTIVA'",
      check: "status IN ('ACTIVA', 'INACTIVA', 'SUSPENDIDA', 'EN_MANTENIMIENTO')",
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Indexes on frequently filtered fields
  pgm.createIndex('routes', 'origin_city');
  pgm.createIndex('routes', 'destination_city');
  pgm.createIndex('routes', 'status');
  pgm.createIndex('routes', 'vehicle_type');
  pgm.createIndex('routes', 'carrier');
  pgm.createIndex('routes', 'created_at');
  pgm.createIndex('routes', 'cost_usd');
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.dropTable('routes');
};
