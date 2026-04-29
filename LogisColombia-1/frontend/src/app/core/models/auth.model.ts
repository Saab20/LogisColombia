export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: 'OPERADOR' | 'ADMIN';
  };
}

export interface User {
  id: string;
  username: string;
  role: 'OPERADOR' | 'ADMIN';
}
