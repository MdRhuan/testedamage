import Papa from "papaparse";

/**
 * Generic CSV export utility
 * @param data - Array of objects to export
 * @param filename - Output filename
 * @param transform - Optional function to transform data before export
 */
export function exportToCSV<T>(
  data: T[],
  filename: string,
  transform?: (item: T) => Record<string, any>
): void {
  const transformedData: Record<string, any>[] = transform ? data.map(transform) : data as any;
  const csv = Papa.unparse(transformedData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
