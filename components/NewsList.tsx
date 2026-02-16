import React from 'react';
import { exportToCsv } from '../utils/csvExporter';
import ExportButton from './ExportButton';

// Using `any` as the API response can be complex and this is sufficient for this display component.
interface NewsListProps {
  articles: any[];
  ticker: string;
}

const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (isNaN(seconds) || seconds < 0) return '';

  let interval = seconds / 31536000;
  if (interval > 1) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    const months = Math.floor(interval);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  interval = seconds / 3600;
  if (interval > 1) {
    const hours = Math.floor(interval);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  interval = seconds / 60;
  if (interval > 1) {
    const minutes = Math.floor(interval);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return `Just now`;
};


const NewsList: React.FC<NewsListProps> = ({ articles, ticker }) => {
  if (!articles || articles.length === 0) {
    return <p className="text-center text-gray-400">No news available for this ticker.</p>;
  }

  const handleExport = () => {
    const exportData = articles.map(article => {
        const { content } = article;
        return {
            title: content?.title,
            summary: content?.summary,
            provider: content?.provider?.displayName,
            published_date: content?.pubDate,
            url: content?.canonicalUrl?.url
        };
    }).filter(Boolean);
    exportToCsv(exportData, `${ticker}_news.csv`);
  };

  return (
    <div>
        <div className="flex justify-end mb-4">
            <ExportButton onClick={handleExport}>Export News to CSV</ExportButton>
        </div>
        <div className="space-y-4">
        {articles.map((article) => {
            const { content } = article;
            if (!content) return null;

            // Find a suitable thumbnail. Prioritize smaller, non-original resolutions.
            const thumbnail = content.thumbnail?.resolutions.find((r: any) => r.width < 300 && r.width > 100) || content.thumbnail?.resolutions.slice(-1)[0];

            return (
            <a
                key={article.id}
                href={content.canonicalUrl?.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read article: ${content.title}`}
                className="block bg-gray-900/50 hover:bg-gray-800/70 p-4 rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            >
                <article className="flex items-start sm:items-center gap-4">
                {thumbnail?.url && (
                    <img
                        src={thumbnail.url}
                        alt="" // Alt text is empty because the entire card links to the article which has a title
                        className="w-24 h-24 sm:w-32 sm:h-24 object-cover rounded-md flex-shrink-0 bg-gray-700"
                    />
                )}
                <div className="flex-1">
                    <div className="flex items-center text-xs text-gray-400 mb-1 flex-wrap">
                    {content.provider?.displayName && <span className="font-semibold">{content.provider.displayName}</span>}
                    {content.pubDate && (
                        <>
                        <span className="mx-2" aria-hidden="true">&bull;</span>
                        <time dateTime={content.pubDate}>{formatTimeAgo(content.pubDate)}</time>
                        </>
                    )}
                    </div>
                    <h3 className="text-md sm:text-lg font-bold text-gray-100 group-hover:text-blue-400 transition-colors">
                    {content.title}
                    </h3>
                    {content.summary && (
                    <p className="text-sm text-gray-300 mt-2 hidden md:block">
                        {content.summary}
                    </p>
                    )}
                </div>
                </article>
            </a>
            );
        })}
        </div>
    </div>
  );
};

export default NewsList;