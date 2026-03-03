import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult, CategoryResult, Check } from "./analyzer";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusLabel(status: string): string {
  if (status === "pass") return "PASS";
  if (status === "fail") return "FAIL";
  return "WARN";
}

function getScoreColor(score: number): [number, number, number] {
  if (score >= 80) return [34, 197, 94];
  if (score >= 50) return [245, 158, 11];
  return [239, 68, 68];
}

function getPriorityColor(priority: Check["priority"]): [number, number, number] {
  if (priority === "critical") return [185, 28, 28];
  if (priority === "high")     return [194, 65, 12];
  if (priority === "medium")   return [161, 98, 7];
  return [100, 116, 139];
}

function getPriorityLabel(priority: Check["priority"]): string {
  return priority.toUpperCase();
}

function getPriorityOrder(priority: Check["priority"]): number {
  if (priority === "critical") return 0;
  if (priority === "high")     return 1;
  if (priority === "medium")   return 2;
  return 3;
}

// Strip any non-latin / emoji characters so jsPDF doesn't render garbage
function safe(text: string): string {
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();
}

// Category display name without emoji
function catLabel(category: CategoryResult): string {
  return category.name;
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

// ─── Category Section ─────────────────────────────────────────────────────────

function addCategorySection(
  doc: jsPDF,
  category: CategoryResult,
  startY: number
): number {
  let y = startY;

  if (y > 250) { doc.addPage(); y = 25; }

  const [r, g, b] = getScoreColor(category.score);
  doc.setFillColor(r, g, b);
  doc.roundedRect(14, y - 5, 182, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(catLabel(category), 18, y + 1);
  doc.text(`${category.score}/100`, 190, y + 1, { align: "right" });
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  y += 12;

  const tableBody = category.checks.map((check) => [
    safe(check.name),
    getStatusLabel(check.status),
    getPriorityLabel(check.priority),
    safe(check.message),
    safe(check.recommendation || (check.fix ? "See fix below" : "-")),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Check", "Status", "Priority", "Details", "Recommendation"]],
    body: tableBody,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7, cellPadding: 2.5, lineWidth: 0.1 },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold" },
      1: { cellWidth: 14, halign: "center" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 64 },
      4: { cellWidth: 60, textColor: [100, 100, 100], fontStyle: "italic" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index === 1) {
        const text = data.cell.raw as string;
        if (text === "PASS") {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = "bold";
        } else if (text === "FAIL") {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [245, 158, 11];
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (data.column.index === 2) {
        const text = (data.cell.raw as string).toLowerCase() as Check["priority"];
        const [r2, g2, b2] = getPriorityColor(text);
        data.cell.styles.textColor = [r2, g2, b2];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Fix snippets below table
  let fy =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

  for (const check of category.checks) {
    if (!check.fix) continue;
    if (fy > 270) { doc.addPage(); fy = 25; }

    const fixText = safe(check.fix);
    const label = safe(check.name);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Fix for "${label}":`, 16, fy + 4);

    const lines = doc.splitTextToSize(fixText, 165);
    const boxH = lines.length * 3.8 + 6;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(16, fy + 6, 175, boxH, 1, 1, "F");
    doc.setFont("courier", "normal");
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(6.5);
    doc.text(lines, 19, fy + 10);
    doc.setFont("helvetica", "normal");
    fy += boxH + 10;
  }

  return fy + 4;
}

// ─── Priority Action Plan ─────────────────────────────────────────────────────

function addPriorityActionPlan(doc: jsPDF, result: AnalysisResult, startY: number): number {
  let y = startY;
  if (y > 240) { doc.addPage(); y = 25; }

  // Header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, y - 5, 182, 11, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Priority Action Plan", 18, y + 2);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  y += 15;

  // Collect failed + warning checks
  const actionItems: Array<{ check: Check; categoryName: string }> = [];
  for (const cat of Object.values(result.categories)) {
    for (const check of cat.checks) {
      if (check.status !== "pass") {
        actionItems.push({ check, categoryName: cat.name });
      }
    }
  }

  // Sort: critical -> high -> medium -> low, fail before warn
  actionItems.sort((a, b) => {
    const pd = getPriorityOrder(a.check.priority) - getPriorityOrder(b.check.priority);
    if (pd !== 0) return pd;
    if (a.check.status === "fail" && b.check.status !== "fail") return -1;
    if (b.check.status === "fail" && a.check.status !== "fail") return 1;
    return 0;
  });

  const topItems = actionItems.slice(0, 12);

  if (topItems.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94);
    doc.text("No issues found — your site is well-optimized!", 18, y);
    doc.setTextColor(0, 0, 0);
    return y + 15;
  }

  for (let i = 0; i < topItems.length; i++) {
    const { check, categoryName } = topItems[i];

    if (y > 255) { doc.addPage(); y = 25; }

    const [pr, pg, pb] = getPriorityColor(check.priority);

    // Number circle
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(14, y - 3, 6, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}`, 17, y + 1.5, { align: "center" });

    // Priority badge
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(22, y - 3, 24, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text(getPriorityLabel(check.priority), 34, y + 1.5, { align: "center" });

    // Status badge
    const [sr, sg, sb] = check.status === "fail"
      ? [239, 68, 68] as [number, number, number]
      : [245, 158, 11] as [number, number, number];
    doc.setFillColor(sr, sg, sb);
    doc.roundedRect(48, y - 3, 14, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text(getStatusLabel(check.status), 55, y + 1.5, { align: "center" });

    // Category
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(safe(categoryName), 65, y + 1.5);

    // Check name
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(safe(check.name), 110, y + 1.5);

    y += 9;

    // Message
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 80);
    const msgLines = doc.splitTextToSize(safe(check.message), 172);
    doc.text(msgLines, 18, y);
    y += msgLines.length * 4;

    // Recommendation
    if (check.recommendation) {
      doc.setTextColor(161, 98, 7);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      const recLines = doc.splitTextToSize(`-> ${safe(check.recommendation)}`, 170);
      doc.text(recLines, 18, y);
      y += recLines.length * 3.8;
    }

    // Fix snippet
    if (check.fix) {
      y += 1;
      const fixLines = doc.splitTextToSize(safe(check.fix), 163);
      const boxH = fixLines.length * 3.8 + 5;
      if (y + boxH > 275) { doc.addPage(); y = 25; }
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(16, y - 1, 175, boxH, 1, 1, "F");
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(6.5);
      doc.setFont("courier", "normal");
      doc.text(fixLines, 19, y + 2.5);
      doc.setFont("helvetica", "normal");
      y += boxH + 2;
    }

    // Divider
    if (i < topItems.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(14, y + 2, 196, y + 2);
      y += 6;
    }
  }

  return y + 10;
}

// ─── Main PDF Generator ───────────────────────────────────────────────────────

export function generatePDF(result: AnalysisResult): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── Page 1: Header ────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 55, "F");

  doc.setFillColor(99, 102, 241);
  doc.rect(0, 53, pageWidth, 3, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SEO Analysis Report", 18, 20);

  // URL
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const urlDisplay = result.url.length > 75 ? result.url.substring(0, 72) + "..." : result.url;
  doc.text(safe(urlDisplay), 18, 30);

  // Date
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date(result.analyzedAt).toLocaleString()}`, 18, 38);

  // PageSpeed badge
  if (result.summary.pageSpeedAvailable) {
    doc.setFontSize(7);
    doc.setTextColor(165, 180, 252);
    doc.text("Core Web Vitals powered by Google PageSpeed Insights", 18, 46);
  }

  // Contact line
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Contact: Seopreeti09@gmail.com  |  WhatsApp: +91 94182 28411", 18, 52);

  // Score gauge
  drawScoreGauge(doc, result.score, pageWidth - 32, 27);

  doc.setTextColor(0, 0, 0);

  // ─── Audit Summary ─────────────────────────────────────────────────
  let y = 68;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y - 5, 182, 22, 3, 3, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Audit Summary", 18, y + 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.setTextColor(34, 197, 94);
  doc.text(`${result.summary.passed} Passed`, 18, y + 12);
  doc.setTextColor(245, 158, 11);
  doc.text(`${result.summary.warnings} Warnings`, 62, y + 12);
  doc.setTextColor(239, 68, 68);
  doc.text(`${result.summary.failed} Failed`, 112, y + 12);
  doc.setTextColor(100, 100, 100);
  doc.text(`${result.summary.totalChecks} Total Checks`, 152, y + 12);

  doc.setTextColor(0, 0, 0);
  y += 30;

  // ─── SEO Score Breakdown label ─────────────────────────────────────
  const scoreLabel =
    result.score >= 80 ? "Good" : result.score >= 50 ? "Needs Work" : "Poor";
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Overall SEO Score: ${result.score}/100  (${scoreLabel})`, 14, y);
  doc.setFont("helvetica", "normal");
  y += 4;

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Score is weighted: Meta 20%, Security 15%, Technical 13%, Content 13%, Performance 12%, Headings 10%, Social 7%, Images 5%, Links 5%",
    14, y + 4
  );
  doc.setTextColor(0, 0, 0);
  y += 12;

  // ─── Category Scores ───────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Category Scores", 14, y);
  y += 8;

  const cats = Object.values(result.categories);
  const colW = 46;
  const cols = 4;

  for (let i = 0; i < cats.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 14 + col * colW;
    const cy = y + row * 18;

    const [cr, cg, cb] = getScoreColor(cats[i].score);
    doc.setFillColor(cr, cg, cb);
    doc.roundedRect(cx, cy - 1, 38, 12, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`${cats[i].score}`, cx + 7, cy + 8, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const name = catLabel(cats[i]);
    doc.text(name, cx + 14, cy + 8);
  }

  y += Math.ceil(cats.length / cols) * 18 + 8;

  // ─── Priority Action Plan ──────────────────────────────────────────
  y = addPriorityActionPlan(doc, result, y);

  // ─── Detailed Analysis ─────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 25; }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Analysis — All Checks", 14, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`${result.summary.totalChecks} total checks across ${cats.length} categories`, 14, y + 6);
  doc.setTextColor(0, 0, 0);
  y += 14;

  for (const category of cats) {
    y = addCategorySection(doc, category, y);
  }

  // ─── Footer on every page ──────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 287, pageWidth, 10, "F");
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text("SEO Analyzer Pro  |  Seopreeti09@gmail.com  |  WhatsApp: +91 94182 28411", 14, 293);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, 293, { align: "right" });
  }

  return doc;
}
