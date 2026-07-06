"use client";

import { useEffect } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
// Use the worker entry that works reliably with bundlers
// import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

type PDFExtractionWorkerProps = {
  file: File | null;
  onExtracted: (text: string) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onFinish?: () => void;
};

export default function PDFExtractionWorker({
  file,
  onExtracted,
  onError,
  onStart,
  onFinish,
}: PDFExtractionWorkerProps) {
  useEffect(() => {
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name);

    if (!isPdf) return;

    let cancelled = false;

    const extract = async () => {
      onStart?.();

      try {
        GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = getDocument({ data: arrayBuffer });

        const pdf = await loadingTask.promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) {
            await loadingTask.destroy();
            return;
          }

          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map((item) => {
              if (typeof item === "object" && item && "str" in item) {
                return (item as { str: string }).str;
              }
              return "";
            })
            .join(" ");

          fullText += `${pageText}\n`;
        }

        if (!cancelled) {
          onExtracted(fullText.trim());
        }

        await loadingTask.destroy();
      } catch (err) {
        console.error("PDF parsing error:", err);

        if (!cancelled) {
          onError(
            err instanceof Error
              ? err.message
              : "PDF text extraction failed. The full file is still attached for analysis."
          );
        }
      } finally {
        if (!cancelled) {
          onFinish?.();
        }
      }
    };

    void extract();

    return () => {
      cancelled = true;
    };
  }, [file, onExtracted, onError, onStart, onFinish]);

  return null;
}
