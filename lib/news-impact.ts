import { NewsItem } from './news-service';

export type ImpactLevel = 'high' | 'medium' | 'low';

interface ImpactIndicator {
  keywords: string[];
  sourceWeight: number;
}

// High-impact sources get a higher weight in impact calculation
const SOURCE_WEIGHTS: Record<string, number> = {
  'Reuters': 0.9,
  'Bloomberg': 0.9,
  'Financial Times': 0.85,
  'Wall Street Journal': 0.85,
  'CNBC': 0.8,
  'MarketWatch': 0.75,
  'Yahoo Finance': 0.7,
};

// Keywords and phrases that indicate different impact levels
const IMPACT_INDICATORS: Record<ImpactLevel, ImpactIndicator> = {
  high: {
    keywords: [
      'federal reserve',
      'rate decision',
      'interest rate',
      'fomc',
      'inflation data',
      'gdp',
      'recession',
      'market crash',
      'crisis',
      'emergency',
      'breaking',
      'urgent',
      'major announcement',
      'significant change',
      'substantial impact',
      'critical development',
    ],
    sourceWeight: 0.4,
  },
  medium: {
    keywords: [
      'earnings report',
      'quarterly results',
      'market update',
      'economic data',
      'policy change',
      'regulation',
      'partnership',
      'acquisition',
      'merger',
      'new product',
      'market movement',
      'price target',
      'analyst rating',
    ],
    sourceWeight: 0.3,
  },
  low: {
    keywords: [
      'minor change',
      'small update',
      'routine',
      'regular',
      'normal',
      'standard',
      'common',
      'typical',
      'usual',
    ],
    sourceWeight: 0.2,
  },
};

// Categories that typically have higher market impact
const CATEGORY_WEIGHTS: Record<string, number> = {
  markets: 0.9,
  economy: 0.85,
  forex: 0.8,
  stocks: 0.75,
  commodities: 0.7,
  crypto: 0.65,
  general: 0.5,
};

function calculateKeywordScore(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      // Give higher weight to keywords found in the title
      score += 0.5;
    }
  }
  
  return Math.min(score, 1); // Normalize to max of 1
}

function getSourceWeight(source: string): number {
  // Find the best matching source weight
  const matchingSource = Object.keys(SOURCE_WEIGHTS).find(s => 
    source.toLowerCase().includes(s.toLowerCase())
  );
  return matchingSource ? SOURCE_WEIGHTS[matchingSource] : 0.5;
}

export function analyzeNewsImpact(newsItem: NewsItem): ImpactLevel {
  const text = `${newsItem.title} ${newsItem.description || ''}`;
  const sourceWeight = getSourceWeight(newsItem.source);
  const categoryWeight = CATEGORY_WEIGHTS[newsItem.category] || 0.5;

  // Calculate impact scores for each level
  const scores = Object.entries(IMPACT_INDICATORS).map(([level, indicator]) => {
    const keywordScore = calculateKeywordScore(text, indicator.keywords);
    const totalScore = (
      keywordScore * 0.4 + // Keyword weight
      sourceWeight * indicator.sourceWeight + // Source credibility
      categoryWeight * 0.2 // Category importance
    );
    return { level: level as ImpactLevel, score: totalScore };
  });

  // Sort by score and get the highest impact level
  scores.sort((a, b) => b.score - a.score);
  
  // Use thresholds to determine final impact level
  const highestScore = scores[0].score;
  if (highestScore >= 0.7) return 'high';
  if (highestScore >= 0.4) return 'medium';
  return 'low';
} 