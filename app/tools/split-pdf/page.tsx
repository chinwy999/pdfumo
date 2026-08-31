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
        const [startText, endText] = value.split("-").map((item) => item.trim());
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
          `Please enter the pages you want to extract. Example: 1-3 or 1,4,7.`
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

      const blob = new Blob(
        [new Uint8Array(outputBytes)],
        { type: "application/pdf" }
      );

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
    <main className="min-h-screen bg-[#060914] text-white">
      <header className="border-b border-white/[0.07] bg-[#060914]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-2.5 text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600">
              <FileText className="h-5 w-5" />
            </div>

            <span className="text-xl font-extrabold tracking-tight">
              PDF<span className="text-cyan-400">umo</span>
            </span>
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <FileText className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Split PDF Files
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Extract specific pages from a PDF and create a new document
            instantly.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-6">
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
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-white/10 bg-black/10 hover:border-cyan-400/30"
              }`}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Upload className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Drop your PDF here
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                or choose a file from your device
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-50">
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

              <p className="mt-4 text-xs text-slate-600">
                Your file is processed directly in your browser.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {selectedFile && (
            <div className="mt-2">
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {selectedFile.file.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-400/10 hover:text-red-400"
                    aria-label="Remove PDF"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-black/20 p-5">
                <label
                  htmlFor="page-range"
                  className="text-sm font-bold"
                >
                  Pages to extract
                </label>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Enter individual pages or ranges. For example:
                  <span className="ml-1 text-slate-300">
                    1-3
                  </span>
                  {" "}
                  or
                  <span className="ml-1 text-slate-300">
                    1,4,7
                  </span>
                  {" "}
                  or
                  <span className="ml-1 text-slate-300">
                    1-3,8,10-12
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
                  className="mt-4 w-full rounded-xl border border-white/10 bg-[#060914] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                />

                <button
                  type="button"
                  onClick={splitPdf}
                  disabled={processing}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
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

          {result && (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />

                <div>
                  <h3 className="font-bold">
                    PDF split successfully!
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Your extracted pages are ready.
                  </p>
                </div>
              </div>

              <a
                href={result}
                download="pdfumo-split.pdf"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300"
              >
                <Download className="h-5 w-5" />
                Download Split PDF
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">Fast</p>
            <p className="mt-1 text-xs text-slate-500">
              Extract pages in seconds
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">Private</p>
            <p className="mt-1 text-xs text-slate-500">
              Files stay on your device
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">Free</p>
            <p className="mt-1 text-xs text-slate-500">
              No registration required
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
