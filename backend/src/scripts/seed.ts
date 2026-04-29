import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcrypt';
import { pool, query } from '../config/database';
import { logger } from '../config/logger';

const BCRYPT_COST_FACTOR = 12;

interface CsvRow {
  id: string;
  origin_city: string;
  destination_city: string;
  distance_km: string;
  estimated_time_hours: string;
  vehicle_type: string;
  carrier: string;
  cost_usd: string;
  status: string;
  created_at: string;
}

/**
 * Seed the database with initial users and routes from the CSV dataset.
 */
const seed = async (): Promise<void> => {
  try {
    logger.info('Starting database seed...');

    // Create default users
    const adminHash = await bcrypt.hash('admin123', BCRYPT_COST_FACTOR);
    const operadorHash = await bcrypt.hash('operador123', BCRYPT_COST_FACTOR);

    await query(
      `INSERT INTO users (username, password_hash, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (username) DO NOTHING`,
      ['admin', adminHash, 'ADMIN']
    );

    await query(
      `INSERT INTO users (username, password_hash, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (username) DO NOTHING`,
      ['operador', operadorHash, 'OPERADOR']
    );

    logger.info('Default users created (admin/admin123, operador/operador123)');

    // Load CSV dataset
    const csvPath = path.resolve(__dirname, '../../routes_dataset.csv');
    if (!fs.existsSync(csvPath)) {
      logger.warn('routes_dataset.csv not found, skipping route seed');
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records: CsvRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    logger.info({ count: records.length }, 'Parsed CSV records');

    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        await query(
          `INSERT INTO routes (origin_city, destination_city, distance_km, estimated_time_hours, vehicle_type, carrier, cost_usd, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            record.origin_city,
            record.destination_city,
            Number(record.distance_km),
            Number(record.estimated_time_hours),
            record.vehicle_type,
            record.carrier,
            Number(record.cost_usd),
            record.status,
            record.created_at,
          ]
        );
        imported++;
      } catch (error) {
        skipped++;
        logger.warn({ record, error }, 'Failed to import route');
      }
    }

    logger.info({ imported, skipped }, 'Route seed completed');
  } catch (error) {
    logger.error({ error }, 'Seed failed');
    throw error;
  } finally {
    await pool.end();
  }
};

seed()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
