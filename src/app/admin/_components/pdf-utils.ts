import { jsPDF } from 'jspdf';
import { ROBOTO_FONT } from './roboto-font';
import { FAVICON_BASE64 } from './favicon-base64';

export type GuideType = 'user' | 'owner';

const CONTACT_PHONE = '0982.949.974';
const CONTACT_EMAIL = 'victory1080@gmail.com';

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

// ===== FIX #1: Header với Logo favicon =====
export function drawHeader(doc: jsPDF, title: string, subtitle: string, guideType: GuideType): number {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, PAGE_WIDTH, 85, 'F');
    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 85, PAGE_WIDTH, 4, 'F');

    // Logo favicon ở giữa trên cùng
    try {
        doc.addImage(FAVICON_BASE64, 'PNG', PAGE_WIDTH / 2 - 8, 8, 16, 16);
    } catch (_) { /* ignore if image fails */ }

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(26);
    doc.text(title, PAGE_WIDTH / 2, 38, { align: 'center' });
    doc.setFontSize(13);
    doc.text(subtitle, PAGE_WIDTH / 2, 50, { align: 'center' });

    // Brand name
    doc.setFontSize(9);
    doc.text('SportBooking', PAGE_WIDTH / 2, 58, { align: 'center' });

    const badgeText = guideType === 'user' ? 'DÀNH CHO NGƯỜI ĐẶT SÂN' : 'DÀNH CHO CHỦ SÂN';
    doc.setFillColor(...COLORS.accent);
    const badgeWidth = doc.getTextWidth(badgeText) + 20;
    doc.roundedRect((PAGE_WIDTH - badgeWidth) / 2, 63, badgeWidth, 14, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.text(badgeText, PAGE_WIDTH / 2, 72, { align: 'center' });
    return 105;
}

// ===== Section title - số căn giữa hình tròn =====
export function drawSectionTitle(doc: jsPDF, y: number, num: string, title: string): number {
    y = checkPageBreak(doc, y, 20);
    const circleX = MARGIN + 8;
    const circleY = y + 5;
    const circleR = 8;

    doc.setFillColor(...COLORS.primary);
    doc.circle(circleX, circleY, circleR, 'F');

    // Căn giữa số: dùng align center cho ngang, +1.5mm cho dọc (font 12pt ~ 4.2mm, baseline offset ~1.5)
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(12);
    doc.text(num, circleX, circleY + 1.5, { align: 'center' });

    doc.setTextColor(...COLORS.primaryDark);
    doc.setFontSize(16);
    doc.text(title, MARGIN + 22, y + 9);

    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 15, MARGIN + CONTENT_WIDTH, y + 15);
    return y + 23;
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

// ===== Step box - số căn giữa hình tròn =====
export function drawStepBox(doc: jsPDF, y: number, stepNum: number, title: string, description: string): number {
    y = checkPageBreak(doc, y, 25);
    doc.setFillColor(...COLORS.lightBg);
    const descLines = doc.splitTextToSize(description, CONTENT_WIDTH - 40);
    const boxHeight = 12 + descLines.length * 5 + 5;
    doc.roundedRect(MARGIN + 5, y - 5, CONTENT_WIDTH - 10, boxHeight, 3, 3, 'F');

    // Số bước - căn giữa bằng align center + offset dọc
    const stepCircleX = MARGIN + 15;
    const stepCircleY = y + 2;
    doc.setFillColor(...COLORS.accent);
    doc.circle(stepCircleX, stepCircleY, 6, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.text(String(stepNum), stepCircleX, stepCircleY + 1.2, { align: 'center' });

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

// ===== FIX #3: Table - text wrap trong cell thay vì tràn ra ngoài =====
export function drawTable(doc: jsPDF, y: number, headers: string[], rows: string[][]): number {
    const colWidth = (CONTENT_WIDTH - 10) / headers.length;
    const cellPadding = 3;
    const textWidth = colWidth - cellPadding * 2;

    // Tính chiều cao mỗi row dựa trên text wrap
    function getRowHeight(row: string[]): number {
        let maxLines = 1;
        doc.setFontSize(9);
        row.forEach(cell => {
            const lines = doc.splitTextToSize(cell, textWidth);
            if (lines.length > maxLines) maxLines = lines.length;
        });
        return Math.max(10, maxLines * 4.5 + 4);
    }

    // Header row
    const headerHeight = getRowHeight(headers);
    y = checkPageBreak(doc, y, headerHeight + 10);
    doc.setFillColor(...COLORS.primary);
    doc.rect(MARGIN + 5, y, CONTENT_WIDTH - 10, headerHeight, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    headers.forEach((header, i) => {
        const lines = doc.splitTextToSize(header, textWidth);
        doc.text(lines, MARGIN + 5 + i * colWidth + cellPadding, y + 4.5);
    });
    y += headerHeight;

    // Data rows
    rows.forEach((row, rowIndex) => {
        const rowHeight = getRowHeight(row);
        y = checkPageBreak(doc, y, rowHeight);
        if (rowIndex % 2 === 0) {
            doc.setFillColor(...COLORS.tableBg);
            doc.rect(MARGIN + 5, y, CONTENT_WIDTH - 10, rowHeight, 'F');
        }
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(9);
        row.forEach((cell, i) => {
            const lines = doc.splitTextToSize(cell, textWidth);
            doc.text(lines, MARGIN + 5 + i * colWidth + cellPadding, y + 4.5);
        });
        y += rowHeight;
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

// ===== FIX #2: Contact box với SĐT và email =====
export function drawContactBox(doc: jsPDF, y: number, title: string, lines: string[]): number {
    y = checkPageBreak(doc, y, 50);
    y += 5;
    const allLines = [...lines, '', 'Hotline: ' + CONTACT_PHONE, 'Email: ' + CONTACT_EMAIL];
    const boxHeight = 10 + allLines.length * 6 + 8;
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(MARGIN + 10, y, CONTENT_WIDTH - 20, boxHeight, 5, 5, 'F');

    // Logo nhỏ trong contact box
    try {
        doc.addImage(FAVICON_BASE64, 'PNG', PAGE_WIDTH / 2 - 5, y + 4, 10, 10);
    } catch (_) { /* ignore */ }

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(12);
    doc.text(title, PAGE_WIDTH / 2, y + 20, { align: 'center' });
    doc.setFontSize(9);
    let lineY = y + 28;
    allLines.forEach((line) => {
        if (line) {
            doc.text(line, PAGE_WIDTH / 2, lineY, { align: 'center' });
        }
        lineY += 6;
    });
    return y + boxHeight + 5;
}

// ===== Footer với logo và thông tin liên hệ =====
export function addPageNumbers(doc: jsPDF) {
    const totalPages = doc.getNumberOfPages();
    const footerH = 14;
    const footerTop = PAGE_HEIGHT - footerH;

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, footerTop, PAGE_WIDTH, footerH, 'F');

        // Logo 6x6mm, căn giữa dọc trong footer
        const logoSize = 6;
        const logoY = footerTop + (footerH - logoSize) / 2;
        try {
            doc.addImage(FAVICON_BASE64, 'PNG', MARGIN, logoY, logoSize, logoSize);
        } catch (_) { /* ignore */ }

        // Text căn giữa dọc với logo
        const textX = MARGIN + logoSize + 3;
        const textMidY = footerTop + footerH / 2;

        doc.setTextColor(...COLORS.white);
        doc.setFontSize(7);
        doc.text('SportBooking | ' + CONTACT_PHONE + ' | ' + CONTACT_EMAIL, textX, textMidY + 0.8);
        doc.text(`Trang ${i} / ${totalPages}`, PAGE_WIDTH - MARGIN, textMidY + 0.8, { align: 'right' });
    }
}
