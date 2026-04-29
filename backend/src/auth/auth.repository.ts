import { query } from '../config/database';

/** Registro de usuario tal como viene de la BD. */
export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: 'OPERADOR' | 'ADMIN';
  created_at: Date;
}

/** Busca un usuario por username. Retorna null si no existe. */
export const findByUsername = async (username: string): Promise<UserRow | null> => {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

/** Busca un usuario por UUID. Retorna null si no existe. */
export const findById = async (id: string): Promise<UserRow | null> => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/** Inserta un usuario con la contraseña ya hasheada. */
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
