import { useState, useEffect } from 'react';
import { FaBell, FaBellSlash } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import AlertModal from './AlertModal';

interface AlertBellProps {
  assetId: string;
  assetName: string;
  currentPrice: number;
  onAlertChange?: (hasAlerts: boolean) => void;
}

export default function AlertBell({ assetId, assetName, currentPrice, onAlertChange }: AlertBellProps) {
  const { data: session } = useSession();
  const [hasAlerts, setHasAlerts] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (session) {
      checkAlerts();
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
      console.log('Alerts data:', alerts);
      
      if (!Array.isArray(alerts)) {
        console.error('Alerts is not an array:', alerts);
        return;
      }

      const hasActiveAlerts = alerts.some((alert: any) => {
        const alertSymbol = alert.asset_symbol?.toUpperCase();
        const currentSymbol = assetId?.toUpperCase();
        const isMatch = alertSymbol === currentSymbol && alert.is_active;
        console.log('Checking alert:', {
          alertSymbol,
          currentSymbol,
          isActive: alert.is_active,
          isMatch
        });
        return isMatch;
      });
      
      console.log('Setting hasAlerts to:', hasActiveAlerts);
      setHasAlerts(hasActiveAlerts);
      onAlertChange?.(hasActiveAlerts);
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  };

  const toggleAlert = () => {
    if (!session) {
      console.log('User not authenticated');
      return;
    }
    setShowModal(true);
  };

  const handleAlertCreated = () => {
    console.log('Alert created, checking alerts');
    checkAlerts();
  };

  const handleAlertDeactivated = () => {
    console.log('Alert deactivated, checking alerts');
    checkAlerts();
  };

  return (
    <div className="relative">
      <button
        onClick={toggleAlert}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={hasAlerts ? "Manage alert" : "Set alert"}
        disabled={!session}
      >
        {hasAlerts ? (
          <FaBell className="w-5 h-5 text-yellow-500" />
        ) : (
          <FaBellSlash className="w-5 h-5 text-gray-400" />
        )}
      </button>

      <AlertModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        assetId={assetId}
        assetName={assetName}
        currentPrice={currentPrice}
        onAlertCreated={handleAlertCreated}
        onAlertDeactivated={handleAlertDeactivated}
      />
    </div>
  );
} 