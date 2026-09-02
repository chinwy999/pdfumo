"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Document, Packer, Paragraph, TextRun } from "docx";

type PdfState = {
  file: File;
  pages: number;
};

export default function PdfToWordPage() {
  const [pdf, setPdf] = useState<PdfState | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }
    };
  }, []);

  function clearResult() {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }

    setResult(null);
  }

  function selectFile(file: File | undefined) {
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Please select a PDF file only.");
      return;
    }

    setError("");
    clearResult();
    setProgress("");
    setPdf({ file, pages: 0 });
  }

  async function convertToWord() {
    if (!pdf) {
      setError("Please select a PDF file first.");
      return;
    }

    setProcessing(true);
    setError("");
    clearResult();
    setProgress("Loading PDF...");

    try {
      const pdfjs = await import("pdfjs-dist");

      const pdfjsLib = pdfjs as typeof import("pdfjs-dist");

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "/pdfjs/pdf.worker.min.mjs";

      const bytes = new Uint8Array(await pdf.file.arrayBuffer());

      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
      });

      const documentPdf = await loadingTask.promise;

      setPdf((current) =>
        current
          ? {
              ...current,
              pages: documentPdf.numPages,
            }
          : current,
      );

      const paragraphs: Paragraph[] = [];

      for (let pageNumber = 1; pageNumber <= documentPdf.numPages; pageNumber++) {
        setProgress(
          `Extracting page ${pageNumber} of ${documentPdf.numPages}...`,
        );

        const page = await documentPdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

        const textItems = textContent.items
          .filter(
            (
              item,
            ): item is typeof item & {
              str: string;
            } => "str" in item,
          )
          .map((item) => item.str.trim())
          .filter(Boolean);

        if (pageNumber > 1) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                }),
              ],
              pageBreakBefore: true,
            }),
          );
        }

        if (textItems.length === 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Page ${pageNumber} contains no extractable text.]`,
                  italics: true,
                }),
              ],
            }),
          );
          continue;
        }

        for (const text of textItems) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text,
                }),
              ],
              spacing: {
                after: 160,
              },
            }),
          );
        }
      }

      if (paragraphs.length === 0) {
        throw new Error("No extractable text was found in this PDF.");
      }

      setProgress("Creating Word document...");

      const wordDocument = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(wordDocument);

      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult(url);
      setProgress("");
    } catch (conversionError) {
      console.error("PDF TO WORD ERROR:", conversionError);

      setProgress("");

      const message =
        conversionError instanceof Error
          ? conversionError.message
          : String(conversionError);

      setError(`Conversion failed: ${message}`);
    } finally {
      setProcessing(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    if (!processing) {
      selectFile(event.dataTransfer.files?.[0]);
    }
  }

  function clearFile() {
    if (processing) return;

    clearResult();
    setPdf(null);
    setError("");
    setProgress("");
  }

  const fileSizeLabel = pdf
    ? pdf.file.size >= 1024 * 1024
      ? `${(pdf.file.size / 1024 / 1024).toFixed(2)} MB`
      : `${Math.max(1, Math.round(pdf.file.size / 1024))} KB`
    : "";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-3 text-slate-600 transition hover:text-indigo-600"
          >
            <ArrowLeft className="h-5 w-5" />

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>

            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              PDF<span className="text-indigo-600">umo</span>
            </span>
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <FileText className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            PDF to Word
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Convert PDF files into editable Word documents quickly and easily.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div
            onDragOver={(event) => {
              event.preventDefault();

              if (!processing) {
                setDragActive(true);
              }
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-14 ${
              dragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
              <Upload className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Drop your PDF file here
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              or choose a file from your device
            </p>

            <label
              className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 ${
                processing
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
            >
              <Upload className="h-4 w-4" />
              Choose PDF File

              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={processing}
                className="hidden"
                onChange={(event) => {
                  selectFile(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            <p className="mt-4 text-xs text-slate-500">
              Your file is processed directly in your browser.
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {pdf && (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {pdf.file.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {fileSizeLabel}
                    {pdf.pages > 0 ? ` • ${pdf.pages} pages` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearFile}
                  disabled={processing}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remove PDF"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {progress && (
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-white p-4 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  <span>{progress}</span>
                </div>
              )}

              <button
                type="button"
                onClick={convertToWord}
                disabled={processing}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Converting to Word...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Convert to Word
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-emerald-900">
                      Word document created successfully
                    </h3>

                    <p className="mt-1 text-sm text-emerald-700">
                      Your editable Word document is ready.
                    </p>
                  </div>
                </div>

                <a
                  href={result}
                  download="converted.docx"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Download Word
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
          <span>✓ No registration</span>
          <span>✓ Editable DOCX</span>
          <span>✓ Browser-based processing</span>
        </div>
      </section>
    </main>
  );
}
