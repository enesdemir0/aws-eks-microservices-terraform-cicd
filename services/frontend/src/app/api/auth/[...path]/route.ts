import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3000';

async function handler(
  request: NextRequest,
  context: { params: { path: string[] } },
) {
  const pathStr = context.params.path.join('/');
  const url = `${AUTH_SERVICE_URL}/api/auth/${pathStr}`;

  const jwtCookie = request.cookies.get('jwt');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwtCookie) {
    headers['Cookie'] = `jwt=${jwtCookie.value}`;
    headers['Authorization'] = `Bearer ${jwtCookie.value}`;
  }

  const fetchOptions: RequestInit = { method: request.method, headers };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = await request.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, fetchOptions);
  } catch {
    return NextResponse.json({ message: 'Auth service unreachable' }, { status: 503 });
  }

  const data = await upstream.json();
  const res = NextResponse.json(data, { status: upstream.status });

  // Forward all Set-Cookie headers (e.g. jwt cookie set/cleared by auth service)
  const setCookies = upstream.headers.getSetCookie?.() ?? [];
  setCookies.forEach((c) => res.headers.append('Set-Cookie', c));

  return res;
}

export const GET = handler;
export const POST = handler;
