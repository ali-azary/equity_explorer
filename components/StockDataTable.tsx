
import React from 'react';
import { StockData } from '../types';
import { exportToCsv } from '../utils/csvExporter';
import ExportButton from './ExportButton';

interface StockDataTableProps {
  data: StockData[];
  ticker: string;
}

const StockDataTable: React.FC<StockDataTableProps> = ({ data, ticker }) => {
  const formatNumber = (num: number) => num.toFixed(2);
  const formatVolume = (vol: number) => vol.toLocaleString();
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

  const handleExport = () => {
    exportToCsv(data, `${ticker}_history.csv`);
  };

  return (
    <div>
        <div className="flex justify-end mb-4">
            <ExportButton onClick={handleExport}>Export to CSV</ExportButton>
        </div>
        <div className="overflow-x-auto shadow-2xl rounded-lg">
        <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
            <thead className="bg-gray-700/50">
            <tr>
                {['Date', 'Open', 'High', 'Low', 'Close', 'Volume'].map((header) => (
                <th
                    key={header}
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                    {header}
                </th>
                ))}
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
            {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-700/60 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{formatDate(item.Date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatNumber(item.Open)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">${formatNumber(item.High)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">${formatNumber(item.Low)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatNumber(item.Close)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatVolume(item.Volume)}</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
  );
};

export default StockDataTable;