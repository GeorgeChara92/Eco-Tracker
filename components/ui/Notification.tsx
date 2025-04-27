import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Notification({ message, type, onClose, duration = 5000 }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900';
  const textColor = type === 'success' ? 'text-green-800 dark:text-green-100' : 'text-red-800 dark:text-red-100';
  const borderColor = type === 'success' ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800';
  const Icon = type === 'success' ? FaCheckCircle : FaExclamationCircle;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 shadow-lg max-w-md`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${textColor}`} />
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${textColor}`}>{message}</p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'success'
                    ? 'text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50 dark:hover:bg-green-800'
                    : 'text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50 dark:hover:bg-red-800'
                }`}
              >
                <span className="sr-only">Dismiss</span>
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 