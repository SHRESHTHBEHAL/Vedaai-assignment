"use client";

export async function exportPaperAsPDF(
  paperElement: HTMLElement,
  fileName: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  onProgress?.(5);

  // Hide the decorative corner
  const decorEl = paperElement.querySelector<HTMLElement>(":scope > div:first-child");
  const decorDisplay = decorEl?.style.display;
  if (decorEl) decorEl.style.display = "none";

  onProgress?.(15);

  // Capture the full paper at high quality
  const canvas = await html2canvas(paperElement, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (clonedDoc) => {
      const el = clonedDoc.getElementById(paperElement.id);
      if (el) {
        el.style.boxShadow = "none";
        el.style.border = "none";
        el.style.borderRadius = "0";
        el.style.padding = "20px";
        el.style.maxWidth = "none";
        el.style.width = "100%";
      }
      // Keep inline styles as-is — they're already PDF-friendly
    },
  });

  // Restore decorative element
  if (decorEl) decorEl.style.display = decorDisplay ?? "";

  onProgress?.(50);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PDF_W = 210;
  const PDF_H = 297;
  const MARGIN = 12;
  const CONTENT_W = PDF_W - MARGIN * 2;
  const CONTENT_H = PDF_H - MARGIN * 2;

  const imgW = CONTENT_W;
  const imgH = (canvas.height * imgW) / canvas.width;

  let yOffset = 0;
  let pageNum = 0;

  // Calculate section positions to avoid cutting mid-question
  const sectionEls = paperElement.querySelectorAll("section");
  const sectionHeights: number[] = [];
  const paperRect = paperElement.getBoundingClientRect();
  const scaleY = canvas.height / paperRect.height;

  sectionEls.forEach((sec) => {
    const rect = sec.getBoundingClientRect();
    const top = (rect.top - paperRect.top) * scaleY;
    sectionHeights.push(top);
  });

  while (yOffset < imgH) {
    if (pageNum > 0) pdf.addPage();

    const remainingHeight = imgH - yOffset;
    const pageHeightMM = Math.min(CONTENT_H, (remainingHeight / imgH) * imgH);

    // Try to find a section boundary near the page end to avoid cutting mid-question
    let actualPageMM = pageHeightMM;
    const pageEndY = yOffset + pageHeightMM;

    // Look for a section start within 30% of the page end
    const pageHeightRange = pageHeightMM * 0.3;
    for (let i = sectionHeights.length - 1; i >= 0; i--) {
      const secStartMM = (sectionHeights[i] / imgH) * imgH;
      if (
        secStartMM > yOffset &&
        secStartMM < pageEndY - pageHeightRange &&
        pageEndY - secStartMM < pageHeightRange * 2
      ) {
        actualPageMM = secStartMM - yOffset;
        break;
      }
    }

    const sourceYPx = (yOffset / imgH) * canvas.height;
    const pageHeightPx = (actualPageMM / imgH) * canvas.height;
    const actualHeightPx = Math.min(pageHeightPx, canvas.height - sourceYPx);

    if (actualHeightPx <= 0) break;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.ceil(actualHeightPx);

    const ctx = pageCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, -sourceYPx);

    const pageImgHeightMM =
      (pageCanvas.height * imgW) / pageCanvas.width;

    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      MARGIN,
      MARGIN,
      imgW,
      pageImgHeightMM,
    );

    yOffset += actualPageMM;
    pageNum++;
  }

  onProgress?.(100);
  pdf.save(fileName);
}

export function getPaperFileName(
  subject: string,
  grade: string,
  title: string,
): string {
  return (
    `${subject}_${grade}_${title}`
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "")
      .replace(/_+/g, "_")
      .substring(0, 200) + ".pdf"
  );
}
