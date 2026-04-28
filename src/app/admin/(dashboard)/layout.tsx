import Navbar from '@/components/navbar'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminSession, ADMIN_COOKIE } from '@/lib/session'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const session = token ? await adminSession.verify(token) : null;

  if (!session || session.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};
