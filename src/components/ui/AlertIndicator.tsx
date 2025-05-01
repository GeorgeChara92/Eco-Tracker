import { useState, useEffect } from 'react';
import { FaBell, FaBellSlash } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

interface AlertIndicatorProps {
  assetId: string;
  onAlertChange?: (hasAlerts: boolean) => void;
}

export default function AlertIndicator({ assetId, onAlertChange }: AlertIndicatorProps) {
  const { data: session } = useSession();
  const [hasAlerts, setHasAlerts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      checkAlerts();
    } else {
      setHasAlerts(false);
      setLoading(false);
    }
  }, [assetId, session]);

  const checkAlerts = async () => {
    try {
      const response = await fetch('/api/alerts', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const alerts = await response.json();
      
      if (!Array.isArray(alerts)) {
        console.error('Alerts is not an array:', alerts);
        return;
      }

      const hasActiveAlerts = alerts.some((alert: any) => {
        const alertSymbol = alert.asset_symbol?.toUpperCase();
        const currentSymbol = assetId?.toUpperCase();
        return alertSymbol === currentSymbol && alert.is_active;
      });
      
      console.log('AlertIndicator - hasActiveAlerts:', hasActiveAlerts);
      setHasAlerts(hasActiveAlerts);
      onAlertChange?.(hasActiveAlerts);
    } catch (error) {
      console.error('Error checking alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="w-6 h-6 animate-pulse bg-gray-200 rounded-full" />;
  }

  return (
    <div className="relative">
      {hasAlerts ? (
        <FaBell 
          className="text-yellow-500"
          style={{ 
            width: '20px',
            height: '20px',
            color: '#FFD700'
          }} 
        />
      ) : (
        <FaBellSlash 
          className="text-gray-400"
          style={{ 
            width: '20px',
            height: '20px',
            color: '#9CA3AF'
          }} 
        />
      )}
    </div>
  );
} 