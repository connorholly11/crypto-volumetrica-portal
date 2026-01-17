import { requireAuth } from '@/lib/auth';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  // Require authentication
  await requireAuth();
  
  // Render the client component
  return <AdminDashboardClient />;
}