import React, { useEffect, useState } from 'react';
import { MarketData, getTradingViewSymbol } from '@/lib/yahoo-finance';
import { NewsItem } from '@/lib/news-service';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaExchangeAlt, 
  FaChartLine, 
  FaGlobe,
  FaCalendarDay,
  FaChartBar,
  FaClock,
  FaBalanceScale,
  FaNewspaper,
  FaExternalLinkAlt,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaTimes,
  FaLock,
  FaBell,
  FaTrash,
  FaEdit,
  FaPlus
} from 'react-icons/fa';
import { AdvancedChart } from 'react-tradingview-embed';
import AlertBell from './AlertBell';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AlertModal from '@/src/components/ui/AlertModal';

interface MarketDetailsProps {
  data: MarketData;
  onClose: () => void;
}

interface StatItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  change?: number;
  changePercent?: number;
}

interface Alert {
  id: string;
  asset_symbol: string;
  alert_type: 'price' | 'percentage';
  condition: 'above' | 'below';
  value: number;
  is_active: boolean;
}

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

const formatVolume = (value: number | undefined) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
};

const formatMarketCap = (value: number | undefined) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
};

export default function MarketDetails({ data, onClose }: MarketDetailsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [isNewsExpanded, setIsNewsExpanded] = useState(false);
  const [hasActiveAlerts, setHasActiveAlerts] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertType, setAlertType] = useState<'price' | 'percentage'>('price');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertValue, setAlertValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const tradingViewSymbol = getTradingViewSymbol(data.symbol, data.type);

  const fetchAlerts = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/alerts');
      const alerts = await response.json();
      console.log('Fetched alerts:', alerts);
      const assetAlerts = alerts.filter((alert: Alert) => alert.asset_symbol === data.symbol);
      console.log('Asset alerts:', assetAlerts);
      const hasActive = assetAlerts.some((alert: Alert) => alert.is_active);
      console.log('Has active alerts:', hasActive);
      setAlerts(assetAlerts);
      setHasActiveAlerts(hasActive);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  useEffect(() => {
    console.log('Fetching alerts for symbol:', data.symbol);
    fetchAlerts();
  }, [session?.user, data.symbol]);

  const handleAlertCreated = () => {
    fetchAlerts();
  };

  const handleAlertDeactivated = () => {
    fetchAlerts();
  };

  const handleAlertClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      setShowSignInModal(true);
      return;
    }
    setShowAlertModal(true);
  };

  const handleCreateAlert = async () => {
    if (!session?.user) {
      setShowSignInModal(true);
      return;
    }

    if (!alertValue) {
      alert('Please enter a value');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_symbol: data.symbol,
          alert_type: alertType,
          condition: alertCondition,
          value: parseFloat(alertValue),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create alert');
      }

      const newAlert = await response.json();
      setAlerts([...alerts, newAlert]);
      setHasActiveAlerts(true);
      setAlertValue('');
      setEditingAlert(null);
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert');
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

      setAlerts(alerts.filter(alert => alert.id !== alertId));
      setHasActiveAlerts(alerts.some(alert => alert.id !== alertId && alert.is_active));
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

  const stats: StatItem[] = [
    {
      label: 'Current Price',
      value: formatPrice(data.price),
      icon: FaExchangeAlt,
      change: data.change,
      changePercent: data.changePercent,
    },
    {
      label: '24h Volume',
      value: formatVolume(data.volume),
      icon: FaChartLine,
    },
    {
      label: 'Market Cap',
      value: formatMarketCap(data.marketCap),
      icon: FaGlobe,
    },
    {
      label: '52 Week High',
      value: formatPrice(data.fiftyTwoWeekHigh),
      icon: FaChartBar,
    },
    {
      label: '52 Week Low',
      value: formatPrice(data.fiftyTwoWeekLow),
      icon: FaChartBar,
    },
    {
      label: 'Day Range',
      value: `${formatPrice(data.dayLow)} - ${formatPrice(data.dayHigh)}`,
      icon: FaCalendarDay,
    },
    {
      label: 'Average Volume',
      value: formatVolume(data.averageVolume),
      icon: FaChartLine,
    },
    {
      label: 'Open Price',
      value: formatPrice(data.openPrice),
      icon: FaClock,
    },
    {
      label: 'Previous Close',
      value: formatPrice(data.previousClose),
      icon: FaBalanceScale,
    },
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoadingNews(true);
        const response = await fetch(`/api/news?searchTerm=${data.name}&timeframe=week`);
        const result = await response.json();
        if (result.success) {
          setNews(result.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchNews();
  }, [data.name]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-[90vw] h-[90vh] flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{data.name}</h2>
              <AlertBell 
                hasActiveAlerts={hasActiveAlerts} 
                onClick={handleAlertClick}
                className="mt-1"
              />
              <span className="text-xs text-gray-500">
                {hasActiveAlerts ? '(Active)' : '(Inactive)'}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">{data.symbol}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <stat.icon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
              {stat.change !== undefined && stat.changePercent !== undefined && (
                <div className={`flex items-center text-sm mt-1 ${
                  stat.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.change >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                  {formatChange(stat.changePercent)}%
                </div>
              )}
            </div>
          ))}

          {/* News Section */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <button
              onClick={() => setIsNewsExpanded(!isNewsExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center">
                <FaNewspaper className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Latest News</span>
              </div>
              <FaChevronDown 
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 ${
                  isNewsExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className={`
              mt-2 transition-all duration-200 ease-in-out overflow-hidden
              ${isNewsExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
            `}>
              {isLoadingNews ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : news.length > 0 ? (
                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                  {news.map((item, index) => (
                    <a
                      key={index}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg p-2 transition-colors"
                    >
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2 flex items-start">
                        <span>{item.title}</span>
                        <FaExternalLinkAlt className="w-3 h-3 ml-1 mt-1 flex-shrink-0 text-gray-500" />
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{item.source}</span>
                        <span>{new Date(item.pubDate).toLocaleDateString()}</span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                  No recent news found
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <AdvancedChart
            widgetProps={{
              symbol: tradingViewSymbol,
              interval: "D",
              theme: "dark",
              style: "1",
              locale: "en",
              toolbar_bg: "#f1f3f6",
              enable_publishing: false,
              allow_symbol_change: true,
              container_id: "tradingview_widget",
              height: "100%"
            }}
          />
        </div>
      </div>

      {/* Alert Management Modal */}
      {showAlertModal && (
        <AlertModal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          assetId={data.symbol}
          assetName={data.name}
          currentPrice={data.price}
          onAlertCreated={handleAlertCreated}
          onAlertDeactivated={handleAlertDeactivated}
        />
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
    </div>
  );
} 