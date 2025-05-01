import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;  // This is actually the asset symbol
  assetName: string;
  currentPrice: number;
  onAlertCreated: () => void;
  onAlertDeactivated?: () => void;
}

export default function AlertModal({
  isOpen,
  onClose,
  assetId,  // This is actually the asset symbol
  assetName,
  currentPrice,
  onAlertCreated,
  onAlertDeactivated
}: AlertModalProps) {
  const { data: session } = useSession();
  const [alertType, setAlertType] = useState<'price' | 'percentage'>('price');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [value, setValue] = useState<number>(currentPrice * 1.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAlert, setExistingAlert] = useState<any>(null);

  useEffect(() => {
    if (isOpen && session) {
      checkExistingAlert();
    }
  }, [isOpen, session, assetId]);

  const checkExistingAlert = async () => {
    try {
      const response = await fetch('/api/alerts', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const alerts = await response.json();
      const alert = alerts.find((a: any) => 
        a.asset_symbol === assetId && a.is_active
      );
      
      if (alert) {
        setExistingAlert(alert);
        setAlertType(alert.alert_type);
        setCondition(alert.condition);
        setValue(alert.value);
      } else {
        setExistingAlert(null);
      }
    } catch (error) {
      console.error('Error checking existing alert:', error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!session) {
      setError('You must be signed in to manage alerts');
      setLoading(false);
      return;
    }

    try {
      if (existingAlert) {
        // Deactivate the existing alert
        const response = await fetch(`/api/alerts?id=${existingAlert.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to deactivate alert');
        }

        onAlertDeactivated?.();
        onClose();
      } else {
        // Create new alert
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            asset_symbol: assetId,
            alert_type: alertType,
            condition,
            value: alertType === 'percentage' ? value / 100 : value,
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create alert');
        }

        const data = await response.json();
        console.log('Alert created successfully:', data);
        onAlertCreated();
        onClose();
      }
    } catch (err) {
      console.error('Error managing alert:', err);
      setError(err instanceof Error ? err.message : 'Failed to manage alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {existingAlert ? 'Deactivate Alert' : 'Set Alert'} for {assetName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!existingAlert && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Alert Type
                  </label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as 'price' | 'percentage')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="price">Price</option>
                    <option value="percentage">Percentage Change</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {alertType === 'price' ? 'Price' : 'Percentage Change'} Value
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value))}
                    step={alertType === 'price' ? "0.01" : "1"}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder={alertType === 'price' ? "Enter price" : "Enter percentage"}
                  />
                  {alertType === 'percentage' && (
                    <p className="mt-1 text-sm text-gray-500">
                      Current price: ${currentPrice.toFixed(2)}
                    </p>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !session}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
                  existingAlert 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Processing...' : existingAlert ? 'Deactivate Alert' : 'Create Alert'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 