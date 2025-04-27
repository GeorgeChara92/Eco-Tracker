import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), []);

  const navItems = [
    { href: '/market', label: 'Market' },
    { href: '/news', label: 'News' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0"
            >
              <Link href="/" className="text-xl font-bold text-emerald-600 dark:text-blue-400 transition-colors duration-300 hover:text-emerald-700 dark:hover:text-blue-500">
                EcoTracker
              </Link>
            </motion.div>
            <div className="hidden sm:ml-8 sm:flex sm:items-center sm:space-x-4">
              {navItems.map((item) => (
                <motion.div
                  key={item.href}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <Link 
                    href={item.href}
                    className={`relative px-3 py-2 text-sm font-medium transition-colors duration-300
                      ${pathname === item.href 
                        ? 'text-emerald-600 dark:text-blue-400' 
                        : 'text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-blue-400'
                      }`}
                  >
                    {item.label}
                    {pathname === item.href && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-blue-400"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-300"
              aria-label="Toggle theme"
            >
              {mounted && (theme === 'dark' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ))}
            </motion.button>
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  {session.user?.email}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signOut()}
                  className="bg-emerald-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Sign Out
                </motion.button>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/auth/signin"
                  className="bg-emerald-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Sign In
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
} 