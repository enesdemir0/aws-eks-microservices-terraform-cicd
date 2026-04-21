import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { AuthResponse } from '@/lib/types';

async function getUser() {
  const cookieStore = cookies();
  const jwt = cookieStore.get('jwt');
  if (!jwt) return null;

  const authUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${authUrl}/api/auth/me`, {
      headers: {
        Cookie: `jwt=${jwt.value}`,
        Authorization: `Bearer ${jwt.value}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data: AuthResponse = await res.json();
    return data.data.user;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
