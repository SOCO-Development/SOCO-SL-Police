import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T> {
  header: string;
  /** Pass a key of the object, or a function that returns a string for this column */
  key: keyof T | ((row: T) => string);
}

export interface ExportConfig<T> {
  filename: string;
  title: string;
  subtitle: string;
  columns: ExportColumn<T>[];
  data: T[];
}

function getCellValue<T>(row: T, colKey: keyof T | ((row: T) => string)): string {
  if (typeof colKey === 'function') {
    return (colKey as (row: T) => string)(row);
  }
  const val = row[colKey];
  if (Array.isArray(val)) {
    return val.join(', ');
  }
  return val !== undefined && val !== null ? String(val) : '—';
}

export function exportTableToExcelHtml<T>(config: ExportConfig<T>) {
  const headers = config.columns.map((c) => c.header);
  
  let tableRows = '';
  config.data.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    const rowClass = isEven ? 'bg-white' : 'bg-zebra';
    
    let tds = '';
    config.columns.forEach((col) => {
      const val = getCellValue(row, col.key);
      tds += `<td>${val}</td>`;
    });

    tableRows += `
      <tr class="${rowClass}">
        ${tds}
      </tr>
    `;
  });

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <style>
          table {
            border-collapse: collapse;
            font-family: 'Segoe UI', Calibri, Arial, sans-serif;
            font-size: 10.5pt;
          }
          th {
            background-color: #1e3a8a;
            color: #ffffff;
            font-weight: bold;
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            text-align: left;
          }
          td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            text-align: left;
            color: #334155;
          }
          .bg-zebra {
            background-color: #f8fafc;
          }
          .title-row td {
            font-size: 16pt;
            font-weight: bold;
            color: #1e3a8a;
            border: none;
            padding-bottom: 5px;
          }
          .subtitle-row td {
            font-size: 10pt;
            color: #64748b;
            border: none;
            padding-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <table>
          <tr class="title-row">
            <td colspan="${headers.length}">${config.title}</td>
          </tr>
          <tr class="subtitle-row">
            <td colspan="${headers.length}">${config.subtitle} | Generated: ${new Date().toLocaleString()}</td>
          </tr>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  // Ensure the filename has .xls extension
  const finalFilename = config.filename.endsWith('.xls') ? config.filename : `${config.filename}.xls`;
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTableToPdf<T>(config: ExportConfig<T>) {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.setProperties({
    title: config.title,
    subject: config.subtitle,
    author: 'Sri Lanka Police',
    creator: 'SOCO SL Police Web Application'
  });

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // #1e3a8a (Navy Blue)
  doc.text(config.title.toUpperCase(), 14, 18);

  // Header Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // #6b7280
  doc.text(`${config.subtitle} | Generated: ${new Date().toLocaleString()}`, 14, 24);

  // Underline header
  doc.setDrawColor(59, 130, 246); // #3b82f6
  doc.setLineWidth(0.8);
  doc.line(14, 27, 283, 27);

  const head = [config.columns.map(c => c.header)];
  const body = config.data.map(row => config.columns.map(col => getCellValue(row, col.key)));

  autoTable(doc, {
      startY: 32,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, valign: 'top' },
      alternateRowStyles: { fillColor: [243, 244, 246] },
  });

  const finalFilename = config.filename.endsWith('.pdf') ? config.filename : `${config.filename}.pdf`;
  doc.save(finalFilename);
}
