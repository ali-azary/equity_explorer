import React, { useState, useCallback, useMemo } from 'react';
import { fetchMultipleStockHistories } from '../services/stockService';
import LoadingSpinner from './LoadingSpinner';

// --- TYPE DEFINITIONS ---
interface VolatilityPoint {
  date: string;
  volatility: number;
}

interface RegimePoint {
  date: string;
  regime: 'High' | 'Low' | 'Normal';
}

interface LabResults {
  volatilities: { [ticker: string]: VolatilityPoint[] };
  correlationMatrix: { [tickerA: string]: { [tickerB: string]: number } };
  regimes: RegimePoint[];
  tickers: string[];
}

// --- CALCULATION HELPERS ---

const getPeriodForLookback = (days: number): string => {
    if (days <= 22) return '1mo'; if (days <= 66) return '3mo';
    if (days <= 130) return '6mo'; if (days <= 260) return '1y';
    if (days <= 510) return '2y'; if (days <= 1270) return '5y';
    if (days <= 2530) return '10y'; return 'max';
};

const calculateReturns = (prices: number[]): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(prices[i - 1] !== 0 ? Math.log(prices[i] / prices[i - 1]) : 0);
  }
  return returns;
};

const stdDev = (arr: number[]): number => {
  const n = arr.length;
  if (n < 2) return 0;
  const mean = arr.reduce((a, b) => a + b) / n;
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance);
};

const correlation = (x: number[], y: number[]): number => {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    const n = x.length;
    if (n === 0 || y.length !== n) return 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i]; sumY += y[i]; sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i]; sumY2 += y[i] * y[i];
    }
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return den === 0 ? 0 : num / den;
};

const percentile = (arr: number[], p: number): number => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    if (lower === index) return sorted[lower];
    return sorted[lower] * (Math.ceil(index) - index) + sorted[Math.ceil(index)] * (index - lower);
};

// --- UI SUB-COMPONENTS ---

const InputField: React.FC<{ label: string; id: string; children: React.ReactNode }> = ({ label, id, children }) => (
    <div>
        <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-300">{label}</label>
        {children}
    </div>
);

const CorrelationMatrix: React.FC<{ matrix: LabResults['correlationMatrix']; tickers: string[] }> = ({ matrix, tickers }) => {
    const getColor = (value: number) => {
        if (value > 0.7) return 'bg-green-700/80'; if (value > 0.3) return 'bg-green-800/60';
        if (value < -0.7) return 'bg-red-700/80'; if (value < -0.3) return 'bg-red-800/60';
        return 'bg-gray-700/50';
    };
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Correlation Matrix</h3>
            <div className="overflow-x-auto rounded-lg shadow-md">
                <table className="min-w-full text-sm text-center">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-3 py-2 sticky left-0 bg-gray-700/50"></th>
                            {tickers.map(t => <th key={t} className="px-3 py-2 font-medium">{t}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {tickers.map(t1 => (
                            <tr key={t1}>
                                <th className="px-3 py-2 font-medium sticky left-0 bg-gray-800">{t1}</th>
                                {tickers.map(t2 => (
                                    <td key={t2} className={`px-3 py-2 font-mono ${t1 === t2 ? 'bg-gray-600 font-bold' : getColor(matrix[t1][t2])}`}>
                                        {matrix[t1][t2].toFixed(2)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const VolatilityChart: React.FC<{ data: LabResults['volatilities']; tickers: string[] }> = ({ data, tickers }) => {
    const colors = ['#38bdf8', '#f87171', '#fbbf24', '#4ade80', '#a78bfa', '#f472b6'];
    const width = 600, height = 300, margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const yMax = useMemo(() => Math.max(...tickers.flatMap(t => data[t].map(p => p.volatility))), [data, tickers]);

    const xScale = (index: number) => margin.left + (index / (data[tickers[0]].length - 1)) * (width - margin.left - margin.right);
    const yScale = (val: number) => height - margin.bottom - (val / yMax) * (height - margin.top - margin.bottom);
    
    const paths = tickers.map(ticker => {
        return data[ticker].map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.volatility)}`).join(' ');
    });

    const yAxisTicks = Array.from({ length: 5 }, (_, i) => yMax * (i / 4));
    
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Volatility Term Structure</h3>
            <div className="bg-gray-900/50 rounded-lg p-4">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby="chart-title">
                    <title id="chart-title">Rolling Volatility Chart</title>
                    {/* Y-Axis */}
                    <g className="text-gray-400 text-xs">
                        {yAxisTicks.map(tick => (
                             <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                                <line x1={margin.left} x2={width - margin.right} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2"/>
                                <text x={margin.left - 8} y="3" textAnchor="end" fill="currentColor">{(tick * 100).toFixed(0)}%</text>
                             </g>
                        ))}
                    </g>
                    {/* Data Paths */}
                    {paths.map((path, i) => (
                        <path key={tickers[i]} d={path} fill="none" stroke={colors[i % colors.length]} strokeWidth="2"/>
                    ))}
                </svg>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs">
                    {tickers.map((ticker, i) => (
                        <div key={ticker} className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[i % colors.length] }}></span>
                            <span>{ticker}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RegimeTimeline: React.FC<{ regimes: RegimePoint[], primaryTicker: string }> = ({ regimes, primaryTicker }) => {
    const getColor = (regime: RegimePoint['regime']) => ({
        'High': 'bg-red-500', 'Low': 'bg-green-500', 'Normal': 'bg-gray-500'
    }[regime]);

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Volatility Regime for {primaryTicker}</h3>
            <div className="flex h-10 w-full rounded-md overflow-hidden bg-gray-700" title="Volatility Regime Timeline">
                {regimes.map((r, i) => (
                    <div key={i} className={`flex-grow ${getColor(r.regime)}`} title={`${r.date}: ${r.regime} Volatility`}></div>
                ))}
            </div>
            <div className="flex justify-center gap-4 text-xs mt-2 text-gray-400">
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-1.5"></span>High</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-gray-500 rounded-full mr-1.5"></span>Normal</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-1.5"></span>Low</span>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const VolatilityLab: React.FC = () => {
    const [tickers, setTickers] = useState('SPY,QQQ,TLT');
    const [lookback, setLookback] = useState(252);
    const [windowSize, setWindowSize] = useState(21);
    const [model, setModel] = useState<'realized' | 'garch-lite'>('realized');

    const [result, setResult] = useState<LabResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCalculate = useCallback(async () => {
        setError(null); setResult(null); setLoading(true);

        try {
            const tickerArr = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
            if (tickerArr.length === 0) throw new Error('Please enter at least one ticker.');
            if (lookback <= windowSize) throw new Error('Lookback period must be greater than the rolling window size.');
            
            const period = getPeriodForLookback(lookback);
            const rawHistories = await fetchMultipleStockHistories(tickerArr, period, '1d');
            if (Object.keys(rawHistories).length === 0) throw new Error('Could not fetch data for any tickers.');

            const hist = tickerArr.reduce((acc, t) => {
                if(rawHistories[t] && rawHistories[t].length >= lookback) {
                    acc[t] = rawHistories[t].slice(-lookback);
                }
                return acc;
            }, {} as {[key: string]: any[]});

            const availableTickers = Object.keys(hist);
            if (availableTickers.length === 0) throw new Error(`Not enough historical data for the requested lookback period of ${lookback} days.`);
            
            const returns: { [key: string]: number[] } = {};
            availableTickers.forEach(t => {
                returns[t] = calculateReturns(hist[t].map(d => d.Close));
            });

            // --- Calculations ---
            const volatilities: LabResults['volatilities'] = {};
            const annualizationFactor = Math.sqrt(252);

            availableTickers.forEach(t => {
                const volSeries: VolatilityPoint[] = [];
                const assetReturns = returns[t];
                
                if (model === 'realized') {
                    for (let i = windowSize; i < assetReturns.length; i++) {
                        const windowReturns = assetReturns.slice(i - windowSize, i);
                        const dailyStdDev = stdDev(windowReturns);
                        volSeries.push({ date: hist[t][i].Date, volatility: dailyStdDev * annualizationFactor });
                    }
                } else { // GARCH-lite (EWMA)
                    const lambda = 0.94;
                    let lastVariance = stdDev(assetReturns.slice(0, windowSize)) ** 2;
                    for (let i = windowSize; i < assetReturns.length; i++) {
                        lastVariance = lambda * lastVariance + (1 - lambda) * (assetReturns[i - 1] ** 2);
                        volSeries.push({ date: hist[t][i].Date, volatility: Math.sqrt(lastVariance) * annualizationFactor });
                    }
                }
                volatilities[t] = volSeries;
            });

            const correlationMatrix: LabResults['correlationMatrix'] = {};
            if (availableTickers.length > 1) {
                availableTickers.forEach(t1 => {
                    correlationMatrix[t1] = {};
                    availableTickers.forEach(t2 => {
                        const recentReturns1 = returns[t1].slice(-windowSize);
                        const recentReturns2 = returns[t2].slice(-windowSize);
                        correlationMatrix[t1][t2] = t1 === t2 ? 1.0 : correlation(recentReturns1, recentReturns2);
                    });
                });
            }

            const primaryTicker = availableTickers[0];
            const primaryVolSeries = volatilities[primaryTicker].map(p => p.volatility);
            const lowVolThreshold = percentile(primaryVolSeries, 25);
            const highVolThreshold = percentile(primaryVolSeries, 75);
            const regimes: LabResults['regimes'] = volatilities[primaryTicker].map(p => ({
                date: p.date,
                regime: p.volatility > highVolThreshold ? 'High' : p.volatility < lowVolThreshold ? 'Low' : 'Normal',
            }));

            setResult({ volatilities, correlationMatrix, regimes, tickers: availableTickers });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [tickers, lookback, windowSize, model]);
    
    const renderResults = () => {
        if (!result) return null;
        return (
            <div className="mt-8 space-y-8">
                {result.tickers.length > 1 && <CorrelationMatrix matrix={result.correlationMatrix} tickers={result.tickers} />}
                <VolatilityChart data={result.volatilities} tickers={result.tickers} />
                <RegimeTimeline regimes={result.regimes} primaryTicker={result.tickers[0]} />
            </div>
        );
    };

    const renderContent = () => {
        if (loading) return <LoadingSpinner />;
        if (error) return <div className="text-center py-6 px-4 text-red-400 bg-red-900/20 rounded-lg" role="alert"><h3 className="font-semibold">Calculation Error</h3><p className="mt-1 text-sm text-red-300">{error}</p></div>;
        if (result) return renderResults();
        return <div className="text-center text-gray-400 p-6"><p>Configure your parameters and click "Calculate" to begin the analysis.</p></div>;
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-gray-900/30 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InputField label="Tickers (comma-separated)" id="tickers"><input id="tickers" type="text" value={tickers} onChange={e => setTickers(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" placeholder="e.g., SPY,QQQ,TLT" /></InputField>
                    <InputField label="Lookback Period (days)" id="lookback"><input id="lookback" type="number" value={lookback} onChange={e => setLookback(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" /></InputField>
                    <InputField label="Rolling Window (days)" id="window"><input id="window" type="number" value={windowSize} onChange={e => setWindowSize(Number(e.target.value))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" /></InputField>
                    <InputField label="Volatility Model" id="model">
                        <select id="model" value={model} onChange={e => setModel(e.target.value as any)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5">
                            <option value="realized">Realized Volatility</option>
                            <option value="garch-lite">GARCH-Lite (EWMA)</option>
                        </select>
                    </InputField>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={handleCalculate} disabled={loading} className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-wait">
                        {loading ? 'Calculating...' : 'Calculate'}
                    </button>
                </div>
            </div>
            <div className="min-h-[300px] flex flex-col justify-center">{renderContent()}</div>
        </div>
    );
};

export default VolatilityLab;