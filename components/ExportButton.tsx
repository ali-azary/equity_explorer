
import React from 'react';

interface ExportButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onClick, children, className }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md bg-gray-600/50 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {children}
    </button>
  );
};

export default ExportButton;
