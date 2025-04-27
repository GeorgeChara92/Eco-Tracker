'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import AdminRoute from '@/components/AdminRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <AdminRoute>
        {children}
      </AdminRoute>
    </AppLayout>
  );
} 