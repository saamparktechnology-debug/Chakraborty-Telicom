import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const allRows = [headers, ...rows];
  const csvContent = allRows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTablePdf(options: {
  filename: string;
  title: string;
  subtitle: string;
  headers: string[];
  rows: (string | number)[][];
}): void {
  const doc = new jsPDF();
  doc.setFontSize(15);
  doc.text(options.title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(options.subtitle, 14, 25);

  autoTable(doc, {
    startY: 31,
    head: [options.headers],
    body: options.rows.map((r) => r.map((c) => String(c))),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 27, 75] },
  });

  doc.save(options.filename);
}

export function formatInr(amount: string | number): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
  if (Number.isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
