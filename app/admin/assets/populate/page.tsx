'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PopulateAssetsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const handlePopulate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/assets/populate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to populate assets');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Populate Assets Table</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="mb-4">
          This will fetch the top 250 cryptocurrencies from CoinGecko and populate the assets table.
          Existing assets will be updated with the latest data.
        </p>

        <button
          onClick={handlePopulate}
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {loading ? 'Populating...' : 'Populate Assets'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded">
            <p>Success! {result.totalAssets} assets were populated.</p>
            {result.sampleAsset && (
              <div className="mt-2">
                <p>Sample asset:</p>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
                  {JSON.stringify(result.sampleAsset, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 