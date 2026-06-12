import { apiRequest } from './client';
import { clearAuthSession, saveAuthSession } from './authStorage';
import type { LoginData, LoginRequest, LogoutRequest } from './types';

export async function login(credentials: LoginRequest): Promise<LoginData> {
  const data = await apiRequest<LoginData>('Auth/Login', {
    method: 'POST',
    body: credentials,
    auth: false,
  });

  saveAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt,
    username: credentials.username,
  });

  return data;
}

export async function logout(username: string): Promise<string> {
  const payload: LogoutRequest = { username };

  try {
    return await apiRequest<string>('Auth/Logout', {
      method: 'POST',
      body: payload,
      auth: true,
    });
  } finally {
    clearAuthSession();
  }
}
