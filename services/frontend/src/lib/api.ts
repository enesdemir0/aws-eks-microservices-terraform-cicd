import type { AuthResponse, Caption, UploadResponse } from './types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ?? data.detail ?? `Request failed: ${res.status}`);
  }

  return data as T;
}

export const auth = {
  register: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request<{ status: string }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<AuthResponse>('/api/auth/me'),
};

export const gateway = {
  upload: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/gateway/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message ?? data.detail ?? 'Upload failed');
    }
    return data as UploadResponse;
  },
};

export const metadata = {
  getUserCaptions: (userId: number) =>
    request<Caption[]>(`/api/metadata/user/${userId}`),
};
