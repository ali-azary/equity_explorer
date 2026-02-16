import React, { useState, useMemo } from 'react';
import { exportToCsv } from '../utils/csvExporter';
import ExportButton from './ExportButton';

interface HoldersDisplayProps {
  data: {
    major?: Array<{ index: string; Value: number }>;
    institutional?: Array<any>;
    mutualfund?: Array<any>;
  };
  ticker: string;
}

const formatLargeNumber = (num: number | undefined): string => {
  if (typeof num !== 'number') return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
};

const formatPercent = (val: number | undefined, signed = false): string => {
  if (typeof val !== 'number') return 'N/A';
  const sign = val > 0 && signed ? '+' : '';
  const displayVal = (val * 100).toFixed(2);
  return `${sign}${displayVal}%`;
};

const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
};

const MajorHoldersSummary: React.FC<{ data: Array<{ index: string; Value: number }>, onExport: () => void }> = ({ data, onExport }) => {
    const metrics: { [key: string]: number } = data.reduce((acc, item) => {
        acc[item.index] = item.Value;
        return acc;
    }, {} as { [key: string]: number });

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-blue-300">Ownership Breakdown</h3>
                <ExportButton onClick={onExport}>Export Summary</ExportButton>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-800/60 rounded-lg">
                    <p className="text-sm text-gray-400">% of Shares Held by All Insiders</p>
                    <p className="text-2xl font-bold text-gray-100">{formatPercent(metrics.insidersPercentHeld)}</p>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-lg">
                    <p className="text-sm text-gray-400">% of Shares Held by Institutions</p>
                    <p className="text-2xl font-bold text-gray-100">{formatPercent(metrics.institutionsPercentHeld)}</p>
                </div>
                 <div className="p-3 bg-gray-800/60 rounded-lg">
                    <p className="text-sm text-gray-400">% of Float Held by Institutions</p>
                    <p className="text-2xl font-bold text-gray-100">{formatPercent(metrics.institutionsFloatPercentHeld)}</p>
                </div>
                 <div className="p-3 bg-gray-800/60 rounded-lg">
                    <p className="text-sm text-gray-400">Number of Institutions Holding Shares</p>
                    <p className="text-2xl font-bold text-gray-100">{metrics.institutionsCount?.toLocaleString() ?? 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};

const HoldersTable: React.FC<{ title: string; holders: Array<any>, onExport: () => void }> = ({ title, holders, onExport }) => {
  return (
    <div className="overflow-x-auto shadow-lg rounded-lg">
        <div className="flex justify-between items-center p-4">
            <h3 className="text-lg font-bold text-blue-300">{title}</h3>
            <ExportButton onClick={onExport}>Export Table</ExportButton>
        </div>
        <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/60">
                <tr>
                    {['Holder', 'Shares', 'Date Reported', '% Out', 'Value', '% Change'].map(header => (
                        <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-gray-800/80 divide-y divide-gray-700/50">
                {holders.map((holder, index) => (
                    <tr key={index} className="hover:bg-gray-700/40">
                        <td className="px-4 py-4 text-sm font-medium text-gray-200" style={{maxWidth: '250px'}}><p className="truncate" title={holder.Holder}>{holder.Holder}</p></td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{holder.Shares?.toLocaleString() ?? 'N/A'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(holder['Date Reported'])}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{formatPercent(holder.pctHeld)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">{formatLargeNumber(holder.Value)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`flex items-center font-mono ${
                                holder.pctChange > 0 ? 'text-green-400' : holder.pctChange < 0 ? 'text-red-400' : 'text-gray-400'
                            }`}>
                                {holder.pctChange > 0 && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>}
                                {holder.pctChange < 0 && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
                                {holder.pctChange === 0 && <span className="w-4 mr-1 text-center">-</span>}
                                {formatPercent(holder.pctChange, true)}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
};

const HoldersDisplay: React.FC<HoldersDisplayProps> = ({ data, ticker }) => {
    const TABS = useMemo(() => [
        { key: 'major', label: 'Major Holders', data: data.major },
        { key: 'institutional', label: 'Top Institutional', data: data.institutional },
        { key: 'mutualfund', label: 'Top Mutual Funds', data: data.mutualfund },
    ].filter(tab => tab.data && tab.data.length > 0), [data]);

    const [activeTab, setActiveTab] = useState<string>(TABS[0]?.key || '');

    React.useEffect(() => {
        if (!TABS.find(t => t.key === activeTab)) {
            setActiveTab(TABS[0]?.key || '');
        }
    }, [TABS, activeTab]);

    if (TABS.length === 0) {
        return <p className="text-center text-gray-400 py-8">No holder data available.</p>;
    }
    
    const activeData = TABS.find(t => t.key === activeTab)?.data;

    const handleExport = () => {
        if (!activeData) return;

        let exportData: any[];
        let filename: string;
        
        switch(activeTab) {
            case 'major':
                filename = `${ticker}_major_holders_summary.csv`;
                // Transform the major holders data into a more CSV-friendly format
                exportData = activeData.map((item: {index: string, Value: number}) => ({
                    Metric: item.index.replace(/([A-Z])/g, ' $1').trim(), // Add spaces to camelCase
                    Value: item.Value
                }));
                break;
            case 'institutional':
                filename = `${ticker}_institutional_holders.csv`;
                exportData = activeData;
                break;
            case 'mutualfund':
                filename = `${ticker}_mutualfund_holders.csv`;
                exportData = activeData;
                break;
            default:
                return;
        }

        exportToCsv(exportData, filename);
    };

    return (
        <div className="w-full space-y-6">
            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-4 sm:space-x-6" aria-label="Tabs">
                    {TABS.map(tab => (
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
            </div>

            <div>
                {activeTab === 'major' && <MajorHoldersSummary data={activeData as any[]} onExport={handleExport} />}
                {activeTab === 'institutional' && <HoldersTable title="Top Institutional Holders" holders={activeData as any[]} onExport={handleExport} />}
                {activeTab === 'mutualfund' && <HoldersTable title="Top Mutual Fund Holders" holders={activeData as any[]} onExport={handleExport} />}
            </div>
        </div>
    );
};

export default HoldersDisplay;
