export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatSymbol = (symbol: string, type: string): string => {
  switch (type) {
    case 'crypto':
      return `${symbol}-USD`;
    case 'forex':
      return `${symbol}=X`;
    case 'fund':
      return `${symbol}.F`;
    case 'index':
      return `^${symbol}`;
    case 'commodity':
      return `${symbol}=F`;
    default:
      return symbol;
  }
}; 