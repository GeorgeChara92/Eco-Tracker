import { useState } from 'react';
import { FaChartLine, FaChartBar } from 'react-icons/fa';
import { Asset } from '../../types/asset';
import AlertBell from './AlertBell';

interface AssetCardProps {
  asset: Asset;
  onViewDetails: (asset: Asset) => void;
}

export default function AssetCard({ asset, onViewDetails }: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-2 right-2">
        <AlertBell
          assetId={asset.id}
          assetName={asset.name}
          currentPrice={asset.current_price}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{asset.name}</h3>
        <span className="text-gray-500">{asset.symbol}</span>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold">${asset.current_price.toFixed(2)}</p>
        <p className={`text-sm ${asset.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {asset.price_change_percentage_24h.toFixed(2)}%
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => onViewDetails(asset)}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
        >
          <FaChartLine />
          <span>View Details</span>
        </button>
        <button
          onClick={() => onViewDetails(asset)}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
        >
          <FaChartBar />
          <span>View Chart</span>
        </button>
      </div>
    </div>
  );
} 