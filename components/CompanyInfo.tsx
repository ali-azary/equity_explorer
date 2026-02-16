import React, { useState } from 'react';
import { exportToCsv } from '../utils/csvExporter';
import ExportButton from './ExportButton';

interface CompanyInfoProps {
  data: any;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string, onExport?: () => void }> = ({ title, children, className, onExport }) => (
  <div className={`bg-gray-900/50 rounded-lg p-4 shadow-md ${className}`}>
    <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
        <h3 className="text-lg font-bold text-blue-300">{title}</h3>
        {onExport && <ExportButton onClick={onExport}>Export</ExportButton>}
    </div>
    {children}
  </div>
);

const Metric: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
  <div className={`flex flex-col p-2 rounded-md hover:bg-gray-700/50 ${className}`}>
    <span className="text-sm text-gray-400">{label}</span>
    <span className="text-lg font-semibold text-gray-100">{value}</span>
  </div>
);

const CompanyInfo: React.FC<CompanyInfoProps> = ({ data }) => {
  const [isSummaryExpanded, setSummaryExpanded] = useState(false);

  const formatLargeNumber = (num: number | undefined): string => {
    if (typeof num !== 'number') return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatValue = (val: number | undefined, precision = 2): string => {
      if (typeof val !== 'number') return 'N/A';
      return val.toFixed(precision);
  };
  
  const formatPercent = (val: number | undefined): string => {
      if (typeof val !== 'number') return 'N/A';
      return `${(val * 100).toFixed(2)}%`;
  }

  const handleExport = () => {
    const exportData: Array<{ Section: string; Metric: string; Value: any }> = [];
    
    // Key Financials
    const financials = [
        { label: "Market Cap", value: data.marketCap },
        { label: "Trailing P/E", value: data.trailingPE },
        { label: "Forward P/E", value: data.forwardPE },
        { label: "Dividend Yield", value: data.dividendYield },
        { label: "Beta", value: data.beta },
        { label: "52-Week High", value: data.fiftyTwoWeekHigh },
        { label: "52-Week Low", value: data.fiftyTwoWeekLow },
        { label: "Volume", value: data.volume },
    ];
    financials.forEach(m => exportData.push({ Section: 'Key Financials', Metric: m.label, Value: m.value ?? 'N/A' }));

    // Business Summary
    exportData.push({ Section: 'Business Summary', Metric: 'Summary', Value: data.longBusinessSummary || '' });

    // Executives
    data.companyOfficers?.forEach((officer: any) => {
        if(officer.name && officer.title) {
            exportData.push({ Section: 'Key Executives', Metric: officer.name, Value: officer.title });
        }
    });

    // Contact
    exportData.push({ Section: 'Contact', Metric: 'Address', Value: `${data.address1 || ''}, ${data.city || ''}, ${data.state || ''} ${data.zip || ''}, ${data.country || ''}` });
    exportData.push({ Section: 'Contact', Metric: 'Phone', Value: data.phone || '' });
    exportData.push({ Section: 'Contact', Metric: 'Website', Value: data.website || '' });
    
    // Risk
    const risks = [
        { label: "Overall Risk", value: data.overallRisk },
        { label: "Board Risk", value: data.boardRisk },
        { label: "Compensation Risk", value: data.compensationRisk },
        { label: "Shareholder Rights", value: data.shareHolderRightsRisk },
    ];
    risks.forEach(r => exportData.push({ Section: 'Governance Risk', Metric: r.label, Value: r.value ?? 'N/A' }));

    exportToCsv(exportData, `${data.symbol}_info.csv`);
  };

  const summary = data.longBusinessSummary || '';
  const shouldTruncate = summary.length > 400;

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-3xl font-bold text-gray-100">{data.longName}</h2>
            <ExportButton onClick={handleExport}>Export All Info to CSV</ExportButton>
        </div>
         <div className="flex items-center space-x-4 text-gray-400 mt-2 text-sm flex-wrap">
            <span className="font-mono bg-gray-700 text-blue-300 px-3 py-1 rounded-md">{data.symbol}</span>
            <span>{data.sector}</span>
            <span className="text-gray-600">&bull;</span>
            <span>{data.industry}</span>
            {data.website && (
                <>
                    <span className="text-gray-600">&bull;</span>
                    <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:underline">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Website
                    </a>
                </>
            )}
        </div>
      </header>

      <InfoCard title="Key Financials">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <Metric label="Market Cap" value={formatLargeNumber(data.marketCap)} />
          <Metric label="Trailing P/E" value={formatValue(data.trailingPE)} />
          <Metric label="Forward P/E" value={formatValue(data.forwardPE)} />
          <Metric label="Dividend Yield" value={formatPercent(data.dividendYield)} />
          <Metric label="Beta" value={formatValue(data.beta)} />
          <Metric label="52-Week High" value={`$${formatValue(data.fiftyTwoWeekHigh)}`} />
          <Metric label="52-Week Low" value={`$${formatValue(data.fiftyTwoWeekLow)}`} />
          <Metric label="Volume" value={data.volume?.toLocaleString() || 'N/A'} />
        </div>
      </InfoCard>

      <InfoCard title="Business Summary">
        <p className="text-gray-300 leading-relaxed whitespace-pre-line">
          {isSummaryExpanded ? summary : `${summary.slice(0, 400)}${shouldTruncate ? '...' : ''}`}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setSummaryExpanded(!isSummaryExpanded)}
            className="text-blue-400 hover:text-blue-300 mt-3 font-semibold"
            aria-expanded={isSummaryExpanded}
          >
            {isSummaryExpanded ? 'Read Less' : 'Read More'}
          </button>
        )}
      </InfoCard>

      {data.companyOfficers && data.companyOfficers.length > 0 && (
          <InfoCard title="Key Executives">
            <ul className="space-y-3">
              {data.companyOfficers.slice(0, 5).map((officer: any, index: number) => officer.name && officer.title && (
                <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm p-2 rounded-md hover:bg-gray-700/50">
                  <span className="font-medium text-gray-200">{officer.name}</span>
                  <span className="text-gray-400 sm:text-right">{officer.title}</span>
                </li>
              ))}
            </ul>
          </InfoCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard title="Contact Information">
            <div className="space-y-2 text-gray-300">
                <p className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    <span>{data.address1}, {data.city}, {data.state} {data.zip}, {data.country}</span>
                </p>
                {data.phone && <p className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    <span>{data.phone}</span>
                </p>}
            </div>
        </InfoCard>

         <InfoCard title="Governance Risk">
            <div className="grid grid-cols-2 gap-4 text-center">
                <Metric label="Overall Risk" value={data.overallRisk ?? 'N/A'} />
                <Metric label="Board Risk" value={data.boardRisk ?? 'N/A'} />
                <Metric label="Compensation Risk" value={data.compensationRisk ?? 'N/A'} />
                <Metric label="Shareholder Rights" value={data.shareHolderRightsRisk ?? 'N/A'} />
            </div>
        </InfoCard>
      </div>

    </div>
  );
};

export default CompanyInfo;
