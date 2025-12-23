import { formatCurrency, formatDuration } from './formatters';

interface QuoteData {
    customerName?: string;
    pieceName: string;
    material: string;
    weight: number;
    time: number;
    quantity: number;
    unitValue: number;
    total: number;
    details: {
        materialCost: number;
        energyCost: number;
        laborCost: number;
        maintenanceCost: number;
        fixedRateCost: number;
        profit: number;
    };
}

export const generateProfessionalQuote = async (data: QuoteData) => {
    // Dynamic imports for better initial load performance
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Color Palette
    const skyBlue = [14, 165, 233]; // #0ea5e9
    const darkSlate = [15, 23, 42]; // #0f172a
    const lightSlate = [100, 116, 139]; // #64748b

    // --- Header ---
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('3D PRINT FLOW', 20, 25);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('INDUSTRIAL EDITION • PRECISION MANUFACTURING', 20, 32);

    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 20, 25, { align: 'right' });

    // --- Quote Title ---
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO DE IMPRESSÃO 3D', 20, 60);

    doc.setDrawColor(skyBlue[0], skyBlue[1], skyBlue[2]);
    doc.setLineWidth(1);
    doc.line(20, 65, 80, 65);

    // --- Customer Info ---
    doc.setFontSize(10);
    doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.text('CLIENTE:', 20, 80);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(data.customerName || 'Consumidor Final', 20, 86);

    // --- Item Table ---
    autoTable(doc, {
        startY: 100,
        head: [['PEÇA/PROJETO', 'MATERIAL', 'QUANTIDADE', 'VALOR UNIT.']],
        body: [[
            data.pieceName,
            data.material,
            data.quantity,
            formatCurrency(data.unitValue)
        ]],
        headStyles: {
            fillColor: skyBlue as any,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' }
        },
        styles: { font: 'helvetica', fontSize: 10 }
    });

    // --- Cost Breakdown Table ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFont('helvetica', 'bold');
    doc.text('DETALHAMENTO TÉCNICO', 20, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        body: [
            ['Peso da Peça', `${data.weight}g`],
            ['Tempo de Impressão', formatDuration(data.time)],
            ['Custo de Material', formatCurrency(data.details.materialCost)],
            ['Energia & Insumos', formatCurrency(data.details.energyCost)],
            ['Mão de Obra', formatCurrency(data.details.laborCost)],
            ['Manutenção Pró-Rata', formatCurrency(data.details.maintenanceCost)],
            ['Custos Operacionais', formatCurrency(data.details.fixedRateCost)]
        ],
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: lightSlate as any, cellWidth: 60 },
            1: { halign: 'right' }
        }
    });

    // --- Total Box ---
    const totalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFillColor(248, 250, 252); // sky-50/50
    doc.roundedRect(pageWidth - 90, totalY, 70, 30, 5, 5, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(pageWidth - 90, totalY, 70, 30, 5, 5, 'D');

    doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    doc.setFontSize(9);
    doc.text('TOTAL DO ORÇAMENTO', pageWidth - 55, totalY + 10, { align: 'center' });

    doc.setTextColor(skyBlue[0], skyBlue[1], skyBlue[2]);
    doc.setFontSize(18);
    doc.text(formatCurrency(data.total), pageWidth - 55, totalY + 22, { align: 'center' });

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);
    const footerText = 'Este orçamento tem validade de 7 dias. O prazo de entrega começa a contar após a aprovação.';
    doc.text(footerText, pageWidth / 2, 280, { align: 'center' });
    doc.text('3D PRINT FLOW - SOLUÇÕES EM MANUFATURA ADITIVA', pageWidth / 2, 285, { align: 'center' });

    // Save PDF
    doc.save(`Orcamento_${data.pieceName.replace(/\s+/g, '_')}.pdf`);
};

interface AnnualReportData {
    year: number;
    totals: {
        revenue: number;
        orders: number;
        expenses: number;
        injections: number;
        withdrawals: number;
    };
    buckets: Array<{
        revenue: number;
        orders: number;
        expenses: number;
        injections: number;
        withdrawals: number;
    }>;
}

export const generateAnnualReportPDF = async (data: AnnualReportData) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const { MONTH_NAMES } = await import('../constants');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Color Palette (Consistent with Quote)
    const skyBlue = [14, 165, 233]; // #0ea5e9
    const darkSlate = [15, 23, 42]; // #0f172a
    const lightSlate = [100, 116, 139]; // #64748b

    // --- Header ---
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('3D PRINT FLOW', 20, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('RELATÓRIO DE BALANÇO ANUAL • GESTÃO FINANCEIRA', 20, 29);

    doc.setFontSize(10);
    doc.text(`ANO: ${data.year}`, pageWidth - 20, 22, { align: 'right' });
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 29, { align: 'right' });

    // --- Summary Section ---
    let yPos = 55;
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO GERAL', 20, yPos);

    doc.setDrawColor(skyBlue[0], skyBlue[1], skyBlue[2]);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 60, yPos + 2);

    yPos += 12;
    const summaryData = [
        ['Faturamento Total', formatCurrency(data.totals.revenue)],
        ['Lucro Líquido (Operacional)', formatCurrency(data.totals.revenue - data.totals.expenses)],
        ['Total de Pedidos', data.totals.orders.toString()],
        ['Despesas Pagas', formatCurrency(data.totals.expenses)],
        ['Aportes de Capital', formatCurrency(data.totals.injections)],
        ['Retiradas de Capital', formatCurrency(data.totals.withdrawals)]
    ];

    autoTable(doc, {
        startY: yPos,
        margin: { left: 20, right: 20 },
        body: summaryData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3, halign: 'center' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 100, textColor: darkSlate as any },
            1: { cellWidth: 'auto' }
        }
    });

    // --- Monthly Breakdown ---
    yPos = (doc as any).lastAutoTable.finalY + 15;
    doc.text('DETALHAMENTO MENSAL', 20, yPos);
    doc.line(20, yPos + 2, 85, yPos + 2);

    yPos += 8;
    const tableData = data.buckets.map((b, i) => [
        MONTH_NAMES[i],
        formatCurrency(b.revenue),
        b.orders,
        formatCurrency(b.expenses),
        formatCurrency(b.revenue - b.expenses),
        formatCurrency(b.injections - b.withdrawals)
    ]);

    autoTable(doc, {
        startY: yPos,
        margin: { left: 20, right: 20 },
        head: [['Mês', 'Receita', 'Peds', 'Despesas', 'Lucro Op.', 'Fluxo Cap.']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: skyBlue as any,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { fontStyle: 'bold', halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center', fontStyle: 'bold' },
            5: { halign: 'center' }
        },
        styles: { fontSize: 8.5, halign: 'center' },
        foot: [[
            'TOTAL ANUAL',
            formatCurrency(data.totals.revenue),
            data.totals.orders.toString(),
            formatCurrency(data.totals.expenses),
            formatCurrency(data.totals.revenue - data.totals.expenses),
            formatCurrency(data.totals.injections - data.totals.withdrawals)
        ]],
        footStyles: {
            fillColor: [241, 245, 249],
            textColor: darkSlate as any,
            fontStyle: 'bold',
            halign: 'center'
        }
    });

    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(lightSlate[0], lightSlate[1], lightSlate[2]);

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text('Gerado automaticamente pelo sistema 3D Print Flow', pageWidth / 2, 285, { align: 'center' });
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, 285, { align: 'right' });
    }

    doc.save(`Balanco_Anual_${data.year}.pdf`);
};
