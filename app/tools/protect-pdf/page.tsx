"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";

export default function ProtectPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

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
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function protectPdf() {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setProcessing(true);
    setError("");

    if (result) {
      URL.revokeObjectURL(result);
      setResult(null);
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());

      const protectedBytes = await encryptPDF(bytes, password, {
        algorithm: "AES-256",
        allowPrinting: true,
        allowCopying: false,
        allowModifying: false,
        allowFillingForms: true,
        allowExtraction: false,
      });

      const outputBuffer = new ArrayBuffer(protectedBytes.byteLength);
      new Uint8Array(outputBuffer).set(protectedBytes);

      const blob = new Blob(
        [outputBuffer],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);

      setResult(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to protect this PDF. Please make sure the file is valid."
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
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Protect PDF
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Add password protection to your PDF and keep sensitive documents
            secure.
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

              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
                <Plus className="h-4 w-4" />
                Choose PDF File

                <input
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
              </label>

              <p className="mt-4 text-xs text-slate-500">
                Your file is processed directly in your browser.
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
                    <KeyRound className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Set Password
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Choose a password for your document.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="pdf-password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Password
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
                      placeholder="Enter password"
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Confirm password
                    </label>

                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setError("");
                        setResult(null);
                      }}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                    <div>
                      <p className="text-xs font-bold text-indigo-900">
                        Secure PDF protection
                      </p>

                      <p className="mt-1 text-xs leading-5 text-indigo-700">
                        AES-256 encryption is used to protect your document.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={protectPdf}
                  disabled={processing}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Protecting PDF...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      Protect PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-emerald-900">
                    PDF protected successfully!
                  </h3>

                  <p className="mt-1 text-xs text-emerald-700">
                    Your protected PDF is ready to download.
                  </p>
                </div>

                <a
                  href={result}
                  download="pdfumo-protected.pdf"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-medium text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Your PDF is processed directly in your browser.
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-slate-900">
              AES-256 Encryption
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Protect your PDF with strong password encryption.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <KeyRound className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-slate-900">
              Password Protected
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Set a password before downloading the protected document.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-slate-900">
              Browser Processing
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your file stays on your device during processing.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
          <span>✓ No registration</span>
          <span>✓ AES-256 protection</span>
          <span>✓ Browser-based processing</span>
        </div>
      </section>
    </main>
  );
}
