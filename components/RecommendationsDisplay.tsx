import React from 'react';
import { exportToCsv } from '../utils/csvExporter';
import ExportButton from './ExportButton';

interface Recommendation {
  period: string;
  strongBuy: number;
  buy: number;

  hold: number;
  sell: number;
  strongSell: number;
}

interface RecommendationsDisplayProps {
  data: Recommendation[];
  ticker: string;
}

const getPeriodLabel = (period: string): string => {
  if (typeof period !== 'string') return 'Unknown Period';
  if (period === '0m') return 'This Month';
  const months = period.replace('-', '').replace('m', '');
  if (months === '1') return 'Last Month';
  return `${months} Months Ago`;
};

const RATINGS = [
  { key: 'strongBuy', label: 'Strong Buy', color: 'bg-emerald-500' },
  { key: 'buy', label: 'Buy', color: 'bg-green-500' },
  { key: 'hold', label: 'Hold', color: 'bg-yellow-500' },
  { key: 'sell', label: 'Sell', color: 'bg-red-500' },
  { key: 'strongSell', label: 'Strong Sell', color: 'bg-rose-600' },
];

const RecommendationCard: React.FC<{ rec: Recommendation }> = ({ rec }) => {
  const totalAnalysts = RATINGS.reduce((sum, rating) => sum + (rec[rating.key as keyof Recommendation] as number), 0);
  
  if (totalAnalysts === 0) {
      return null; // Don't render a card if there are no analysts
  }

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 sm:p-5 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-blue-300">{getPeriodLabel(rec.period)}</h3>
        <span className="text-sm text-gray-400">{totalAnalysts} Analysts</span>
      </div>
      <div className="space-y-3">
        {RATINGS.map(rating => {
          const count = rec[rating.key as keyof Recommendation] as number;
          const percentage = totalAnalysts > 0 ? (count / totalAnalysts) * 100 : 0;
          
          if (count === 0 && percentage === 0) return null; // Don't show bar if count is zero

          return (
            <div key={rating.key} className="flex items-center" aria-label={`${rating.label}: ${count} analysts`}>
              <span className="w-24 text-sm text-gray-300 flex-shrink-0">{rating.label}</span>
              <div className="flex-1 flex items-center mx-2 sm:mx-4">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`${rating.color} h-2.5 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
              <span className="w-8 text-sm text-right font-mono text-gray-200">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const RecommendationsDisplay: React.FC<RecommendationsDisplayProps> = ({ data, ticker }) => {
  if (!data || !Array.isArray(data)) {
    return <p className="text-center text-gray-400 py-8">No recommendation data available.</p>;
  }

  const sortedData = [...data]
    .filter(rec => typeof rec?.period === 'string') // Filter out items with no period string
    .sort((a, b) => {
      const periodA = parseInt(a.period.replace('m', ''), 10);
      const periodB = parseInt(b.period.replace('m', ''), 10);
      return periodA - periodB;
    });

  if (sortedData.length === 0) {
    return <p className="text-center text-gray-400 py-8">No recommendation data available.</p>;
  }
  
  const handleExport = () => {
      exportToCsv(sortedData, `${ticker}_recommendations.csv`);
  };

  return (
    <div>
        <div className="flex justify-end mb-4">
            <ExportButton onClick={handleExport}>Export to CSV</ExportButton>
        </div>
        <div className="space-y-6">
        {sortedData.map((rec, index) => (
            <RecommendationCard key={index} rec={rec} />
        ))}
        </div>
    </div>
  );
};

export default RecommendationsDisplay;