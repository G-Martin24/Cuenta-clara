import { jsPDF } from 'jspdf';
import { CurrencyCode } from '../types';
import { formatCurrency, formatDateAr } from '../utils/formatters';

export interface MonthlyReportData {
  userName: string;
  monthKey: string;
  monthLabel: string;
  currency: CurrencyCode;
  totalIncome: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalCommitted: number;
  projectedSurplus: number;
  suggestedSavingsMonthly: number;
  suggestedSavingsDaily: number;
  paidBills: Array<{
    accountName: string;
    category?: string;
    paidDate?: string;
    dueDate?: string;
    paymentMethod?: string;
    receiptNumber?: string;
    amount: number;
  }>;
  pendingBills: Array<{
    accountName: string;
    category?: string;
    dueDate: string;
    status: string;
    amount: number;
  }>;
  savingsGoals?: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution?: number;
  }>;
}

/**
 * Generates and downloads a clean, vector-rendered PDF summary of the selected month.
 */
export function exportMonthlyReportToPdf(data: MonthlyReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 16;
      drawPageHeader(true);
    }
  };

  const drawPageHeader = (isContinuation = false) => {
    if (isContinuation) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `CUENTA CLARA • Resumen ${data.monthLabel.toUpperCase()} (Continuación)`,
        marginX,
        currentY
      );
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, currentY + 2, pageWidth - marginX, currentY + 2);
      currentY += 8;
    }
  };

  // ----------------------------------------------------
  // 1. BRAND HEADER
  // ----------------------------------------------------
  // Top Banner background
  doc.setFillColor(15, 118, 110); // Teal #0f766e
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2.5, 2.5, 'F');

  // Title inside banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('CUENTA CLARA', marginX + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(204, 251, 241); // Light teal
  doc.text('Resumen Financiero Mensual', marginX + 6, currentY + 16);

  // Right side of banner: Month and Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(data.monthLabel, pageWidth - marginX - 6, currentY + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(204, 251, 241);
  const printDateStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generado: ${printDateStr}`, pageWidth - marginX - 6, currentY + 15, { align: 'right' });
  doc.text(`Titular: ${data.userName || 'Usuario'}`, pageWidth - marginX - 6, currentY + 20, { align: 'right' });

  currentY += 28;

  // ----------------------------------------------------
  // 2. EXECUTIVE SUMMARY CARDS (4 KPIs)
  // ----------------------------------------------------
  const cardGap = 3;
  const numCards = 4;
  const cardWidth = (contentWidth - cardGap * (numCards - 1)) / numCards;
  const cardHeight = 18;

  const kpis = [
    {
      title: 'PAGADO',
      value: formatCurrency(data.totalPaid, data.currency),
      sub: `${data.paidBills.length} cancelados`,
      color: [16, 185, 129], // Emerald
      bg: [240, 253, 244],
    },
    {
      title: 'PENDIENTE',
      value: formatCurrency(data.totalPending, data.currency),
      sub: `${data.pendingBills.length} por pagar`,
      color: [245, 158, 11], // Amber
      bg: [254, 252, 232],
    },
    {
      title: 'INGRESOS',
      value: formatCurrency(data.totalIncome, data.currency),
      sub: 'Proyectado mes',
      color: [14, 165, 233], // Sky
      bg: [240, 249, 255],
    },
    {
      title: 'EXCEDENTE / AHORRO',
      value: formatCurrency(Math.max(0, data.projectedSurplus), data.currency),
      sub: data.projectedSurplus > 0 ? 'Superávit libre' : 'Al límite',
      color: [15, 118, 110], // Teal
      bg: [240, 253, 250],
    },
  ];

  kpis.forEach((k, idx) => {
    const x = marginX + idx * (cardWidth + cardGap);
    // Card background
    doc.setFillColor(k.bg[0], k.bg[1], k.bg[2]);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    // Card border
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    // Indicator bar
    doc.setFillColor(k.color[0], k.color[1], k.color[2]);
    doc.rect(x, currentY, cardWidth, 1.2, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(k.title, x + 2.5, currentY + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(k.value, x + 2.5, currentY + 11.5);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(k.sub, x + 2.5, currentY + 15.5);
  });

  currentY += cardHeight + 6;

  // ----------------------------------------------------
  // 3. TABLE: GASTOS PAGADOS
  // ----------------------------------------------------
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Detalle de Gastos Pagados', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Subtotal abonado: ${formatCurrency(data.totalPaid, data.currency)}`, pageWidth - marginX, currentY, {
    align: 'right',
  });

  currentY += 3.5;

  // Table header
  const renderTableHeader = (cols: Array<{ label: string; x: number; align?: 'left' | 'right' }>) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    cols.forEach((col) => {
      doc.text(col.label, col.x, currentY + 4.2, { align: col.align || 'left' });
    });
    currentY += 6;
  };

  const paidCols = [
    { label: 'SERVICIO / CUENTA', x: marginX + 3 },
    { label: 'CATEGORÍA', x: marginX + 58 },
    { label: 'FECHA PAGO', x: marginX + 105 },
    { label: 'MEDIO DE PAGO / REF', x: marginX + 133 },
    { label: 'IMPORTE', x: pageWidth - marginX - 3, align: 'right' as const },
  ];

  renderTableHeader(paidCols);

  if (data.paidBills.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('No se registraron pagos durante este período.', marginX + 4, currentY + 4.5);
    currentY += 8;
  } else {
    data.paidBills.forEach((bill, idx) => {
      checkPageBreak(8);
      // Alternate row tint
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, currentY, contentWidth, 6, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const accName = bill.accountName.length > 28 ? bill.accountName.slice(0, 26) + '...' : bill.accountName;
      doc.text(accName, marginX + 3, currentY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const cat = (bill.category || 'General').slice(0, 24);
      doc.text(cat, marginX + 58, currentY + 4.2);

      const pDate = bill.paidDate || bill.dueDate || '-';
      doc.text(formatDateAr(pDate), marginX + 105, currentY + 4.2);

      const method = (bill.paymentMethod || 'Registrado').slice(0, 20);
      doc.text(method, marginX + 133, currentY + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(formatCurrency(bill.amount, data.currency), pageWidth - marginX - 3, currentY + 4.2, {
        align: 'right',
      });

      currentY += 6;
    });

    // Subtotal bottom border
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 5;
  }

  // ----------------------------------------------------
  // 4. TABLE: GASTOS PENDIENTES Y VENCIDOS
  // ----------------------------------------------------
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Detalle de Gastos Pendientes y Vencidos', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Total a liquidar: ${formatCurrency(data.totalPending, data.currency)}`,
    pageWidth - marginX,
    currentY,
    { align: 'right' }
  );

  currentY += 3.5;

  const pendingCols = [
    { label: 'SERVICIO / CUENTA', x: marginX + 3 },
    { label: 'CATEGORÍA', x: marginX + 62 },
    { label: 'VENCIMIENTO', x: marginX + 115 },
    { label: 'ESTADO', x: marginX + 145 },
    { label: 'IMPORTE', x: pageWidth - marginX - 3, align: 'right' as const },
  ];

  renderTableHeader(pendingCols);

  if (data.pendingBills.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('¡Todo al día! No tenés cuentas pendientes para este mes.', marginX + 4, currentY + 4.5);
    currentY += 8;
  } else {
    data.pendingBills.forEach((bill, idx) => {
      checkPageBreak(8);
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, currentY, contentWidth, 6, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const accName = bill.accountName.length > 30 ? bill.accountName.slice(0, 28) + '...' : bill.accountName;
      doc.text(accName, marginX + 3, currentY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const cat = (bill.category || 'General').slice(0, 26);
      doc.text(cat, marginX + 62, currentY + 4.2);

      doc.text(formatDateAr(bill.dueDate), marginX + 115, currentY + 4.2);

      // Status pill / tag
      const isOverdue = bill.status === 'overdue';
      doc.setFont('helvetica', 'bold');
      if (isOverdue) {
        doc.setTextColor(225, 29, 72); // Rose
        doc.text('Vencido', marginX + 145, currentY + 4.2);
      } else {
        doc.setTextColor(217, 119, 6); // Amber
        doc.text('Pendiente', marginX + 145, currentY + 4.2);
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(bill.amount, data.currency), pageWidth - marginX - 3, currentY + 4.2, {
        align: 'right',
      });

      currentY += 6;
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 5;
  }

  // ----------------------------------------------------
  // 5. SECCIÓN DE AHORRO Y BALANCE PROYECTADO
  // ----------------------------------------------------
  checkPageBreak(40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Análisis de Ahorro y Balance Proyectado', marginX, currentY);
  currentY += 4.5;

  // Box highlighting savings
  doc.setFillColor(240, 253, 250); // Teal light
  doc.roundedRect(marginX, currentY, contentWidth, 26, 2, 2, 'F');
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(marginX, currentY, contentWidth, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('CAPACIDAD Y META DE AHORRO RECOMENDADA', marginX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const surplusText = `• Excedente libre proyectado del mes: ${formatCurrency(Math.max(0, data.projectedSurplus), data.currency)} (Ingresos: ${formatCurrency(data.totalIncome, data.currency)} - Gastos Recurrentes: ${formatCurrency(data.totalCommitted, data.currency)})`;
  doc.text(surplusText, marginX + 4, currentY + 11.5);

  const monthlySavingsText = `• Sugerencia de Ahorro Mensual (50% del excedente): ${formatCurrency(data.suggestedSavingsMonthly, data.currency)} / mes`;
  doc.text(monthlySavingsText, marginX + 4, currentY + 16.5);

  const dailySavingsText = `• Ritmo de Ahorro Diario recomendado: ${formatCurrency(data.suggestedSavingsDaily, data.currency)} / día para alcanzar la reserva mensual sin ajustar tus gastos diarios.`;
  doc.text(dailySavingsText, marginX + 4, currentY + 21.5);

  currentY += 30;

  // ----------------------------------------------------
  // 6. METAS DE AHORRO VINCULADAS (SI EXISTEN)
  // ----------------------------------------------------
  if (data.savingsGoals && data.savingsGoals.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Objetivos de Ahorro Personales Activos:', marginX, currentY);
    currentY += 4;

    data.savingsGoals.slice(0, 4).forEach((g) => {
      checkPageBreak(6);
      const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `• ${g.name}: ${formatCurrency(g.currentAmount, data.currency)} de ${formatCurrency(g.targetAmount, data.currency)} (${pct}% completado)`,
        marginX + 3,
        currentY
      );
      currentY += 4.5;
    });
    currentY += 2;
  }

  // ----------------------------------------------------
  // FOOTER ON ALL PAGES
  // ----------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Cuenta Clara • Control Inteligente de Cuentas, Servicios y Ahorro',
      marginX,
      pageHeight - 7.5
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 7.5,
      { align: 'right' }
    );
  }

  // Trigger browser download
  const cleanMonthKey = data.monthKey.replace(/[^0-9-]/g, '');
  doc.save(`cuenta-clara-resumen-${cleanMonthKey}.pdf`);
}
