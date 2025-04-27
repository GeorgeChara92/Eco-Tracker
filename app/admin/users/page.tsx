'use client';

import { useState, useEffect } from 'react';
import { FaTrash, FaUser, FaKey, FaEdit, FaUserSlash, FaUserCheck, FaBan, FaArrowLeft } from 'react-icons/fa';
import Notification from '@/components/ui/Notification';
import Link from 'next/link';
import { supabase, supabaseAdmin } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | undefined;
  status: 'active' | 'inactive' | 'banned';
}

interface Profile {
  id: string;
  role: string;
  [key: string]: any;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
    fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      
      // Get all profiles with only existing columns
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, created_at');

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        throw profilesError;
      }

      if (!profiles) {
        throw new Error('No users found');
      }

      // Transform the data into the User interface
      const combinedUsers = profiles.map((profile) => ({
        id: profile.id,
        email: profile.email,
        role: profile.role || 'user',
        created_at: profile.created_at,
        last_sign_in_at: undefined,
        status: 'active' as const // Type assertion to match the User interface
      }));

      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== userId));
      setSuccessMessage('User deleted successfully');
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'banned' })
        .eq('id', userId);
      
      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: 'banned' as const } : user
      ));
      setSuccessMessage('User banned successfully');
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: 'active' } : user
      ));
      setSuccessMessage('User unbanned successfully');
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      console.log('Starting role update...', { userId, newRole });
      
      // First verify the user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching user:', fetchError);
        throw fetchError;
      }

      if (!existingUser) {
        throw new Error('User not found');
      }

      console.log('Current user data:', existingUser);

      // Update the role using a direct SQL query
      const { error: updateError } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: newRole
      });

      if (updateError) {
        console.error('Error updating role:', updateError);
        throw updateError;
      }

      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setSuccessMessage('User role updated successfully');
      setShowSuccess(true);
    } catch (err) {
      console.error('Error in handleUpdateRole:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email
      });
      
      if (error) throw error;

      setSuccessMessage('Password reset email sent successfully');
      setShowSuccess(true);
      setShowPasswordResetModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center">
            <Link 
              href="/admin" 
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 mr-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            User Management
          </h1>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <FaUser className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.email.split('@')[0]}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : user.status === 'banned'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                          {user.status}
                        </span>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                          <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordResetModal(true);
                          }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Reset Password"
                          >
                          <FaKey className="h-4 w-4" />
                          </button>
                        {user.status === 'banned' ? (
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Unban User"
                            >
                            <FaUserCheck className="h-4 w-4" />
                            </button>
                          ) : (
                          <button
                            onClick={() => handleBanUser(user.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Ban User"
                          >
                            <FaBan className="h-4 w-4" />
                          </button>
                        )}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete User"
                      >
                          <FaTrash className="h-4 w-4" />
                      </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">No users found matching your criteria</p>
              </div>
            )}
        </div>

        {showPasswordResetModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium mb-4">Reset Password</h3>
              <p className="mb-4">
                Are you sure you want to send a password reset email to {selectedUser.email}?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowPasswordResetModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetPassword(selectedUser.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Send Reset Email
                </button>
              </div>
            </div>
          </div>
        )}

      {showSuccess && (
        <Notification
          message={successMessage}
          type="success"
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
    </div>
  );
} 