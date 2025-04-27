'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { FaUsers, FaChartLine, FaCog, FaDatabase, FaHistory, FaShieldAlt } from 'react-icons/fa';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdminFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('=== Admin Page Check ===');
      console.log('Session Status:', status);
      console.log('Session Data:', session);

      if (status === 'loading') {
        console.log('Session is still loading...');
        return;
      }

      if (!session?.user?.email) {
        console.log('No session or user email found');
        router.push('/auth/signin');
        return;
      }

      try {
        console.log('Fetching user profile from Supabase...');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        console.log('Profile Data:', profile);
        console.log('Profile Error:', error);

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        const userIsAdmin = profile?.role === 'admin';
        console.log('Is Admin:', userIsAdmin);
        
        setIsAdmin(userIsAdmin);
        
        if (!userIsAdmin) {
          console.log('User is not an admin, redirecting to dashboard...');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [session, status, router]);

  if (loading) {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking admin access...</p>
        </div>
          </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-4 text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
  );
  }

  const adminFeatures: AdminFeature[] = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: <FaUsers className="h-6 w-6" />,
      href: '/admin/users',
    },
    {
      title: 'Analytics',
      description: 'View system usage statistics and reports',
      icon: <FaChartLine className="h-6 w-6" />,
      href: '/admin/analytics',
    },
    {
      title: 'System Settings',
      description: 'Configure application settings and preferences',
      icon: <FaCog className="h-6 w-6" />,
      href: '/admin/settings',
    },
    {
      title: 'Database Management',
      description: 'Manage database tables and data',
      icon: <FaDatabase className="h-6 w-6" />,
      href: '/admin/database',
    },
    {
      title: 'Activity Logs',
      description: 'View system activity and audit logs',
      icon: <FaHistory className="h-6 w-6" />,
      href: '/admin/logs',
    },
    {
      title: 'Security',
      description: 'Manage security settings and access controls',
      icon: <FaShieldAlt className="h-6 w-6" />,
      href: '/admin/security',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature, index) => (
            <a
              key={index}
              href={feature.href}
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                  {feature.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 