import { requireAuth } from '@/lib/auth';
import TraderDashboardClient from './TraderDashboardClient';

export default async function TraderDashboard({ params }: { params: { userId: string } }) {
  // Require authentication
  await requireAuth();
  
  // Pass the userId to the client component
  return <TraderDashboardClient userId={params.userId} />;
}