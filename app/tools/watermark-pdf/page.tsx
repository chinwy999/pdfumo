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
  Droplets,
} from "lucide-react";
import { PDFDocument, rgb, degrees } from "pdf-lib";

export default function WatermarkPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.25);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(-45);
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
    setError("");
  }

  async function addWatermark() {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    if (!text.trim()) {
      setError("Please enter watermark text.");
      return;
    }

    setProcessing(true);
    setError("");

    if (result) {
      URL.revokeObjectURL(result);
      setResult(null);
    }

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const pages = pdf.getPages();

      const watermark = text.trim();

      for (const page of pages) {
        const { width, height } = page.getSize();

        const textWidth = watermark.length * fontSize * 0.55;
        const textHeight = fontSize;

        page.drawText(watermark, {
          x: width / 2 - textWidth / 2,
          y: height / 2 - textHeight / 2,
          size: fontSize,
          rotate: degrees(rotation),
          color: rgb(0.45, 0.45, 0.45),
          opacity,
        });
      }

      const outputBytes = await pdf.save();

      const blob = new Blob(
        [new Uint8Array(outputBytes)],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch {
      setError(
        "Unable to add the watermark. Please make sure the PDF is valid and not corrupted."
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
            <Droplets className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Watermark PDF
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Add custom text watermarks to every page of your PDF directly in
            your browser.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-6">
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
                    const selected = event.target.files?.[0];

                    if (selected) {
                      selectFile(selected);
                    }

                    event.currentTarget.value = "";
                  }}
                />
              </label>

              <p className="mt-4 text-xs text-slate-600">
                Your PDF is processed directly in your browser.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {file && (
            <div className="mt-2">
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                    <FileText className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
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
                <h2 className="text-lg font-bold">
                  Watermark Settings
                </h2>

                <div className="mt-5">
                  <label
                    htmlFor="watermark-text"
                    className="text-sm font-semibold"
                  >
                    Watermark text
                  </label>

                  <input
                    id="watermark-text"
                    type="text"
                    value={text}
                    onChange={(event) => {
                      setText(event.target.value);
                      setError("");
                      setResult(null);
                    }}
                    placeholder="CONFIDENTIAL"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#060914] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
                  />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="opacity"
                      className="flex justify-between text-sm font-semibold"
                    >
                      <span>Opacity</span>
                      <span className="text-cyan-300">
                        {Math.round(opacity * 100)}%
                      </span>
                    </label>

                    <input
                      id="opacity"
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={opacity}
                      onChange={(event) => {
                        setOpacity(Number(event.target.value));
                        setResult(null);
                      }}
                      className="mt-3 w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="font-size"
                      className="flex justify-between text-sm font-semibold"
                    >
                      <span>Size</span>
                      <span className="text-cyan-300">
                        {fontSize}px
                      </span>
                    </label>

                    <input
                      id="font-size"
                      type="range"
                      min="16"
                      max="100"
                      step="4"
                      value={fontSize}
                      onChange={(event) => {
                        setFontSize(Number(event.target.value));
                        setResult(null);
                      }}
                      className="mt-3 w-full accent-cyan-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="rotation"
                      className="flex justify-between text-sm font-semibold"
                    >
                      <span>Rotation</span>
                      <span className="text-cyan-300">
                        {rotation}°
                      </span>
                    </label>

                    <input
                      id="rotation"
                      type="range"
                      min="-90"
                      max="90"
                      step="15"
                      value={rotation}
                      onChange={(event) => {
                        setRotation(Number(event.target.value));
                        setResult(null);
                      }}
                      className="mt-3 w-full accent-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addWatermark}
                  disabled={processing}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Adding Watermark...
                    </>
                  ) : (
                    <>
                      <Droplets className="h-5 w-5" />
                      Add Watermark
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
                    Watermark added successfully!
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Your watermarked PDF is ready.
                  </p>
                </div>
              </div>

              <a
                href={result}
                download="pdfumo-watermarked.pdf"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300"
              >
                <Download className="h-5 w-5" />
                Download Watermarked PDF
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">Custom</p>
            <p className="mt-1 text-xs text-slate-500">
              Choose your own watermark text
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
