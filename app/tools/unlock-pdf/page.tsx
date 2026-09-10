"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileLock2,
  Loader2,
  Upload,
  X,
} from "lucide-react";

export default function UnlockPdfPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  function selectFile(selected: File) {
    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      return;
    }

    setFile(selected);
    setPassword("");
    setResult(null);
    setError("");
  }

  function clearFile() {
    setFile(null);
    setPassword("");
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function unlockPdf() {
    if (!file || !password.trim()) return;

    setProcessing(true);
    setError("");
    setResult(null);

    const worker = new Worker("/qpdf/unlock-worker.js", {
      type: "module",
    });

    worker.onmessage = (event) => {
      if (event.data.success) {
        const blob = new Blob(
          [event.data.buffer],
          { type: "application/pdf" }
        );

        setResult(blob);
        setProcessing(false);
        worker.terminate();
        return;
      }

      setError(
        "Unable to unlock this PDF. Please check the password and try again."
      );
      setProcessing(false);
      worker.terminate();
    };

    worker.onerror = () => {
      setError(
        "Something went wrong while processing the PDF. Please try again."
      );
      setProcessing(false);
      worker.terminate();
    };

    try {
      const buffer = await file.arrayBuffer();

      worker.postMessage(
        {
          file: buffer,
          password: password.trim(),
        },
        [buffer]
      );
    } catch {
      setError("Unable to read this PDF file.");
      setProcessing(false);
      worker.terminate();
    }
  }

  function downloadPdf() {
    if (!result) return;

    const url = URL.createObjectURL(result);
    const link = document.createElement("a");

    link.href = url;
    link.download = "pdfumo-unlocked.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50">
            <FileLock2 className="h-8 w-8 text-indigo-600" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Unlock PDF
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Remove password protection from your PDF using its password.
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
          <div className="p-5 sm:p-8">
            {!file ? (
              <>
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

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-slate-50"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 transition group-hover:bg-indigo-100">
                    <Upload className="h-6 w-6 text-indigo-600" />
                  </div>

                  <span className="text-lg font-semibold text-slate-800">
                    Choose a PDF file
                  </span>

                  <span className="mt-2 text-sm text-slate-500">
                    Select a password-protected PDF from your device
                  </span>
                </button>
              </>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                    <FileLock2 className="h-5 w-5 text-indigo-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {!processing && (
                    <button
                      type="button"
                      onClick={clearFile}
                      aria-label="Remove file"
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pdf-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    PDF password
                  </label>

                  <input
                    id="pdf-password"
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                      setResult(null);
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        password.trim() &&
                        !processing
                      ) {
                        unlockPdf();
                      }
                    }}
                    placeholder="Enter your PDF password"
                    autoComplete="current-password"
                    disabled={processing}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <button
                  type="button"
                  onClick={unlockPdf}
                  disabled={processing || !password.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Unlocking PDF...
                    </>
                  ) : (
                    <>
                      <FileLock2 className="h-5 w-5" />
                      Unlock PDF
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm leading-6 text-red-300">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                  <div>
                    <p className="font-semibold text-emerald-300">
                      PDF unlocked successfully
                    </p>
                    <p className="mt-1 text-sm text-emerald-400/70">
                      Your PDF is ready to download.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadPdf}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-500"
                >
                  <Download className="h-5 w-5" />
                  Download Unlocked PDF
                </button>
              </div>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500 sm:text-sm">
          Your PDF is processed locally in your browser. Your file is never
          uploaded to our servers.
        </p>
      </div>
    </main>
  );
}
