import React from 'react';
import { FaSync } from 'react-icons/fa';

interface RefreshNotificationProps {
  lastUpdated: Date;
}

export default function RefreshNotification({ lastUpdated }: RefreshNotificationProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <FaSync className="w-4 h-4 animate-spin" />
      <span>Last updated: {formatTime(lastUpdated)}</span>
    </div>
  );
} 