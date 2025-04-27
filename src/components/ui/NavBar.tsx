'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NavItem {
  name: string;
  path: string;
  icon?: IconType;
}

const NavBar = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set admin status based on session role
  useEffect(() => {
    console.log('=== NavBar Session Debug ===');
    console.log('Session Status:', status);
    console.log('Session Data:', session);
    
    if (status === 'loading') {
      console.log('Session still loading...');
      return;
    }

    if (!session?.user) {
      console.log('No session found');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const adminStatus = session.user.role === 'admin';
    console.log('Setting admin status to:', adminStatus);
    setIsAdmin(adminStatus);
    setLoading(false);
  }, [session, status]);

  // Base navigation items
  const baseNavItems: NavItem[] = [
    { name: 'Home', path: '/' },
    { name: 'Markets', path: '/market' },
    { name: 'News', path: '/news' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Pricing', path: '/#pricing' },
  ];

  // Add admin item if user is admin
  const adminItem: NavItem[] = isAdmin ? [{ name: 'Admin', path: '/admin', icon: FaCog }] : [];
  const navItems = [...baseNavItems, ...adminItem];

  // Debug navigation items
  useEffect(() => {
    console.log('=== NavBar Navigation Items ===');
    console.log('Is Admin:', isAdmin);
    console.log('Admin Item:', adminItem);
    console.log('All Nav Items:', navItems);
  }, [isAdmin, adminItem, navItems]);

  const isActivePath = (path: string) => {
    if (path === '/') return pathname === path;
    return pathname?.startsWith(path);
  };

  const renderThemeChanger = () => {
    if (typeof window === 'undefined') return null;
    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
      >
        {theme === 'dark' ? '🌞' : '🌙'}
      </button>
    );
  };

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-400 text-transparent bg-clip-text">
                  EcoTracker
                </span>
              </motion.div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  isActivePath(item.path)
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {item.icon ? (
                  <span className="flex items-center">
                    <item.icon className="mr-1" />
                {item.name}
                  </span>
                ) : (
                  item.name
                )}
                {isActivePath(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
            {renderThemeChanger()}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <FaUser className="h-5 w-5" />
                  <span className="hidden sm:inline">
                    {session.user?.name || session.user?.email}
                    {isAdmin && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Admin
                      </span>
                    )}
                  </span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FaCog className="mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => signOut()}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        <FaSignOutAlt className="mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="sm:hidden"
        initial={false}
        animate={isMobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-800">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActivePath(item.path)
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.icon ? (
                <span className="flex items-center">
                  <item.icon className="mr-2" />
              {item.name}
                </span>
              ) : (
                item.name
              )}
            </Link>
          ))}
          {session ? (
            <>
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {session.user?.name || session.user?.email}
                {isAdmin && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    Admin
                  </span>
                )}
              </div>
            <button
                onClick={() => signOut()}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FaSignOutAlt className="mr-2" />
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign in
            </Link>
          )}
        </div>
      </motion.div>
    </nav>
  );
};

export default NavBar; 