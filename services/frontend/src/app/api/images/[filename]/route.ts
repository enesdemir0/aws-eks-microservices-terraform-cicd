import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_SERVICE_URL = process.env.GATEWAY_SERVICE_URL ?? 'http://localhost:8000';

// Proxy image files from gateway uploads directory
export async function GET(
  request: NextRequest,
  context: { params: { filename: string } },
) {
  const jwtCookie = request.cookies.get('jwt');
  if (!jwtCookie) {
    return new NextResponse(null, { status: 401 });
  }

  const { filename } = context.params;
  // Sanitize: only allow alphanumeric, hyphens, underscores, dots
  if (!/^[\w.-]+$/.test(filename)) {
    return new NextResponse(null, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${GATEWAY_SERVICE_URL}/uploads/${filename}`);
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
  const buffer = await upstream.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
