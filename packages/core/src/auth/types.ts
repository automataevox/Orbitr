export interface User {
  id: string;
  email: string;
  username: string;
  role: "admin" | "user";
  createdAt: Date;
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
  userId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}
