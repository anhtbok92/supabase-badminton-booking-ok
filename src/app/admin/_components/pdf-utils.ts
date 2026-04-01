import { jsPDF } from 'jspdf';
import { ROBOTO_FONT } from './roboto-font';

export type GuideType = 'user' | 'owner';

export function createPdfDoc(): jsPDF {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.addFileToVFS('Roboto.ttf', ROBOTO_FONT);
    doc.addFont('Roboto.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
    return doc;
}

export const COLORS = {
    primary: [76, 175, 80] as [number, number, number],
    primaryDark: [56, 142, 60] as [number, number, number],
    accent: [255, 152, 0] as [number, number, number],
    dark: [33, 33, 33] as [number, number, number],
    text: [66, 66, 66] as [number, number, number],
    lightText: [117, 117, 117] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    lightBg: [241, 248, 233] as [number, number, number],
    border: [200, 200, 200] as [number, number, number],
    tableBg: [232, 245, 233] as [number, number, number],
    warningBg: [255, 243, 224] as [number, number, number],
};

export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const MARGIN = 20;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function addPage(doc: jsPDF): number {
    doc.addPage();
    return MARGIN;
}

export function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > PAGE_HEIGHT - 30) return addPage(doc);
    return y;
}

export function drawHeader(doc: jsPDF, title: string, subtitle: string, guideType: GuideType): number {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE_WIDTH, 80, 'F');
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 80, PAGE_WIDTH, 4, 'F');

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(28);
    doc.text(title, PAGE_WIDTH / 2, 35, { align: 'center' });
    doc.setFontSize(14);
    doc.text(subtitle, PAGE_WIDTH / 2, 50, { align: 'center' });

    const badgeText = guideType === 'user' ? 'DÀNH CHO NGƯỜI ĐẶT SÂN' : 'DÀNH CHO CHỦ SÂN';
    doc.setFillColor(...COLORS.accent);
    const badgeWidth = doc.getTextWidth(badgeText) + 20;
    doc.roundedRect((PAGE_WIDTH - badgeWidth) / 2, 58, badgeWidth, 14, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.text(badgeText, PAGE_WIDTH / 2, 67, { align: 'center' });
    return 100;
}

export function drawSectionTitle(doc: jsPDF, y: number, num: string, title: string): number {
    y = checkPageBreak(doc, y, 20);
    doc.setFillColor(...COLORS.primary);
    doc.circle(MARGIN + 8, y + 4, 8, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(12);
    doc.text(num, MARGIN + 8, y + 7, { align: 'center' });
    doc.setTextColor(...COLORS.primaryDark);
    doc.setFontSize(16);
    doc.text(title, MARGIN + 22, y + 8);
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 14, MARGIN + CONTENT_WIDTH, y + 14);
    return y + 22;
}

export function drawSubSection(doc: jsPDF, y: number, title: string): number {
    y = checkPageBreak(doc, y, 15);
    doc.setTextColor(...COLORS.accent);
    doc.setFontSize(13);
    doc.text('▸ ' + title, MARGIN + 5, y);
    return y + 8;
}

export function drawParagraph(doc: jsPDF, y: number, text: string): number {
    y = checkPageBreak(doc, y, 10);
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 10);
    doc.text(lines, MARGIN + 5, y);
    return y + lines.length * 5 + 3;
}

export function drawBulletPoint(doc: jsPDF, y: number, text: string, indent: number = 0): number {
    y = checkPageBreak(doc, y, 8);
    const x = MARGIN + 10 + indent;
    doc.setFillColor(...COLORS.primary);
    doc.circle(x, y - 1.5, 1.5, 'F');
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 20 - indent);
    doc.text(lines, x + 5, y);
    return y + lines.length * 5 + 2;
}

export function drawStepBox(doc: jsPDF, y: number, stepNum: number, title: string, description: string): number {
    y = checkPageBreak(doc, y, 25);
    doc.setFillColor(...COLORS.lightBg);
    const descLines = doc.splitTextToSize(description, CONTENT_WIDTH - 40);
    const boxHeight = 12 + descLines.length * 5 + 5;
    doc.roundedRect(MARGIN + 5, y - 5, CONTENT_WIDTH - 10, boxHeight, 3, 3, 'F');

    doc.setFillColor(...COLORS.accent);
    doc.circle(MARGIN + 15, y + 2, 6, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.text(String(stepNum), MARGIN + 15, y + 5, { align: 'center' });

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.text(title, MARGIN + 25, y + 5);

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.text(descLines, MARGIN + 25, y + 12);
    return y + boxHeight + 5;
}

export function drawInfoBox(doc: jsPDF, y: number, title: string, content: string, type: 'info' | 'warning' = 'info'): number {
    y = checkPageBreak(doc, y, 25);
    const bgColor = type === 'info' ? COLORS.tableBg : COLORS.warningBg;
    const borderColor = type === 'info' ? COLORS.primary : COLORS.accent;
    const lines = doc.splitTextToSize(content, CONTENT_WIDTH - 25);
    const boxHeight = 15 + lines.length * 5 + 5;

    doc.setFillColor(...bgColor);
    doc.roundedRect(MARGIN + 5, y - 3, CONTENT_WIDTH - 10, boxHeight, 3, 3, 'F');
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(1);
    doc.line(MARGIN + 5, y - 3, MARGIN + 5, y - 3 + boxHeight);

    doc.setTextColor(...borderColor);
    doc.setFontSize(10);
    doc.text((type === 'info' ? 'ℹ ' : '⚠ ') + title, MARGIN + 12, y + 5);
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.text(lines, MARGIN + 12, y + 13);
    return y + boxHeight + 5;
}

export function drawTable(doc: jsPDF, y: number, headers: string[], rows: string[][]): number {
    y = checkPageBreak(doc, y, 15 + rows.length * 10);
    const colWidth = (CONTENT_WIDTH - 10) / headers.length;

    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN + 5, y, CONTENT_WIDTH - 10, 10, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    headers.forEach((header, i) => {
        doc.text(header, MARGIN + 8 + i * colWidth, y + 7);
    });
    y += 10;

    rows.forEach((row, rowIndex) => {
        y = checkPageBreak(doc, y, 10);
        if (rowIndex % 2 === 0) {
            doc.setFillColor(...COLORS.tableBg);
            doc.rect(MARGIN + 5, y, CONTENT_WIDTH - 10, 10, 'F');
        }
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(9);
        row.forEach((cell, i) => {
            doc.text(cell, MARGIN + 8 + i * colWidth, y + 7);
        });
        y += 10;
    });
    return y + 5;
}

export function drawTableOfContents(doc: jsPDF, y: number, items: { num: string; title: string }[]): number {
    y = checkPageBreak(doc, y, 10);
    doc.setFillColor(...COLORS.lightBg);
    const boxHeight = 15 + items.length * 8;
    doc.roundedRect(MARGIN + 10, y - 5, CONTENT_WIDTH - 20, boxHeight, 5, 5, 'F');
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(1);
    doc.roundedRect(MARGIN + 10, y - 5, CONTENT_WIDTH - 20, boxHeight, 5, 5, 'S');

    doc.setTextColor(...COLORS.primaryDark);
    doc.setFontSize(14);
    doc.text('MỤC LỤC', PAGE_WIDTH / 2, y + 5, { align: 'center' });
    y += 12;

    items.forEach((item) => {
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(10);
        doc.text(item.num + '.', MARGIN + 20, y);
        doc.setTextColor(...COLORS.dark);
        doc.text(item.title, MARGIN + 30, y);
        y += 8;
    });
    return y + 10;
}

export function drawFaqSection(doc: jsPDF, y: number, faqs: { q: string; a: string }[]): number {
    faqs.forEach((faq, i) => {
        y = checkPageBreak(doc, y, 25);
        const faqBg = i % 2 === 0 ? COLORS.lightBg : COLORS.white;
        doc.setFillColor(...faqBg);
        const aLines = doc.splitTextToSize('Trả lời: ' + faq.a, CONTENT_WIDTH - 20);
        const faqHeight = 12 + aLines.length * 5 + 5;
        doc.roundedRect(MARGIN + 5, y - 3, CONTENT_WIDTH - 10, faqHeight, 2, 2, 'F');

        doc.setTextColor(...COLORS.primaryDark);
        doc.setFontSize(10);
        doc.text('Hỏi: ' + faq.q, MARGIN + 10, y + 5);
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(9);
        doc.text(aLines, MARGIN + 10, y + 12);
        y += faqHeight + 3;
    });
    return y;
}

export function drawContactBox(doc: jsPDF, y: number, title: string, lines: string[]): number {
    y = checkPageBreak(doc, y, 35);
    y += 5;
    const boxHeight = 10 + lines.length * 8 + 5;
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(MARGIN + 10, y, CONTENT_WIDTH - 20, boxHeight, 5, 5, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(12);
    doc.text(title, PAGE_WIDTH / 2, y + 10, { align: 'center' });
    doc.setFontSize(9);
    lines.forEach((line, i) => {
        doc.text(line, PAGE_WIDTH / 2, y + 18 + i * 6, { align: 'center' });
    });
    return y + boxHeight + 5;
}

export function addPageNumbers(doc: jsPDF) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, PAGE_HEIGHT - 15, PAGE_WIDTH, 15, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(8);
        doc.text('Sport Booking - Hệ thống đặt sân cầu lông online', MARGIN, PAGE_HEIGHT - 6);
        doc.text(`Trang ${i}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 6, { align: 'right' });
    }
}
