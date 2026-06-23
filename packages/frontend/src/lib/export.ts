import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  key: string;
  format?: (value: unknown) => string | number;
}

export interface FundInfo {
  nombre: string;
  nombreCompleto: string;
  nit: string;
  representante: string;
}

let cachedFundInfo: FundInfo | null = null;

async function fetchFundInfo(): Promise<FundInfo> {
  if (cachedFundInfo) return cachedFundInfo;
  try {
    const { apiGetConfiguraciones } = await import('./api');
    const configs = await apiGetConfiguraciones();
    const get = (clave: string, fallback: string) =>
      configs.find((c) => c.clave === clave)?.valor ?? fallback;
    cachedFundInfo = {
      nombre: get('nombre_institucion', 'FONEVI').split(' ')[0] ?? 'FONEVI',
      nombreCompleto: get('nombre_institucion', 'Fondo de Empleados Docentes FONEVI'),
      nit: get('nit_institucion', '800.123.456-7'),
      representante: get('representante', 'Alexander Diaz'),
    };
    return cachedFundInfo;
  } catch {
    return {
      nombre: 'FONEVI',
      nombreCompleto: 'Fondo de Empleados Docentes FONEVI',
      nit: '800.123.456-7',
      representante: 'Alexander Diaz',
    };
  }
}

function loadSvgAsPng(svgUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 46;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 48, 46);
      ctx.drawImage(img, 0, 0, 48, 46);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = svgUrl;
  });
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
): void {
  const rows = data.map((item) => {
    const row: Record<string, string | number> = {};
    for (const col of columns) {
      const value = item[col.key];
      row[col.header] = col.format ? col.format(value) : (value ?? '');
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = columns.map((col) => ({
    wch: Math.max(col.header.length, 12),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  const ext = filename.endsWith('.xlsx') ? '' : '.xlsx';
  XLSX.writeFile(wb, `${filename}${ext}`);
}

export async function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  titulo: string,
  filename: string,
  fundInfo?: FundInfo,
): Promise<void> {
  if (!fundInfo) fundInfo = await fetchFundInfo();
  const doc = new jsPDF('landscape', 'mm', 'letter');

  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadSvgAsPng('/favicon.svg');
  } catch {
    // proceed without logo
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // ── Header bar ──
  doc.setFillColor(52, 40, 102);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(fundInfo.nombreCompleto, margin + 12, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIT: ${fundInfo.nit}`, margin + 12, 24);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin + 2, 8, 9, 9);
  }

  // ── Separator line ──
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 40, pageWidth - margin, 40);

  // ── Title & date ──
  doc.setTextColor(52, 40, 102);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, margin, 52);

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado: ${dateStr}`, pageWidth - margin, 52, { align: 'right' });

  // ── Table ──
  const headers = columns.map((c) => c.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      return col.format ? col.format(value) : (value ?? '');
    }),
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 58,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [210, 210, 210],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [52, 40, 102],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 247, 252],
    },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.3,
  });

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${fundInfo.nombreCompleto} - NIT ${fundInfo.nit} | ${fundInfo.representante}`,
      margin,
      doc.internal.pageSize.getHeight() - 8,
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' },
    );
  }

  const ext = filename.endsWith('.pdf') ? '' : '.pdf';
  doc.save(`${filename}${ext}`);
}
