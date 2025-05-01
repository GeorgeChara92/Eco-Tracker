import React from 'react';
import { FaBell, FaBellSlash } from 'react-icons/fa';

interface AlertBellProps {
  hasActiveAlerts: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function AlertBell({ hasActiveAlerts, onClick, className = '' }: AlertBellProps) {
  console.log('AlertBell render - hasActiveAlerts:', hasActiveAlerts);
  
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      title={hasActiveAlerts ? "Manage alert" : "Set alert"}
    >
      {hasActiveAlerts ? (
        <FaBell 
          className="w-5 h-5" 
          style={{ 
            color: '#FFD700',
            filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))'
          }} 
        />
      ) : (
        <FaBellSlash className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );
} 