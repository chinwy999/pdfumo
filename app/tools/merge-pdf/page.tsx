"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  GripVertical,
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

export default function MergePdfPage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  function addFiles(selected: FileList | File[]) {
    const pdfs = Array.from(selected).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );

    if (!pdfs.length) {
      setError("Please select PDF files only.");
      return;
    }

    setError("");
    setResult(null);

    setFiles((current) => [
      ...current,
      ...pdfs.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
      })),
    ]);
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
    setResult(null);
  }

  function clearAll() {
    setFiles([]);
    setResult(null);
    setError("");
  }

  async function mergePdfs() {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files.");
      return;
    }

    setProcessing(true);
    setError("");
    setResult(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const bytes = await item.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices()
        );

        pages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();

      const blob = new Blob(
        [new Uint8Array(mergedBytes)],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch {
      setError(
        "Unable to merge these files. Please make sure the PDFs are valid and not corrupted."
      );
    } finally {
      setProcessing(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
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
            Merge PDF Files
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Combine multiple PDF files into one document quickly and easily.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-6">
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
              Drop your PDF files here
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              or choose files from your device
            </p>

            <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-50">
              <Plus className="h-4 w-4" />
              Choose PDF Files
              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) addFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            <p className="mt-4 text-xs text-slate-600">
              Your files are processed directly in your browser.
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">
                  Selected files ({files.length})
                </h3>

                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-slate-500 transition hover:text-red-400"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2">
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3"
                  >
                    <GripVertical className="h-5 w-5 shrink-0 text-slate-600" />

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-400/10 text-red-300">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {index + 1}. {item.file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-red-400/10 hover:text-red-400"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={mergePdfs}
                disabled={processing || files.length < 2}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Merging PDFs...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Merge {files.length} PDF Files
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <div>
                  <h3 className="font-bold">PDFs merged successfully!</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Your merged document is ready.
                  </p>
                </div>
              </div>

              <a
                href={result}
                download="pdfumo-merged.pdf"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300"
              >
                <Download className="h-5 w-5" />
                Download Merged PDF
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">Fast</p>
            <p className="mt-1 text-xs text-slate-500">
              Process files directly in your browser
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
