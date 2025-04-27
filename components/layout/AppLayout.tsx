import React from 'react';
import { useTheme } from 'next-themes';
import Navbar from './Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${theme === 'dark' ? 'dark' : ''}`}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main>{children}</main>
      </div>
    </div>
  );
} 