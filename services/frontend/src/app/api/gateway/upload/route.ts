import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_SERVICE_URL = process.env.GATEWAY_SERVICE_URL ?? 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const jwtCookie = request.cookies.get('jwt');
  if (!jwtCookie) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();

  let upstream: Response;
  try {
    upstream = await fetch(`${GATEWAY_SERVICE_URL}/api/gateway/upload`, {
      method: 'POST',
      headers: { Cookie: `jwt=${jwtCookie.value}` },
      body: formData,
    });
  } catch {
    return NextResponse.json({ message: 'Gateway service unreachable' }, { status: 503 });
  }

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
