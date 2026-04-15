export interface User {
  userId: number;
  fullName: string;
  email: string;
  currency: string;
  timezone: string;
  avatarUrl: string;
  bio: string;
  role: string;
  monthlyBudget: number;
  active: boolean;
}

export interface AuthResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}