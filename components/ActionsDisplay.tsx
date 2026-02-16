import React from 'react';
import { exportToCsv } from '../utils/csvExporter';
import ExportButton from './ExportButton';

interface ActionsDisplayProps {
  data: {
    dividends: { [date: string]: number };
    splits: { [date: string]: number };
  };
  ticker: string;
}

const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
};

const ActionCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode, onExport: () => void, exportDisabled: boolean }> = ({ title, children, icon, onExport, exportDisabled }) => (
    <div className="bg-gray-900/50 rounded-lg p-4 shadow-md h-full flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
            <h3 className="flex items-center text-lg font-bold text-blue-300">
                {icon}
                <span className="ml-2">{title}</span>
            </h3>
            {!exportDisabled && <ExportButton onClick={onExport}>Export CSV</ExportButton>}
        </div>
        <div className="overflow-y-auto flex-grow pr-2" style={{ maxHeight: '400px' }}>
            {children}
        </div>
    </div>
);

const ActionsDisplay: React.FC<ActionsDisplayProps> = ({ data, ticker }) => {
  const { dividends, splits } = data;

  const dividendHistory = dividends ? Object.entries(dividends)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  const splitHistory = splits ? Object.entries(splits)
    .map(([date, ratio]) => ({ date, 'split_ratio_for_1': ratio }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  const hasDividends = dividendHistory.length > 0;
  const hasSplits = splitHistory.length > 0;

  if (!hasDividends && !hasSplits) {
      return <p className="text-center text-gray-400 py-8">No dividend or stock split history available.</p>;
  }

  const handleDividendExport = () => {
    exportToCsv(dividendHistory, `${ticker}_dividends.csv`);
  };

  const handleSplitExport = () => {
    exportToCsv(splitHistory, `${ticker}_splits.csv`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
            title="Dividend History"
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
            }
            onExport={handleDividendExport}
            exportDisabled={!hasDividends}
        >
            {hasDividends ? (
                <ul className="space-y-2">
                    {dividendHistory.map(({ date, amount }) => (
                        <li key={date} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-700/50">
                            <span className="text-gray-300">{formatDate(date)}</span>
                            <span className="font-mono text-green-400/90">${amount.toFixed(4)} / share</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-center text-gray-500">No dividend history.</p>
                </div>
            )}
        </ActionCard>

        <ActionCard
            title="Stock Split History"
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m6-6H6" /></svg>
            }
            onExport={handleSplitExport}
            exportDisabled={!hasSplits}
        >
            {hasSplits ? (
                <ul className="space-y-2">
                    {splitHistory.map(({ date, 'split_ratio_for_1': ratio }) => (
                        <li key={date} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-700/50">
                            <span className="text-gray-300">{formatDate(date)}</span>
                            <span className="font-semibold text-yellow-400/90">{`${ratio} for 1 Split`}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-center text-gray-500">No stock split history.</p>
                </div>
            )}
        </ActionCard>
    </div>
  );
};

export default ActionsDisplay;
