
import * as XLSX from 'xlsx';

/**
 * Utility function to export an array of objects to an Excel file.
 * @param data Array of objects to export.
 * @param fileName Name of the file (without extension).
 */
export function exportToExcel(data: any[], fileName: string) {
  if (!data || data.length === 0) return;

  // Create a new worksheet from the JSON data
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
  // Trigger the download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
