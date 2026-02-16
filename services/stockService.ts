import { StockData } from '../types';

// Add a CORS proxy to bypass browser-side cross-origin restrictions.
const PROXY_URL = 'https://corsproxy.io/?';
// Using the new yfinance API endpoint.
const API_BASE = 'https://yf-api-c0nm.onrender.com';

export const fetchStockData = async (
  ticker: string,
  dataType: string,
  period?: string,
  interval?: string
): Promise<{ data: any }> => {
  let endpoint = `/ticker/${ticker.toUpperCase()}/${dataType}`;
  if (dataType === 'history') {
    const queryPeriod = period || '1y';
    const queryInterval = interval || '1d';
    endpoint += `?period=${queryPeriod}&interval=${queryInterval}`;
  }
  const API_URL = `${API_BASE}${endpoint}`;
  const PROXIED_URL = `${PROXY_URL}${API_URL}`;

  try {
    // We fetch from the proxied URL to avoid CORS issues.
    const response = await fetch(PROXIED_URL);
    if (!response.ok) {
      // The API helpfully returns a JSON error with a 'detail' key.
      let errorMessage = `API request failed: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMessage = errorJson.detail;
        }
      } catch (e) {
        // Ignore if error response is not JSON
      }
      throw new Error(errorMessage);
    }
    const data: any = await response.json();

    if ((!data) || (Array.isArray(data) && data.length === 0)) {
        throw new Error(`No data found for symbol ${ticker.toUpperCase()} with data type '${dataType}'. It may be an invalid ticker or data type combination.`);
    }

    return { data };

  } catch (error) {
    console.error(`Failed to fetch ${dataType} for ${ticker}:`, error);
    // Re-throw the error so it can be caught by the UI component
    throw error;
  }
};

export const fetchMultipleStockHistories = async (
  tickers: string[],
  period: string,
  interval: string
): Promise<{ [ticker: string]: StockData[] }> => {
  const promises = tickers.map(ticker => 
    fetchStockData(ticker, 'history', period, interval)
      // FIX: Add 'as const' to status properties to enable TypeScript to correctly narrow the types in the discriminated union.
      .then(response => ({ status: 'fulfilled' as const, ticker, data: response.data as StockData[] }))
      .catch(error => ({ status: 'rejected' as const, ticker, reason: error.message }))
  );

  // Using Promise.allSettled to ensure all requests complete, even if some fail.
  const results = await Promise.all(promises);
  
  const successfulFetches: { [ticker: string]: StockData[] } = {};
  const failedTickers: { ticker: string, reason: string }[] = [];

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      successfulFetches[result.ticker] = result.data;
    } else {
      failedTickers.push({ ticker: result.ticker, reason: result.reason });
    }
  });

  if (failedTickers.length > 0) {
    const errorDetails = failedTickers.map(f => `${f.ticker}`).join(', ');
    throw new Error(`Failed to fetch history for: ${errorDetails}. Please check the tickers.`);
  }

  if (Object.keys(successfulFetches).length === 0) {
    return {};
  }
  
  const tickerKeys = Object.keys(successfulFetches);
  
  // --- NEW FORWARD-FILL LOGIC ---

  // 1. Get the union of all dates from all tickers and sort them chronologically.
  const allDatesSet = new Set<string>();
  for (const ticker of tickerKeys) {
    successfulFetches[ticker].forEach(d => allDatesSet.add(d.Date));
  }
  const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const forwardFilledData: { [ticker: string]: StockData[] } = {};

  // 2. For each ticker, create a complete history by forward-filling any missing dates.
  for (const ticker of tickerKeys) {
    const tickerHistory = successfulFetches[ticker].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
    const priceMap = new Map(tickerHistory.map(d => [d.Date, d]));
    const newHistory: StockData[] = [];
    let lastKnownData: StockData | null = null;

    for (const date of sortedDates) {
      if (priceMap.has(date)) {
        const currentData = priceMap.get(date)!;
        newHistory.push(currentData);
        lastKnownData = currentData;
      } else if (lastKnownData) {
        // If data is missing, forward-fill using the last known price.
        // Set volume to 0 as no trades occurred on this day for this ticker.
        const filledData: StockData = {
          ...lastKnownData,
          Date: date,
          Volume: 0,
        };
        newHistory.push(filledData);
      }
      // If lastKnownData is null, it means there's a leading gap before the stock's first data point. We skip it.
    }
    forwardFilledData[ticker] = newHistory;
  }
  
  // 3. Find the latest start date among all tickers to ensure all series start at the same time.
  // This handles cases where some stocks IPO'd later than others in the requested period.
  let latestStartDate = '';
  for (const ticker of tickerKeys) {
    if (forwardFilledData[ticker].length > 0) {
      const tickerStartDate = forwardFilledData[ticker][0].Date;
      if (latestStartDate === '' || new Date(tickerStartDate) > new Date(latestStartDate)) {
        latestStartDate = tickerStartDate;
      }
    }
  }

  // 4. Trim all histories to start from the common latest start date, creating fully aligned series.
  const alignedData: { [ticker: string]: StockData[] } = {};
  for (const ticker of tickerKeys) {
    alignedData[ticker] = forwardFilledData[ticker].filter(d => new Date(d.Date) >= new Date(latestStartDate));
  }
  
  // A final check to ensure there's enough overlapping data to proceed with calculations.
  if (tickerKeys.length === 0 || (tickerKeys.length > 0 && alignedData[tickerKeys[0]].length < 2)) {
    throw new Error("Not enough overlapping historical data for the selected tickers to calculate returns, even after forward-filling.");
  }
  
  return alignedData;
};