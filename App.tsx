import React, { useState, useEffect, FormEvent } from 'react';
import { fetchStockData } from './services/stockService';
import StockDataTable from './components/StockDataTable';
import LoadingSpinner from './components/LoadingSpinner';
import JsonViewer from './components/JsonViewer';
import CompanyInfo from './components/CompanyInfo';
import NewsList from './components/NewsList';
import ActionsDisplay from './components/ActionsDisplay';
import FinancialsDisplay from './components/FinancialsDisplay';
import RecommendationsDisplay from './components/RecommendationsDisplay';
import HoldersDisplay from './components/HoldersDisplay';
import ToolsDisplay from './components/ToolsDisplay';
import Sidebar from './components/Sidebar';
import RiskEngineDisplay from './components/RiskEngineDisplay';
import VolatilityLab from './components/VolatilityLab';

const PERIOD_OPTIONS = [
  { value: '1mo', label: '1 Month' },
  { value: '3mo', label: '3 Months' },
  { value: '6mo', label: '6 Months' },
  { value: 'ytd', label: 'Year to Date' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
  { value: '5y', label: '5 Years' },
  { value: '10y', label: '10 Years' },
  { value: 'max', label: 'Max' },
];

const INTERVAL_OPTIONS = [
  { value: '1d', label: 'Daily' },
  { value: '1wk', label: 'Weekly' },
  { value: '1mo', label: 'Monthly' },
];

const DATA_VIEWS = new Set(['history', 'info', 'news', 'actions', 'financials', 'recommendations', 'holders']);

const App: React.FC = () => {
  const [responseData, setResponseData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ticker, setTicker] = useState<string>('AAPL');
  const [inputTicker, setInputTicker] = useState<string>('AAPL');
  const [activeView, setActiveView] = useState<string>('history');

  // State for history options
  const [period, setPeriod] = useState<string>('1y');
  const [interval, setInterval] = useState<string>('1d');

  useEffect(() => {
    // Only fetch data for the 'Data' views. Tools handle their own data.
    if (!DATA_VIEWS.has(activeView)) {
      setLoading(false);
      setError(null);
      setResponseData(null);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setResponseData(null); // Clear previous data
        const { data } = await fetchStockData(ticker, activeView, period, interval);

        if (activeView === 'history' && Array.isArray(data)) {
          // The API returns data in ascending order, let's reverse it to show most recent first
          setResponseData(data.reverse());
        } else {
          setResponseData(data);
        }
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      loadData();
    }
  }, [ticker, activeView, period, interval]);

  const handleTickerSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newTicker = inputTicker.trim();
    if (newTicker && newTicker.toUpperCase() !== ticker) {
        setTicker(newTicker.toUpperCase());
    }
  };

  const getTitle = () => {
    const typeName = activeView.charAt(0).toUpperCase() + activeView.slice(1);
    switch (activeView) {
        case 'history': {
            const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || period;
            const intervalLabel = INTERVAL_OPTIONS.find(i => i.value === interval)?.label || interval;
            return `${periodLabel} Historical Data (${intervalLabel}) for ${ticker.toUpperCase()}`;
        }
        case 'info':
            return `Company Profile for ${ticker.toUpperCase()}`;
        case 'news':
            return `Latest News for ${ticker.toUpperCase()}`;
        case 'actions':
            return `Corporate Actions for ${ticker.toUpperCase()}`;
        case 'financials':
            return `Financial Statements for ${ticker.toUpperCase()}`;
        case 'recommendations':
            return `Analyst Recommendations for ${ticker.toUpperCase()}`;
        case 'holders':
            return `Ownership Information for ${ticker.toUpperCase()}`;
        case 'swot':
            return `AI-Powered SWOT Analysis for ${ticker.toUpperCase()}`;
        case 'var_es_engine':
            return `Portfolio Risk Engine (VaR/ES)`;
        case 'vol_corr_lab':
            return `Volatility & Correlation Laboratory`;
        default:
            return `${typeName} Data for ${ticker.toUpperCase()}`;
    }
  };

  const renderContent = () => {
    // Tools have their own loading/error states
    if (activeView === 'swot') {
        return <ToolsDisplay ticker={ticker} />;
    }
    if (activeView === 'var_es_engine') {
        return <RiskEngineDisplay />;
    }
    if (activeView === 'vol_corr_lab') {
        return <VolatilityLab />;
    }

    if (loading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return (
        <div className="text-center py-10 px-4 text-gray-400" role="status">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-yellow-500/80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-300">Could Not Load Data</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      );
    }

    if (responseData) {
      switch(activeView) {
        case 'history':
            return Array.isArray(responseData) ? <StockDataTable data={responseData} ticker={ticker} /> : null;
        case 'info':
            return responseData ? <CompanyInfo data={responseData} /> : null;
        case 'news':
            return responseData.news ? <NewsList articles={responseData.news} ticker={ticker} /> : null;
        case 'actions':
            return responseData ? <ActionsDisplay data={responseData} ticker={ticker} /> : null;
        case 'financials':
            return responseData ? <FinancialsDisplay data={responseData} ticker={ticker} /> : null;
        case 'recommendations':
            return Array.isArray(responseData) ? <RecommendationsDisplay data={responseData} ticker={ticker} /> : null;
        case 'holders':
            return responseData ? <HoldersDisplay data={responseData} ticker={ticker} /> : null;
        default:
            return <JsonViewer data={responseData} ticker={ticker} dataType={activeView} />;
      }
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isLoading={loading} />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 flex-grow">
          <header className="mb-6">
              <p className="text-2xl font-semibold text-gray-300">
                  {getTitle()}
              </p>
          </header>

          {!['var_es_engine', 'vol_corr_lab'].includes(activeView) && (
            <div className="max-w-xl mb-8 space-y-4">
                <form onSubmit={handleTickerSubmit} className="flex items-center gap-2">
                    <label htmlFor="ticker-input" className="sr-only">Stock Ticker</label>
                    <input
                        id="ticker-input"
                        type="text"
                        value={inputTicker}
                        onChange={(e) => setInputTicker(e.target.value)}
                        placeholder="Enter Ticker (e.g., GOOG)"
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-400"
                        aria-label="Stock Ticker Input"
                    />
                    <button
                        type="submit"
                        className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading && DATA_VIEWS.has(activeView)}
                        aria-label="Get stock data"
                    >
                        {loading && DATA_VIEWS.has(activeView) ? '...' : 'Get Data'}
                    </button>
                </form>
                
                {activeView === 'history' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="period-select" className="sr-only">Period</label>
                            <select
                                id="period-select"
                                value={period}
                                onChange={e => setPeriod(e.target.value)}
                                disabled={loading}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                aria-label="Select time period"
                            >
                                {PERIOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="interval-select" className="sr-only">Interval</label>
                            <select
                                id="interval-select"
                                value={interval}
                                onChange={e => setInterval(e.target.value)}
                                disabled={loading}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                aria-label="Select data interval"
                            >
                                {INTERVAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>
          )}

          <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm border border-gray-700">
              {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;