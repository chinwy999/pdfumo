"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

type PdfFile = {
  id: string;
  file: File;
};

export default function SplitPdfPage() {
  const [selectedFile, setSelectedFile] = useState<PdfFile | null>(null);
  const [pageRange, setPageRange] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  function selectFile(file: File) {
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file only.");
      return;
    }

    setSelectedFile({
      id: `${file.name}-${file.size}-${Date.now()}`,
      file,
    });

    setPageRange("");
    setResult(null);
    setError("");
  }

  function removeFile() {
    setSelectedFile(null);
    setPageRange("");
    setResult(null);
    setError("");
  }

  function parsePageRange(input: string, totalPages: number) {
    const pages = new Set<number>();

    for (const part of input.split(",")) {
      const value = part.trim();

      if (!value) continue;

      if (value.includes("-")) {
        const [startText, endText] = value
          .split("-")
          .map((item) => item.trim());

        const start = Number(startText);
        const end = Number(endText);

        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          start < 1 ||
          end < 1 ||
          start > totalPages ||
          end > totalPages ||
          start > end
        ) {
          throw new Error(
            `Invalid page range. Please use pages between 1 and ${totalPages}.`
          );
        }

        for (let page = start; page <= end; page++) {
          pages.add(page);
        }
      } else {
        const page = Number(value);

        if (
          !Number.isInteger(page) ||
          page < 1 ||
          page > totalPages
        ) {
          throw new Error(
            `Invalid page number. Please use pages between 1 and ${totalPages}.`
          );
        }

        pages.add(page);
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }

  async function splitPdf() {
    if (!selectedFile) {
      setError("Please select a PDF file.");
      return;
    }

    setProcessing(true);
    setError("");
    setResult(null);

    try {
      const bytes = await selectedFile.file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(bytes);
      const totalPages = sourcePdf.getPageCount();

      const input = pageRange.trim();

      if (!input) {
        throw new Error(
          "Please enter the pages you want to extract. Example: 1-3 or 1,4,7."
        );
      }

      const pages = parsePageRange(input, totalPages);

      if (!pages.length) {
        throw new Error("Please enter at least one page.");
      }

      const outputPdf = await PDFDocument.create();

      const copiedPages = await outputPdf.copyPages(
        sourcePdf,
        pages.map((page) => page - 1)
      );

      copiedPages.forEach((page) => outputPdf.addPage(page));

      const outputBytes = await outputPdf.save();

      const blob = new Blob([new Uint8Array(outputBytes)], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to split this PDF. Please make sure the file is valid."
      );
    } finally {
      setProcessing(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      selectFile(file);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
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

      {/* Main */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Title */}
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <FileText className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Split PDF Files
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Extract specific pages from a PDF and create a new document
            instantly.
          </p>
        </div>

        {/* Workspace */}
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {/* Upload */}
          {!selectedFile && (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
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
                Drop your PDF here
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                or choose a file from your device
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
                <Plus className="h-4 w-4" />
                Choose PDF File

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      selectFile(file);
                    }

                    event.currentTarget.value = "";
                  }}
                />
              </label>

              <p className="mt-4 text-xs text-slate-500">
                Your file is processed directly in your browser.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selected file */}
          {selectedFile && (
            <div className="mt-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {selectedFile.file.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove PDF"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Page range */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <label
                  htmlFor="page-range"
                  className="text-sm font-bold text-slate-900"
                >
                  Pages to extract
                </label>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Enter individual pages or ranges. For example:
                  <span className="ml-1 font-semibold text-slate-700">
                    1-3
                  </span>
                  {" or "}
                  <span className="font-semibold text-slate-700">
                    1,4,7
                  </span>
                </p>

                <input
                  id="page-range"
                  type="text"
                  value={pageRange}
                  onChange={(event) => {
                    setPageRange(event.target.value);
                    setError("");
                    setResult(null);
                  }}
                  placeholder="e.g. 1-3, 5, 8-10"
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

                <button
                  type="button"
                  onClick={splitPdf}
                  disabled={processing}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Splitting PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      Split PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-emerald-900">
                      PDF split successfully
                    </h3>

                    <p className="mt-1 text-sm text-emerald-700">
                      Your extracted pages are ready.
                    </p>
                  </div>
                </div>

                <a
                  href={result}
                  download="split.pdf"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Trust note */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
          <span>✓ No registration</span>
          <span>✓ Simple workflow</span>
          <span>✓ Browser-based processing</span>
        </div>
      </section>
    </main>
  );
}
