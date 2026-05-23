import { logger } from "../utils/logger";

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  if (mimetype === "text/plain") {
    const text = buffer.toString("utf-8");
    logger.info(`Extracted ${text.length} chars from TXT file`);
    return text;
  }

  if (mimetype === "application/pdf") {
    try {
      const pdfParseMod = await import("pdf-parse");
      const pdfParse =
        (pdfParseMod as unknown as { default?: (buf: Buffer) => Promise<{ text: string }> }).default ??
        pdfParseMod;
      const data = await (typeof pdfParse === "function"
        ? pdfParse(buffer)
        : (pdfParse as unknown as Record<string, (b: Buffer) => Promise<{ text: string }>>).default?.(buffer));
      const text = data?.text ?? "";
      logger.info(`Extracted ${text.length} chars from PDF file`);
      return text;
    } catch (err) {
      logger.error("PDF text extraction failed:", err);
      return "[PDF text could not be extracted. Please use a text-based PDF.]";
    }
  }

  if (mimetype?.startsWith("image/")) {
    logger.warn("Image uploads cannot be parsed for text; skipping OCR");
    return "[Image file uploaded — text extraction not available for images. Questions will be generated based on the subject and topic only.]";
  }

  logger.warn(`Unsupported file type: ${mimetype}`);
  return "";
}
