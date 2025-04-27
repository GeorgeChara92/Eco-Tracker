'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router, mounted]);

  // Don't render anything until the component is mounted
  if (!mounted) {
    return null;
  }

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render anything if session is not available or user is not admin
  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  // Render children only when we have a valid admin session
  return <>{children}</>;
}
