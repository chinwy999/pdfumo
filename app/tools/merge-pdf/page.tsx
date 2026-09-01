"use client";

import { useEffect, useRef, useState } from "react";
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
  const [draggedId, setDraggedId] = useState<string | null>(null);
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

  function addFiles(selected: FileList | File[]) {
    const pdfs = Array.from(selected).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (!pdfs.length) {
      setError("Please select PDF files only.");
      return;
    }

    setError("");
    clearResult();

    setFiles((current) => [
      ...current,
      ...pdfs.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
      })),
    ]);
  }

  function removeFile(id: string) {
    clearResult();
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  function clearAll() {
    clearResult();
    setFiles([]);
    setError("");
    setDraggedId(null);
  }

  function moveFile(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;

    setFiles((current) => {
      const sourceIndex = current.findIndex((item) => item.id === sourceId);
      const targetIndex = current.findIndex((item) => item.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      const updated = [...current];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);

      return updated;
    });

    clearResult();
  }

  async function mergePdfs() {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files.");
      return;
    }

    setProcessing(true);
    setError("");
    clearResult();

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
      const blob = new Blob([new Uint8Array(mergedBytes)], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
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

    if (!processing) {
      addFiles(event.dataTransfer.files);
    }
  }

  const totalSize = files.reduce((total, item) => total + item.file.size, 0);

  const totalSizeLabel =
    totalSize >= 1024 * 1024
      ? `${(totalSize / 1024 / 1024).toFixed(2)} MB`
      : `${Math.max(1, Math.round(totalSize / 1024))} KB`;

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
            Merge PDF Files
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Combine multiple PDF files into one document quickly and easily.
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
              Drop your PDF files here
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              or choose files from your device
            </p>

            <label
              className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 ${
                processing
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
            >
              <Plus className="h-4 w-4" />
              Choose PDF Files

              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                disabled={processing}
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    addFiles(event.target.files);
                  }

                  event.currentTarget.value = "";
                }}
              />
            </label>

            <p className="mt-4 text-xs text-slate-500">
              Your files are processed directly in your browser.
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-7">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Selected files ({files.length})
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Total size: {totalSizeLabel}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={processing}
                  className="self-start text-xs font-semibold text-slate-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2">
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    draggable={!processing}
                    onDragStart={() => {
                      if (!processing) {
                        setDraggedId(item.id);
                      }
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();

                      if (!processing && draggedId) {
                        moveFile(draggedId, item.id);
                        setDraggedId(null);
                      }
                    }}
                    className={`flex items-center gap-3 rounded-xl border bg-slate-50 p-3 transition ${
                      draggedId === item.id
                        ? "border-indigo-400 opacity-60"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <GripVertical
                      className={`h-5 w-5 shrink-0 ${
                        processing
                          ? "text-slate-300"
                          : "cursor-grab text-slate-400 active:cursor-grabbing"
                      }`}
                    />

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 ring-1 ring-red-100">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {index + 1}. {item.file.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      disabled={processing}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-center text-xs text-slate-500">
                Drag and drop files to change their order.
              </p>

              <button
                type="button"
                onClick={mergePdfs}
                disabled={processing || files.length < 2}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Merging PDFs...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Merge PDF Files
                  </>
                )}
              </button>

              {files.length < 2 && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  Add at least 2 PDF files to merge them.
                </p>
              )}
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
                      PDF merged successfully
                    </h3>

                    <p className="mt-1 text-sm text-emerald-700">
                      Your merged document is ready.
                    </p>
                  </div>
                </div>

                <a
                  href={result}
                  download="merged.pdf"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
          <span>✓ No registration</span>
          <span>✓ Simple workflow</span>
          <span>✓ Browser-based processing</span>
        </div>
      </section>
    </main>
  );
}
