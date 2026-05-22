import { api } from './api';
import type { LoginPayload, LoginResponse, RegisterPayload, RegisterResponse } from '../types/auth';

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<RegisterResponse>('/auth/register', payload).then((r) => r.data),

  logout: () => api.post('/auth/logout').catch(() => {}),

  me: () => api.get<LoginResponse['user']>('/auth/me').then((r) => r.data),
};
