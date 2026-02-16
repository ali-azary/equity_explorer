import React from 'react';
import { exportToJson } from '../utils/jsonExporter';
import ExportButton from './ExportButton';

interface JsonViewerProps {
  data: any;
  ticker: string;
  dataType: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, ticker, dataType }) => {

  const handleExport = () => {
    exportToJson(data, `${ticker}_${dataType}.json`);
  };

  return (
    <div>
        <div className="flex justify-end mb-4">
            <ExportButton onClick={handleExport}>Export to JSON</ExportButton>
        </div>
        <div className="bg-gray-900/70 rounded-lg p-4 overflow-x-auto shadow-inner">
        <pre className="text-sm text-gray-200 whitespace-pre-wrap break-all font-mono">
            <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
        </div>
    </div>
  );
};

export default JsonViewer;