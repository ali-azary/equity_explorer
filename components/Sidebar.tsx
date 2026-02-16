import React, { useState } from 'react';

const DATA_VIEWS = [
  { key: 'history', label: 'History' },
  { key: 'info', label: 'Info' },
  { key: 'news', label: 'News' },
  { key: 'actions', label: 'Actions' },
  { key: 'financials', label: 'Financials' },
  { key: 'recommendations', label: 'Recommendations' },
  { key: 'holders', label: 'Holders' },
];

const TOOLS_VIEWS = [
  { key: 'swot', label: 'SWOT Analysis' },
  { key: 'var_es_engine', label: 'VaR/ES Engine' },
  { key: 'vol_corr_lab', label: 'Vol & Corr Lab' },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isLoading: boolean;
}

const NavLink: React.FC<{
  viewKey: string;
  label: string;
  isActive: boolean;
  onClick: (view: string) => void;
  disabled: boolean;
}> = ({ viewKey, label, isActive, onClick, disabled }) => (
  <li>
    <button
      onClick={() => onClick(viewKey)}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 flex items-center ${
        isActive
          ? 'bg-blue-600 text-white font-semibold'
          : 'text-gray-300 hover:bg-gray-700/80 hover:text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </button>
  </li>
);

const NavSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, children }) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 focus:outline-none transition-colors"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transform transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}
      >
        <ul className="mt-1 space-y-1">
          {children}
        </ul>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isLoading }) => {
  const isDataView = DATA_VIEWS.some(v => v.key === activeView);
  const [isDataOpen, setIsDataOpen] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(true);

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-800 p-4 flex flex-col space-y-6 border-r border-gray-700/60">
      <header>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400">
          Equity Explorer
        </h1>
      </header>

      <nav className="flex-grow">
        <div className="space-y-4">
          <NavSection title="Data" isOpen={isDataOpen} onToggle={() => setIsDataOpen(!isDataOpen)}>
            {DATA_VIEWS.map(({ key, label }) => (
              <NavLink
                key={key}
                viewKey={key}
                label={label}
                isActive={activeView === key}
                onClick={onViewChange}
                disabled={isLoading && isDataView}
              />
            ))}
          </NavSection>

          <NavSection title="Tools" isOpen={isToolsOpen} onToggle={() => setIsToolsOpen(!isToolsOpen)}>
            {TOOLS_VIEWS.map(({ key, label }) => (
              <NavLink
                key={key}
                viewKey={key}
                label={label}
                isActive={activeView === key}
                onClick={onViewChange}
                disabled={false} 
              />
            ))}
          </NavSection>
        </div>
      </nav>

      <footer className="text-center text-gray-500 text-xs">
        <p>Not for financial advice.</p>
      </footer>
    </aside>
  );
};

export default Sidebar;