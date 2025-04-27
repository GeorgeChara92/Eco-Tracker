import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assetName: string;
  currentPrice: number;
  onAlertCreated: () => void;
}

export default function AlertModal({
  isOpen,
  onClose,
  assetId,
  assetName,
  currentPrice,
  onAlertCreated
}: AlertModalProps) {
  const [alertType, setAlertType] = useState<'price' | 'percentage'>('price');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [value, setValue] = useState<number>(currentPrice * 1.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('alerts')
        .insert({
          user_id: user.id,
          asset_id: assetId,
          alert_type: alertType,
          condition,
          value: alertType === 'percentage' ? value / 100 : value,
          is_active: true
        });

      if (error) throw error;

      onAlertCreated();
      onClose();
    } catch (err) {
      console.error('Error creating alert:', err);
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Set Alert for {assetName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Alert'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 