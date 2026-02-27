import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult, CategoryResult } from "./analyzer";

function getStatusLabel(status: string): string {
  if (status === "pass") return "✓ PASS";
  if (status === "fail") return "✗ FAIL";
  return "⚠ WARNING";
}

function getScoreColor(score: number): [number, number, number] {
  if (score >= 80) return [34, 197, 94];
  if (score >= 50) return [245, 158, 11];
  return [239, 68, 68];
}

function drawScoreGauge(doc: jsPDF, score: number, x: number, y: number) {
  const [r, g, b] = getScoreColor(score);
  doc.setFillColor(r, g, b);
  doc.circle(x, y, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${score}`, x, y + 2, { align: "center" });
  doc.setFontSize(8);
  doc.text("/ 100", x, y + 8, { align: "center" });
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
}

function addCategorySection(
  doc: jsPDF,
  category: CategoryResult,
  startY: number
): number {
  let y = startY;

  if (y > 250) {
    doc.addPage();
    y = 25;
  }

  const [r, g, b] = getScoreColor(category.score);
  doc.setFillColor(r, g, b);
  doc.roundedRect(14, y - 5, 182, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`${category.icon}  ${category.name}`, 18, y + 1);
  doc.text(`${category.score}/100`, 190, y + 1, { align: "right" });
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  y += 12;

  const tableBody = category.checks.map((check) => [
    check.name,
    getStatusLabel(check.status),
    check.message,
    check.recommendation || "-",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Check", "Status", "Details", "Recommendation"]],
    body: tableBody,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 65 },
      3: { cellWidth: 65, textColor: [100, 100, 100], fontStyle: "italic" },
    },
    didParseCell: (data) => {
      if (data.column.index === 1 && data.section === "body") {
        const text = data.cell.raw as string;
        if (text.includes("PASS")) {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = "bold";
        } else if (text.includes("FAIL")) {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [245, 158, 11];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 10;
}

export function generatePDF(result: AnalysisResult): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── Header Banner ─────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 50, "F");

  doc.setFillColor(99, 102, 241);
  doc.rect(0, 48, pageWidth, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SEO Analysis Report", 18, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(result.url, 18, 32);
  doc.setFontSize(8);
  doc.text(
    `Generated: ${new Date(result.analyzedAt).toLocaleString()}`,
    18,
    40
  );

  drawScoreGauge(doc, result.score, pageWidth - 35, 25);

  doc.setTextColor(0, 0, 0);

  // ─── Summary Section ───────────────────────────────────────────────
  let y = 62;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y - 5, 182, 22, 3, 3, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 18, y + 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.setTextColor(34, 197, 94);
  doc.text(`${result.summary.passed} Passed`, 18, y + 10);
  doc.setTextColor(245, 158, 11);
  doc.text(`${result.summary.warnings} Warnings`, 60, y + 10);
  doc.setTextColor(239, 68, 68);
  doc.text(`${result.summary.failed} Failed`, 108, y + 10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${result.summary.totalChecks} Total Checks`,
    150,
    y + 10
  );

  doc.setTextColor(0, 0, 0);
  y += 30;

  // ─── Category Scores Overview ──────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Category Scores", 14, y);
  y += 8;

  const cats = Object.values(result.categories);
  const colWidth = 45;
  const cols = 4;

  for (let i = 0; i < cats.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 14 + col * colWidth;
    const cy = y + row * 16;

    const [cr, cg, cb] = getScoreColor(cats[i].score);
    doc.setFillColor(cr, cg, cb);
    doc.circle(cx + 5, cy + 3, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`${cats[i].score}`, cx + 5, cy + 4.5, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text(cats[i].name, cx + 12, cy + 5);
    doc.setFont("helvetica", "normal");
  }

  y += Math.ceil(cats.length / cols) * 16 + 10;

  // ─── Critical Issues ───────────────────────────────────────────────
  if (result.summary.criticalIssues.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 25;
    }

    doc.setFillColor(254, 226, 226);
    const boxHeight = 8 + result.summary.criticalIssues.length * 6;
    doc.roundedRect(14, y - 5, 182, boxHeight, 2, 2, "F");

    doc.setTextColor(185, 28, 28);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Critical Issues", 18, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    result.summary.criticalIssues.forEach((issue, i) => {
      doc.text(`• ${issue}`, 20, y + 8 + i * 6);
    });

    doc.setTextColor(0, 0, 0);
    y += boxHeight + 8;
  }

  // ─── Detailed Results ──────────────────────────────────────────────
  if (y > 240) {
    doc.addPage();
    y = 25;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Analysis", 14, y);
  y += 8;

  for (const category of Object.values(result.categories)) {
    y = addCategorySection(doc, category, y);
  }

  // ─── Footer on all pages ───────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 287, pageWidth, 10, "F");
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text(
      "Generated by SEO Analyzer Pro — seoanalyzer.app",
      14,
      293
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, 293, {
      align: "right",
    });
  }

  return doc;
}
