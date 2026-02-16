
const convertToCSV = (data: any[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')]; // Header row

  for (const row of data) {
    const values = headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
      cell = cell.replace(/"/g, '""'); // Escape double quotes
      if (cell.search(/("|,|\n)/g) >= 0) {
        cell = `"${cell}"`; // Enclose in double quotes if it contains commas, quotes, or newlines
      }
      return cell;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

export const exportToCsv = (data: any[], filename: string) => {
  const csvString = convertToCSV(data);
  if (!csvString) {
    console.error("CSV string is empty, aborting download.");
    return;
  }
  
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
