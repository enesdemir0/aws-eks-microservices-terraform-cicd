import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3000';
const METADATA_API_URL = process.env.METADATA_API_URL ?? 'http://localhost:8001';

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } },
) {
  const jwtCookie = request.cookies.get('jwt');
  if (!jwtCookie) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Verify the JWT with auth service, then ensure userId matches
  let meRes: Response;
  try {
    meRes = await fetch(`${AUTH_SERVICE_URL}/api/auth/me`, {
      headers: {
        Cookie: `jwt=${jwtCookie.value}`,
        Authorization: `Bearer ${jwtCookie.value}`,
      },
    });
  } catch {
    return NextResponse.json({ message: 'Auth service unreachable' }, { status: 503 });
  }

  if (!meRes.ok) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await meRes.json();
  const authenticatedUserId = String(data.user.id);

  // Prevent accessing another user's captions (IDOR protection)
  if (authenticatedUserId !== context.params.userId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${METADATA_API_URL}/api/metadata/user/${context.params.userId}`,
    );
  } catch {
    return NextResponse.json({ message: 'Metadata service unreachable' }, { status: 503 });
  }

  const captions = await upstream.json();
  return NextResponse.json(captions, { status: upstream.status });
}
