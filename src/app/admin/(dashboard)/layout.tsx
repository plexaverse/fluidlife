import Navbar from '@/components/navbar'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Await cookies because of Next.js 15+ server components architecture
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;

  if (!adminToken) {
    redirect('/admin/login');
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};
