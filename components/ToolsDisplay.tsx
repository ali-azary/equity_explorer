import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { fetchStockData } from '../services/stockService';

interface ToolsDisplayProps {
  ticker: string;
}

interface SWOTAnalysis {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

const SWOTCard: React.FC<{ title: string; items: string[]; icon: JSX.Element; className: string }> = ({ title, items, icon, className }) => (
    <div className={`bg-gray-900/50 rounded-lg p-4 shadow-md flex flex-col ${className}`}>
        <div className="flex items-center mb-3 border-b border-gray-700 pb-2">
            {icon}
            <h3 className="ml-2 text-lg font-bold">{title}</h3>
        </div>
        <ul className="space-y-2 list-disc list-inside text-gray-300 text-sm flex-grow">
            {items && items.length > 0 ? (
                items.map((item, index) => <li key={index}>{item}</li>)
            ) : (
                <li className="list-none italic text-gray-500">No points generated.</li>
            )}
        </ul>
    </div>
);

const ToolsDisplay: React.FC<ToolsDisplayProps> = ({ ticker }) => {
    const [swotAnalysis, setSwotAnalysis] = useState<SWOTAnalysis | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>('');

    const handleGenerateAnalysis = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSwotAnalysis(null);

        try {
            setLoadingMessage('Fetching company data and news...');
            const [infoRes, newsRes] = await Promise.all([
                fetchStockData(ticker, 'info'),
                fetchStockData(ticker, 'news')
            ]);

            const companyInfo = infoRes.data;
            const newsArticles = newsRes.data.news || [];
            
            const summary = companyInfo.longBusinessSummary || 'No business summary available.';
            const recentNewsTitles = newsArticles.slice(0, 10).map((article: any) => article.content.title).join('\n - ');

            const prompt = `
                Analyze the following company, ${companyInfo.longName} (${ticker}), based on its business summary and recent news headlines. 
                Provide a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats).
                For each category, provide 3-5 concise bullet points.

                **Business Summary:**
                ${summary}

                **Recent News Headlines:**
                 - ${recentNewsTitles}
            `;
            
            setLoadingMessage('Analyzing with AI... This may take a moment.');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The company's key strengths." },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The company's key weaknesses."},
                    opportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Potential opportunities for the company."},
                    threats: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Potential threats to the company."},
                },
                required: ["strengths", "weaknesses", "opportunities", "threats"],
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                    temperature: 0.5,
                }
            });
            
            const resultJson = JSON.parse(response.text.trim());
            setSwotAnalysis(resultJson);

        } catch (err) {
            console.error("Analysis failed:", err);
            if (err instanceof Error) {
                setError(`Failed to generate analysis: ${err.message}`);
            } else {
                setError('An unknown error occurred during analysis.');
            }
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }

    }, [ticker]);

    const ICONS = {
        strengths: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
        weaknesses: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
        opportunities: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
        threats: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    };

    const renderInitial = () => (
        <div className="text-center p-6 bg-gray-900/30 rounded-lg">
            <h2 className="text-2xl font-bold text-blue-300">AI-Powered SWOT Analysis</h2>
            <p className="mt-2 max-w-2xl mx-auto text-gray-400">
                Leverage generative AI to perform a Strengths, Weaknesses, Opportunities, and Threats (SWOT) analysis for {ticker}. The model will analyze the company's business summary and the latest news headlines to provide strategic insights.
            </p>
            <div className="mt-6">
                <button
                    onClick={handleGenerateAnalysis}
                    disabled={loading}
                    className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-6 py-3 text-center disabled:opacity-50 disabled:cursor-wait"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V4z" /><path d="M5 12a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2z" /><path d="M11 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.82-.38z" /></svg>
                    Generate Analysis
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col justify-center items-center p-8 text-center" aria-live="polite">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-400"></div>
                    <p className="mt-4 text-lg text-gray-300">{loadingMessage}</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center py-10 px-4 text-gray-400" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-yellow-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <h3 className="mt-4 text-lg font-semibold text-gray-300">Analysis Failed</h3>
                    <p className="mt-1 text-sm text-gray-500">{error}</p>
                    <button onClick={handleGenerateAnalysis} className="mt-4 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                        Try Again
                    </button>
                </div>
            );
        }
        if (swotAnalysis) {
            return (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                         <h2 className="text-2xl font-bold text-blue-300">SWOT Analysis for {ticker}</h2>
                         <button onClick={handleGenerateAnalysis} className="text-sm text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 12A8 8 0 1012 4" /></svg>
                            Regenerate
                         </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SWOTCard title="Strengths" items={swotAnalysis.strengths} icon={ICONS.strengths} className="text-green-300" />
                        <SWOTCard title="Weaknesses" items={swotAnalysis.weaknesses} icon={ICONS.weaknesses} className="text-red-300" />
                        <SWOTCard title="Opportunities" items={swotAnalysis.opportunities} icon={ICONS.opportunities} className="text-blue-300" />
                        <SWOTCard title="Threats" items={swotAnalysis.threats} icon={ICONS.threats} className="text-yellow-300" />
                    </div>
                </div>
            );
        }
        return renderInitial();
    };

    return (
      <div className="min-h-[400px] flex flex-col justify-center">
        {renderContent()}
      </div>
    );
};

export default ToolsDisplay;
