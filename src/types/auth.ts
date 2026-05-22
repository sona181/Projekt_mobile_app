export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  role: 'student' | 'instructor';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  profile?: {
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    country?: string;
    timezone?: string;
  };
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
