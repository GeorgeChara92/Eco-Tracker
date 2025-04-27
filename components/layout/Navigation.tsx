'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaChartLine, FaUser, FaCog } from 'react-icons/fa';
import { useEffect } from 'react';

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Debug session data
  useEffect(() => {
    console.log('=== Navigation Debug ===');
    console.log('Session Status:', status);
    console.log('Session Data:', session);
    console.log('User Role:', session?.user?.role);
    console.log('Is Admin:', session?.user?.role === 'admin');
    console.log('Nav Items:', [
      { href: '/', label: 'Home', icon: 'FaHome' },
      { href: '/dashboard', label: 'Dashboard', icon: 'FaChartLine' },
      ...(session?.user?.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: 'FaCog' }] : []),
    ]);
    console.log('=====================');
  }, [session, status]);

  const isAdmin = session?.user?.role === 'admin';

  const navItems = [
    { href: '/', label: 'Home', icon: FaHome },
    { href: '/dashboard', label: 'Dashboard', icon: FaChartLine },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: FaCog }] : []),
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-300">
                  {session.user?.name}
                </span>
                <Link
                  href="/auth/signout"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <FaUser className="mr-2" />
                  Sign Out
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <FaUser className="mr-2" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 