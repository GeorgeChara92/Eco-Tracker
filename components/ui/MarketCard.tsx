import React, { useEffect, useRef, useState } from 'react';
import { MarketData } from '@/lib/yahoo-finance';
import { FaArrowUp, FaArrowDown, FaTimes, FaLock, FaBell, FaTrash, FaEdit, FaPlus } from 'react-icons/fa';
import AlertBell from './AlertBell';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Alert {
  id: string;
  asset_symbol: string;
  alert_type: 'price' | 'percentage';
  condition: 'above' | 'below';
  value: number;
  is_active: boolean;
}

interface MarketCardProps {
  data: MarketData;
  onClick: () => void;
}

const getTypeColor = (type: MarketData['type']) => {
  switch (type) {
    case 'stock':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'index':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'commodity':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'crypto':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'forex':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'fund':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const formatNumber = (value: number | undefined, options: Intl.NumberFormatOptions = {}) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
};

const formatPrice = (value: number | undefined) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatChange = (value: number | undefined) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    signDisplay: 'always',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const AnimatedPrice = ({ value, duration = 500 }: { value: number | undefined, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const countRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (value === undefined) return;

    // Clear any existing interval
    if (countRef.current) {
      clearInterval(countRef.current);
    }

    const start = displayValue;
    const end = value;
    const steps = 20; // Number of steps in the animation
    const stepValue = (end - start) / steps;
    const stepDuration = duration / steps;

    countRef.current = setInterval(() => {
      setDisplayValue(prev => {
        const next = prev + stepValue;
        if ((stepValue >= 0 && next >= end) || (stepValue < 0 && next <= end)) {
          clearInterval(countRef.current);
          return end;
        }
        return next;
      });
    }, stepDuration);

    return () => {
      if (countRef.current) {
        clearInterval(countRef.current);
      }
    };
  }, [value, duration]);

  return <span className="tabular-nums">{formatPrice(displayValue)}</span>;
};

export default function MarketCard({ data, onClick }: MarketCardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hasActiveAlerts, setHasActiveAlerts] = useState(false);
  const [alertType, setAlertType] = useState<'price' | 'percentage'>('price');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertValue, setAlertValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const isPositive = (data.change || 0) >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const bgColor = isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

  // Debug log session status
  useEffect(() => {
    console.log('Session Status:', status);
    console.log('Session Data:', session);
  }, [status, session]);

  // Fetch alerts when component mounts or when session changes
  useEffect(() => {
    const fetchAlerts = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          console.log('Fetching alerts for user:', session.user);
          const response = await fetch('/api/alerts');
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch alerts');
          }
          const alerts = await response.json();
          console.log('All alerts:', alerts);
          const assetAlerts = alerts.filter((alert: Alert) => alert.asset_symbol === data.symbol);
          console.log('Asset alerts for', data.symbol, ':', assetAlerts);
          const hasActive = assetAlerts.some((alert: Alert) => alert.is_active);
          console.log('Has active alerts:', hasActive);
          setAlerts(assetAlerts);
          setHasActiveAlerts(hasActive);
        } catch (error) {
          console.error('Error fetching alerts:', error);
        }
      }
    };

    fetchAlerts();
  }, [data.symbol, session, status]);

  // Update alert value when alert type changes
  useEffect(() => {
    if (alertType === 'price') {
      setAlertValue(data.price?.toString() || '');
    } else {
      setAlertValue(data.changePercent?.toFixed(2) || '');
    }
  }, [alertType, data.price, data.changePercent]);

  const handleAlertClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'unauthenticated') {
      console.log('User not authenticated, showing sign in modal');
      setShowSignInModal(true);
      return;
    }
    setShowAlertModal(true);
  };

  const handleCreateAlert = async () => {
    if (status === 'unauthenticated') {
      console.log('User not authenticated, showing sign in modal');
      setShowSignInModal(true);
      return;
    }

    if (!alertValue) {
      alert('Please enter a value');
      return;
    }

    setIsLoading(true);
    try {
      const alertData = {
        asset_symbol: data.symbol,
        alert_type: alertType,
        condition: alertCondition,
        value: parseFloat(alertValue),
      };

      console.log(editingAlert ? 'Updating alert:' : 'Creating alert:', alertData);

      const response = await fetch('/api/alerts' + (editingAlert ? `?id=${editingAlert.id}` : ''), {
        method: editingAlert ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to ${editingAlert ? 'update' : 'create'} alert`);
      }

      const updatedAlert = await response.json();
      console.log(editingAlert ? 'Updated alert:' : 'Created alert:', updatedAlert);
      
      const updatedAlerts = editingAlert 
        ? alerts.map(alert => alert.id === editingAlert.id ? updatedAlert : alert)
        : [...alerts, updatedAlert];

      setAlerts(updatedAlerts);
      setHasActiveAlerts(updatedAlerts.some(alert => alert.is_active));
      setAlertValue('');
      setEditingAlert(null);
      setShowAlertModal(false);
    } catch (error) {
      console.error('Error handling alert:', error);
      alert(error instanceof Error ? error.message : `Failed to ${editingAlert ? 'update' : 'create'} alert. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts?id=${alertId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }

      const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
      setAlerts(updatedAlerts);
      setHasActiveAlerts(updatedAlerts.some(alert => alert.is_active));
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert');
    }
  };

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
    setAlertType(alert.alert_type);
    setAlertCondition(alert.condition);
    setAlertValue(alert.value.toString());
  };

  // Debugging: Log the change values and data object
  console.log('MarketCard:', data.symbol, 'change:', data.change, 'changePercent:', data.changePercent, data);

  return (
    <>
      <div
        onClick={onClick}
        className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {data.symbol}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{data.name}</p>
          </div>
          <AlertBell 
            hasActiveAlerts={hasActiveAlerts} 
            onClick={handleAlertClick}
          />
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            <AnimatedPrice value={data.price} />
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${getTypeColor(data.type)}`}>
            {data.type === 'commodity' ? 'COM' : 
             data.type === 'crypto' ? 'CRYPT' : 
             data.type}
          </span>
        </div>

        <div className="flex items-center">
          {isPositive ? (
            <FaArrowUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <FaArrowDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${changeColor}`}>
            {formatChange(data.change)} ({formatChange(data.changePercent)}%)
          </span>
        </div>
      </div>

      {/* Alert Management Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-[500px] transform transition-all duration-300 scale-100 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <FaBell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Price Alerts</h3>
                  <p className="text-gray-600 dark:text-gray-300">{data.symbol}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Alerts List */}
            <div className="mb-6 max-h-48 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {alert.alert_type === 'price' ? 'Price' : 'Percentage Change'} {alert.condition === 'above' ? 'Above' : 'Below'} {alert.value}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {alert.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAlert(alert)}
                        className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No alerts set for this asset
                </p>
              )}
            </div>

            {/* Alert Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alert Type
                  </label>
                  <select 
                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    value={alertType}
                    onChange={(e) => {
                      setAlertType(e.target.value as 'price' | 'percentage');
                      setEditingAlert(null);
                    }}
                  >
                    <option value="price">Price</option>
                    <option value="percentage">Percentage Change</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condition
                  </label>
                  <select 
                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    value={alertCondition}
                    onChange={(e) => setAlertCondition(e.target.value as 'above' | 'below')}
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  placeholder={`Enter ${alertType === 'price' ? 'price' : 'percentage'} value`}
                  value={alertValue}
                  onChange={(e) => setAlertValue(e.target.value)}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Current {alertType === 'price' ? 'Price' : 'Change'}: {alertType === 'price' ? 
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.price || 0) :
                    `${(data.changePercent || 0).toFixed(2)}%`
                  }
                </p>
              </div>
              <button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                onClick={handleCreateAlert}
                disabled={isLoading || !alertValue}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    {editingAlert ? 'Update Alert' : 'Create Alert'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-[400px] transform transition-all duration-300 scale-100 animate-fadeIn">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <FaLock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Sign in to set price alerts for <span className="font-semibold text-blue-600 dark:text-blue-400">{data.symbol}</span>
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => signIn()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <FaLock className="w-4 h-4" />
                Sign In to Continue
              </button>
              <button
                onClick={() => setShowSignInModal(false)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
              >
                Maybe Later
              </button>
            </div>

            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
} 