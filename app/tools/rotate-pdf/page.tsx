"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  RotateCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function selectFile(selected: File) {
    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file only.");
      return;
    }

    if (result) {
      URL.revokeObjectURL(result);
    }

    setFile(selected);
    setResult(null);
    setError("");
  }

  function removeFile() {
    if (result) {
      URL.revokeObjectURL(result);
    }

    setFile(null);
    setResult(null);
    setError("");
  }

  async function rotatePdf() {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setProcessing(true);
    setError("");

    if (result) {
      URL.revokeObjectURL(result);
      setResult(null);
    }

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");

      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      for (const page of pdf.getPages()) {
        const currentRotation = page.getRotation().angle;
        const normalizedRotation =
          ((currentRotation % 360) + 360) % 360;
        const newRotation =
          (normalizedRotation + rotation) % 360;

        page.setRotation(degrees(newRotation));
      }

      const outputBytes = await pdf.save();

      const blob = new Blob(
        [new Uint8Array(outputBytes)],
        { type: "application/pdf" }
      );

      setResult(URL.createObjectURL(blob));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to rotate this PDF. Please make sure the file is valid."
      );
    } finally {
      setProcessing(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      selectFile(droppedFile);
    }
  }

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
            <RotateCw className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Rotate PDF
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Rotate all pages in your PDF by 90, 180 or 270 degrees directly in
            your browser.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {!file && (
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

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Choose PDF File
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => {
                  const selected = event.target.files?.[0];

                  if (selected) {
                    selectFile(selected);
                  }

                  event.currentTarget.value = "";
                }}
              />

              <p className="mt-4 text-xs text-slate-500">
                Your PDF is processed directly in your browser.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {file && (
            <div className="mt-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
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

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <RotateCw className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Rotation
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Choose how much to rotate every page.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[90, 180, 270].map((angle) => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => {
                        setRotation(angle);
                        setResult(null);
                        setError("");
                      }}
                      className={`rounded-xl border px-4 py-4 text-sm font-bold transition ${
                        rotation === angle
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
                      }`}
                    >
                      {angle}°
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={rotatePdf}
                  disabled={processing}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Rotating PDF...
                    </>
                  ) : (
                    <>
                      <RotateCw className="h-5 w-5" />
                      Rotate PDF
                    </>
                  )}
                </button>
              </div>

              {result && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-emerald-900">
                        PDF rotated successfully
                      </h2>

                      <p className="mt-1 text-sm text-emerald-700">
                        All pages were rotated by {rotation}°.
                      </p>

                      <a
                        href={result}
                        download="pdfumo-rotated.pdf"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <Download className="h-4 w-4" />
                        Download Rotated PDF
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
