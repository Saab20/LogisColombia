import { query } from '../config/database';

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: 'OPERADOR' | 'ADMIN';
  created_at: Date;
}

/**
 * Find a user by username.
 * @param username The username to search for
 * @returns The user row or null if not found
 */
export const findByUsername = async (username: string): Promise<UserRow | null> => {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

/**
 * Find a user by ID.
 * @param id The user UUID
 * @returns The user row or null if not found
 */
export const findById = async (id: string): Promise<UserRow | null> => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Create a new user in the database.
 * @param username The username
 * @param passwordHash The bcrypt-hashed password
 * @param role The user role (OPERADOR or ADMIN)
 * @returns The created user row
 */
export const createUser = async (
  username: string,
  passwordHash: string,
  role: 'OPERADOR' | 'ADMIN'
): Promise<UserRow> => {
  const result = await query(
    'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
    [username, passwordHash, role]
  );
  return result.rows[0];
};
