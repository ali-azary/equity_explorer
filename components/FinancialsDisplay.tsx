import React, { useState } from 'react';
import { exportToCsv } from '../utils/csvExporter';
import ExportButton from './ExportButton';

const formatValue = (value: number | null | undefined, key: string): string => {
  if (value === null || typeof value === 'undefined') return 'N/A';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes('shares') || lowerKey.endsWith(' number')) {
    return `${sign}${absValue.toLocaleString()}`;
  }
  if (lowerKey.includes('ratio') || lowerKey.endsWith(' pe') || lowerKey.includes('eps') || lowerKey.includes('beta')) {
    return `${sign}${absValue.toFixed(2)}`;
  }
  if (lowerKey.includes('rate') || lowerKey.includes('margin') || lowerKey.includes('growth') || lowerKey.includes('return') || lowerKey.includes('payout')) {
    return `${sign}${(absValue * 100).toFixed(2)}%`;
  }
  if (absValue >= 1e12) return `${sign}${(absValue / 1e12).toFixed(2)}T`;
  if (absValue >= 1e9) return `${sign}${(absValue / 1e9).toFixed(2)}B`;
  if (absValue >= 1e6) return `${sign}${(absValue / 1e6).toFixed(2)}M`;

  return `${sign}${absValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const KEY_METRICS = new Set([
  'Total Revenue', 'Gross Profit', 'Operating Income', 'Net Income', 'EBITDA',
  'Total Assets', 'Total Liabilities', 'Stockholders Equity',
  'Operating Cash Flow', 'Free Cash Flow', 'Capital Expenditure'
]);


const FinancialsDisplay: React.FC<{ data: any, ticker: string }> = ({ data, ticker }) => {
  const [activeTab, setActiveTab] = useState('income');

  const tabs = [
    { key: 'income', label: 'Income Statement', data: data.income },
    { key: 'balance_sheet', label: 'Balance Sheet', data: data.balance_sheet },
    { key: 'cashflow', label: 'Cash Flow', data: data.cashflow },
  ].filter(tab => tab.data && tab.data.length > 0);

  const activeTabData = tabs.find(tab => tab.key === activeTab);
  const activeTableData = activeTabData?.data;

  if (!activeTableData) {
    return <p className="text-center text-gray-400 py-8">No financial statements available for this ticker.</p>;
  }

  const handleExport = () => {
    if (!activeTableData || !activeTabData) return;
    const filename = `${ticker}_${activeTabData.key}.csv`;
    exportToCsv(activeTableData, filename);
  };

  const headers = Object.keys(activeTableData[0] || {})
    .filter(key => key !== 'index')
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="w-full">
      <div className="border-b border-gray-700 flex justify-between items-center">
        <nav className="-mb-px flex space-x-4 sm:space-x-6" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                activeTab === tab.key
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <ExportButton onClick={handleExport}>Export Current View</ExportButton>
      </div>
      <div className="mt-4 overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-800/60">
            <tr>
              <th scope="col" className="sticky left-0 bg-gray-800/60 backdrop-blur-sm z-10 px-4 sm:px-6 py-3.5 text-left text-sm font-semibold text-gray-200">
                Metric
              </th>
              {headers.map(header => (
                <th key={header} scope="col" className="px-4 sm:px-6 py-3.5 text-right text-sm font-semibold text-gray-300">
                  {new Date(header).getFullYear()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {activeTableData.map((row: any) => {
              const isKeyMetric = KEY_METRICS.has(row.index);
              return (
                <tr key={row.index} className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className={`sticky left-0 bg-gray-800/50 backdrop-blur-sm whitespace-nowrap px-4 sm:px-6 py-4 text-sm ${isKeyMetric ? 'font-bold text-gray-100' : 'text-gray-300'}`}>
                    {row.index}
                  </td>
                  {headers.map(header => {
                    const value = row[header];
                    const isNegative = typeof value === 'number' && value < 0;
                    return (
                        <td key={header} className={`whitespace-nowrap px-4 sm:px-6 py-4 text-sm text-right font-mono ${isNegative ? 'text-red-400' : 'text-gray-200'}`}>
                            {formatValue(value, row.index)}
                        </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialsDisplay;
