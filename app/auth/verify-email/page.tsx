'use client';

import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <div className={`flex min-h-screen items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} px-4 py-12 sm:px-6 lg:px-8`}>
      <div className={`w-full max-w-md rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-8 shadow-md`}>
        <div className="space-y-4 text-center">
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Verify Your Email
          </h2>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            We've sent a verification link to your email address
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className={`rounded-full ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'} p-3`}>
              <Mail className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Please check your email and click the verification link to activate your account.
              If you don't see the email, check your spam folder.
            </p>
            <button
              onClick={() => router.push('/auth/signin')}
              className={`rounded-md px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                theme === 'dark' 
                  ? 'border border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 