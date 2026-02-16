import React, { useState, useCallback } from 'react';
import { fetchMultipleStockHistories } from '../services/stockService';
import { StockData } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface RiskResult {
  varPct: number;
  esPct: number;
  varUsd: number;
  esUsd: number;
  confidence: number;
  horizon: number;
}

// --- Calculation Helpers ---
const calculateReturns = (prices: number[]): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] !== 0) {
      returns.push((prices[i] / prices[i - 1]) - 1);
    } else {
      returns.push(0);
    }
  }
  return returns;
};

const calculatePortfolioReturns = (
  alignedHistories: { [ticker: string]: { Close: number }[] },
  weights: { [ticker: string]: number }
): number[] => {
  const tickers = Object.keys(alignedHistories);
  if (tickers.length === 0) return [];
  
  const assetReturns: { [ticker: string]: number[] } = {};
  for (const ticker of tickers) {
    const prices = alignedHistories[ticker].map(d => d.Close);
    assetReturns[ticker] = calculateReturns(prices);
  }

  const numReturns = assetReturns[tickers[0]].length;
  const portfolioReturns: number[] = [];
  for (let i = 0; i < numReturns; i++) {
    let dailyPortfolioReturn = 0;
    for (const ticker of tickers) {
      dailyPortfolioReturn += (assetReturns[ticker][i] || 0) * (weights[ticker] || 0);
    }
    portfolioReturns.push(dailyPortfolioReturn);
  }

  return portfolioReturns;
};

const calculateVaRAndES = (
  portfolioReturns: number[],
  confidenceLevel: number
): { var: number; es: number } => {
  if (portfolioReturns.length === 0) return { var: 0, es: 0 };
  
  const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
  const alpha = 1 - (confidenceLevel / 100);
  const index = Math.floor(alpha * sortedReturns.length);

  const VaR = sortedReturns[index] || 0;
  const tailReturns = sortedReturns.slice(0, index);
  const ES = tailReturns.length > 0
    ? tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length
    : VaR;

  return { var: -VaR, es: -ES };
};

// Maps a lookback in days to a valid yfinance API period string.
const getPeriodForLookback = (days: number): string => {
    // Assuming ~21 trading days per month. Add a small buffer.
    if (days <= 22) return '1mo';
    if (days <= 66) return '3mo';
    if (days <= 130) return '6mo';
    if (days <= 260) return '1y';
    if (days <= 510) return '2y';
    if (days <= 1270) return '5y';
    if (days <= 2530) return '10y';
    return 'max';
};

// Define InputField outside the main component to prevent re-creation on re-renders
const InputField: React.FC<{ label: string; id: string; children: React.ReactNode }> = ({ label, id, children }) => (
    <div>
        <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-300">{label}</label>
        {children}
    </div>
);

const RiskEngineDisplay: React.FC = () => {
  const [tickers, setTickers] = useState('AAPL,GOOG,MSFT');
  const [weights, setWeights] = useState('0.4,0.3,0.3');
  const [portfolioValue, setPortfolioValue] = useState(100000);
  const [lookback, setLookback] = useState(252);
  const [horizon, setHorizon] = useState(10);
  const [confidence, setConfidence] = useState(99);
  
  const [result, setResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // --- 1. Input Validation ---
      const tickerArr = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
      const weightArr = weights.split(',').map(w => parseFloat(w.trim())).filter(w => !isNaN(w));

      if (tickerArr.length === 0) throw new Error('Please enter at least one ticker.');
      if (tickerArr.length !== weightArr.length) throw new Error('The number of tickers and weights must match.');
      const weightSum = weightArr.reduce((sum, w) => sum + w, 0);
      if (Math.abs(weightSum - 1.0) > 0.01) throw new Error(`Weights must sum to 1. Current sum: ${weightSum.toFixed(2)}`);
      if (portfolioValue <= 0 || lookback <= 1 || horizon <= 0) throw new Error('Portfolio Value, Lookback, and Horizon must be positive numbers.');

      const weightsMap = tickerArr.reduce((acc, ticker, i) => {
        acc[ticker] = weightArr[i];
        return acc;
      }, {} as { [ticker: string]: number });
      
      // --- 2. Data Fetching ---
      // Map the lookback days to a valid API period string to ensure enough data is fetched.
      const period = getPeriodForLookback(lookback);
      const alignedHistories = await fetchMultipleStockHistories(tickerArr, period, '1d');
      
      // The service returns data aligned by date. Now, we need to ensure we only use the number of days specified by the lookback.
      const finalHistories: { [ticker: string]: { Close: number }[] } = {};
      const tickerKeys = Object.keys(alignedHistories);

      if (tickerKeys.length > 0 && alignedHistories[tickerKeys[0]].length < lookback) {
        throw new Error(`Not enough overlapping data for the requested lookback period. Found ${alignedHistories[tickerKeys[0]].length} overlapping days, but need ${lookback}. Try a smaller lookback period or different tickers.`);
      }

      for(const ticker in alignedHistories) {
          finalHistories[ticker] = alignedHistories[ticker].slice(-lookback);
      }
      
      // --- 3. Calculation ---
      const portfolioReturns = calculatePortfolioReturns(finalHistories, weightsMap);
      const { var: dailyVaR, es: dailyES } = calculateVaRAndES(portfolioReturns, confidence);
      
      // Scale by time (sqrt of horizon)
      const varPct = dailyVaR * Math.sqrt(horizon);
      const esPct = dailyES * Math.sqrt(horizon);

      setResult({
        varPct,
        esPct,
        varUsd: varPct * portfolioValue,
        esUsd: esPct * portfolioValue,
        confidence,
        horizon,
      });

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [tickers, weights, portfolioValue, lookback, horizon, confidence]);
  
  const renderResults = () => {
    if (!result) return null;
    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Risk Calculation Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                <div className="bg-gray-900/50 p-5 rounded-lg">
                    <p className="text-sm text-blue-300">Value at Risk ({result.confidence}%)</p>
                    <p className="text-3xl font-bold text-red-400">{(result.varPct * 100).toFixed(2)}%</p>
                    <p className="text-lg text-gray-400">~ {result.varUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                    <p className="text-xs text-gray-500 mt-2">Maximum expected loss over {result.horizon} days.</p>
                </div>
                <div className="bg-gray-900/50 p-5 rounded-lg">
                    <p className="text-sm text-blue-300">Expected Shortfall ({result.confidence}%)</p>
                    <p className="text-3xl font-bold text-red-500">{(result.esPct * 100).toFixed(2)}%</p>
                    <p className="text-lg text-gray-400">~ {result.esUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                    <p className="text-xs text-gray-500 mt-2">Expected loss when the VaR threshold is breached.</p>
                </div>
            </div>
        </div>
    );
  };
  
  const renderContent = () => {
    if (loading) return <LoadingSpinner />;
    if (error) {
         return (
             <div className="text-center py-6 px-4 text-red-400 bg-red-900/20 rounded-lg" role="alert">
                <h3 className="font-semibold">Calculation Error</h3>
                <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
         );
    }
    if(result) return renderResults();
    return (
        <div className="text-center text-gray-400 p-6">
            <p>Configure your portfolio and parameters, then click "Calculate Risk" to begin.</p>
        </div>
    );
  };

  return (
    <div className="space-y-6">
        <div className="p-4 bg-gray-900/30 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Tickers (comma-separated)" id="tickers">
                    <input id="tickers" type="text" value={tickers} onChange={e => setTickers(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" placeholder="e.g., AAPL,GOOG,MSFT" />
                </InputField>
                <InputField label="Weights (comma-separated)" id="weights">
                    <input id="weights" type="text" value={weights} onChange={e => setWeights(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" placeholder="e.g., 0.4,0.3,0.3" />
                </InputField>
                <InputField label="Portfolio Value ($)" id="portfolioValue">
                    <input id="portfolioValue" type="number" value={portfolioValue} onChange={e => setPortfolioValue(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" />
                </InputField>
                <InputField label="Lookback Period (days)" id="lookback">
                    <input id="lookback" type="number" value={lookback} onChange={e => setLookback(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" />
                </InputField>
                <InputField label="Horizon (days)" id="horizon">
                    <input id="horizon" type="number" value={horizon} onChange={e => setHorizon(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" />
                </InputField>
                <InputField label="Confidence Level" id="confidence">
                    <select id="confidence" value={confidence} onChange={e => setConfidence(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5">
                        <option value={95}>95%</option>
                        <option value={99}>99%</option>
                    </select>
                </InputField>
            </div>
            <div className="mt-6 text-right">
                <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-wait"
                >
                  {loading ? 'Calculating...' : 'Calculate Risk'}
                </button>
            </div>
        </div>

        <div className="min-h-[200px] flex items-center justify-center">
            {renderContent()}
        </div>
    </div>
  );
};

export default RiskEngineDisplay;