'use client';

import React from 'react';
import NavBar from '../../components/ui/NavBar';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <NavBar />
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
};

export default AppLayout; 