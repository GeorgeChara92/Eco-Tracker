import { useState, useEffect } from 'react';
import { FaBell, FaBellSlash } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import AlertModal from './AlertModal';

interface AlertBellProps {
  assetId: string;
  assetName: string;
  currentPrice: number;
  onAlertChange?: (hasAlerts: boolean) => void;
}

export default function AlertBell({ assetId, assetName, currentPrice, onAlertChange }: AlertBellProps) {
  const [hasAlerts, setHasAlerts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkAlerts();
  }, [assetId]);

  const checkAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_id', assetId)
        .eq('is_active', true);

      if (error) throw error;

      const hasActiveAlerts = alerts && alerts.length > 0;
      setHasAlerts(hasActiveAlerts);
      onAlertChange?.(hasActiveAlerts);
    } catch (error) {
      console.error('Error checking alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = async () => {
    if (hasAlerts) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('alerts')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('asset_id', assetId);

        if (error) throw error;
        setHasAlerts(false);
        onAlertChange?.(false);
      } catch (error) {
        console.error('Error toggling alert:', error);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleAlertCreated = () => {
    setHasAlerts(true);
    onAlertChange?.(true);
  };

  if (loading) {
    return <div className="w-6 h-6 animate-pulse bg-gray-200 rounded-full" />;
  }

  return (
    <>
      <button
        onClick={toggleAlert}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={hasAlerts ? "Remove alert" : "Set alert"}
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
      />
    </>
  );
} 