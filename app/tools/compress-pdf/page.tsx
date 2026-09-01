"use client";

import { useRef, useState } from "react";
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
  Zap,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

type PdfJsModule = typeof import("pdfjs-dist");

type PdfFile = {
  id: string;
  file: File;
};

export default function CompressPdfPage() {
  const [selectedFile, setSelectedFile] = useState<PdfFile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressionLevel, setCompressionLevel] = useState<"high" | "balanced" | "small">("balanced");
  const pdfjsRef = useRef<PdfJsModule | null>(null);

  function selectFile(file: File | null) {
    if (!file) {
      setError("No file was selected.");
      return;
    }

    const fileName = file.name || "";
    const isPdf =
      file.type === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Please select a PDF file only.");
      return;
    }

    if (file.size === 0) {
      setError("The selected PDF file is empty or could not be read.");
      return;
    }

    setSelectedFile({
      id: `${fileName}-${file.size}-${Date.now()}`,
      file,
    });

    setOriginalSize(file.size);
    setCompressedSize(0);
    setResult(null);
    setError("");
    setProgress("");
  }

  function removeFile() {
    if (result) {
      URL.revokeObjectURL(result);
    }

    setSelectedFile(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setResult(null);
    setError("");
    setProgress("");
  }

  async function compressPdf() {
    if (!selectedFile) {
      setError("Please select a PDF file.");
      return;
    }

    setProcessing(true);
    setError("");
    setResult(null);
    setCompressedSize(0);

    let sourcePdf: import("pdfjs-dist").PDFDocumentProxy | null = null;

    try {
      if (!pdfjsRef.current) {
        const pdfjs = await import("pdfjs-dist");
        pdfjsRef.current = pdfjs;
      }

      const pdfjs = pdfjsRef.current;

      pdfjs.GlobalWorkerOptions.workerSrc =
        "/pdfjs/pdf.worker.min.mjs";

      const settings = {
        high: {
          scale: 1.35,
          quality: 0.78,
        },
        balanced: {
          scale: 1.05,
          quality: 0.58,
        },
        small: {
          scale: 0.75,
          quality: 0.38,
        },
      }[compressionLevel];

      /*
       * Keep only the input ArrayBuffer and output PDF alive.
       * Pages/canvases are released immediately after processing.
       */
      setProgress("Reading PDF from your device...");

      if (!selectedFile.file || selectedFile.file.size <= 0) {
        throw new Error("The selected PDF file is empty or could not be read from your device.");
      }

      const fileBuffer = await selectedFile.file.arrayBuffer();

      if (!fileBuffer || fileBuffer.byteLength === 0) {
        throw new Error("Unable to read the selected PDF file from your device.");
      }

      const bytes = new Uint8Array(fileBuffer);

      setProgress("Loading PDF...");

      sourcePdf = await pdfjs.getDocument({
        data: bytes,
        useSystemFonts: false,
        disableFontFace: true,
      }).promise;

      if (sourcePdf.numPages === 0) {
        throw new Error("No pages were found in this PDF.");
      }

      const outputPdf = await PDFDocument.create();

      setProgress(`Preparing ${sourcePdf.numPages} page${sourcePdf.numPages === 1 ? "" : "s"}...`);

      for (
        let pageNumber = 1;
        pageNumber <= sourcePdf.numPages;
        pageNumber++
      ) {
        setProgress(
          `Compressing page ${pageNumber} of ${sourcePdf.numPages}...`
        );

        const sourcePage = await sourcePdf.getPage(pageNumber);

        const viewport = sourcePage.getViewport({
          scale: settings.scale,
        });

        const canvas = document.createElement("canvas");

        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));

        const context = canvas.getContext("2d", {
          alpha: false,
          willReadFrequently: false,
        });

        if (!context) {
          throw new Error("Unable to create canvas.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        await sourcePage.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise;

        const jpegBlob = await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              resolve,
              "image/jpeg",
              settings.quality
            );
          }
        );

        if (!jpegBlob) {
          throw new Error(
            `Unable to compress page ${pageNumber}.`
          );
        }

        const jpegBytes = new Uint8Array(
          await jpegBlob.arrayBuffer()
        );

        const image = await outputPdf.embedJpg(jpegBytes);

        const page = outputPdf.addPage([
          viewport.width,
          viewport.height,
        ]);

        page.drawImage(image, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });

        /*
         * Release page resources before moving to the next page.
         */
        try {
          sourcePage.cleanup();
        } catch {}

        canvas.width = 1;
        canvas.height = 1;
      }

      setProgress("Building compressed PDF...");

      const compressedBytes = await outputPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const outputBuffer = new ArrayBuffer(
        compressedBytes.byteLength
      );

      new Uint8Array(outputBuffer).set(compressedBytes);

      const blob = new Blob(
        [outputBuffer],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);

      setCompressedSize(blob.size);
      setResult(url);
      setProgress("");

      /*
       * Do not keep unnecessary references alive.
       */
      if (sourcePdf) {
        try {
          sourcePdf.cleanup();
        } catch {}
      }
    } catch (err) {
      setProgress("");
      setError(
        err instanceof Error
          ? err.message
          : "Unable to compress this PDF. Please make sure the file is valid and not corrupted."
      );
    } finally {
      if (sourcePdf) {
        try {
          sourcePdf.cleanup();
        } catch {}
      }

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

  const reduction =
    originalSize > 0 && compressedSize > 0
      ? Math.max(
          0,
          Math.round(((originalSize - compressedSize) / originalSize) * 100)
        )
      : 0;

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
            <Zap className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Compress PDF
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Reduce PDF file size with a simple browser-based compression tool.
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
                      {(originalSize / 1024 / 1024).toFixed(2)} MB
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



              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">Compression level</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Higher compression creates a smaller file.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    {
                      id: "high" as const,
                      title: "High Quality",
                      description: "Best visual quality",
                    },
                    {
                      id: "balanced" as const,
                      title: "Balanced",
                      description: "Recommended",
                    },
                    {
                      id: "small" as const,
                      title: "Small Size",
                      description: "Maximum reduction",
                    },
                  ].map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setCompressionLevel(level.id)}
                      disabled={processing}
                      className={`rounded-xl border p-3 text-left transition ${
                        compressionLevel === level.id
                          ? "border-cyan-400/50 bg-cyan-400/10"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
                      }`}
                    >
                      <p className="text-sm font-bold">
                        {level.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {level.description}
                      </p>
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-xs leading-5 text-amber-300/70">
                  Compressed pages are rendered as images. Text may no longer
                  be selectable or searchable.
                </p>
              </div>

              <button
                type="button"
                onClick={compressPdf}
                disabled={processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {progress || "Compressing PDF..."}
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Compress PDF
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
                  <h3 className="font-bold">
                    PDF compressed successfully!
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Original: {(originalSize / 1024 / 1024).toFixed(2)} MB
                    {" · "}
                    New: {(compressedSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-black/20 p-4 text-center">
                <p className="text-2xl font-black text-emerald-300">
                  {reduction}% smaller
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Actual reduction depends on the pages, images, and compression level.
                </p>
              </div>

              <a
                href={result}
                download="pdfumo-compressed.pdf"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300"
              >
                <Download className="h-5 w-5" />
                Download Compressed PDF
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">Fast</p>
            <p className="mt-1 text-xs text-slate-500">
              Process PDFs directly in your browser
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">Private</p>
            <p className="mt-1 text-xs text-slate-500">
              Files stay on your device
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">Simple</p>
            <p className="mt-1 text-xs text-slate-500">
              No registration required
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
