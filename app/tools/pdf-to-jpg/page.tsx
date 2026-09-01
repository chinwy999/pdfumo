"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type PdfJsModule = typeof import("pdfjs-dist");

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const pdfjsRef = useRef<PdfJsModule | null>(null);

  useEffect(() => {
    return () => {
      images.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  function selectFile(selected: File) {
    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file only.");
      return;
    }

    images.forEach((url) => URL.revokeObjectURL(url));

    setFile(selected);
    setImages([]);
    setError("");
  }

  function removeFile() {
    images.forEach((url) => URL.revokeObjectURL(url));
    setFile(null);
    setImages([]);
    setError("");
  }

  async function convertPdf() {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setProcessing(true);
    setError("");

    images.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);

    try {
      if (!pdfjsRef.current) {
        const pdfjs = await import("pdfjs-dist");
        pdfjsRef.current = pdfjs;
      }

      const pdfjs = pdfjsRef.current;

      const workerUrl = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
      ).toString();

      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      const bytes = await file.arrayBuffer();

      const pdf = await pdfjs.getDocument({
        data: new Uint8Array(bytes),
      }).promise;

      const output: string[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to create image canvas.");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.9);
        });

        if (!blob) {
          throw new Error(`Unable to convert page ${pageNumber}.`);
        }

        output.push(URL.createObjectURL(blob));
        canvas.width = 1;
        canvas.height = 1;
      }

      setImages(output);

      if (!output.length) {
        throw new Error("No pages were found in this PDF.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to convert this PDF. Please make sure the file is valid."
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

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <FileImage className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            PDF to JPG
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Convert PDF pages into high-quality JPG images directly in your
            browser.
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
                    <p className="truncate text-sm font-bold">{file.name}</p>

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

              <button
                type="button"
                onClick={convertPdf}
                disabled={processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Converting PDF...
                  </>
                ) : (
                  <>
                    <FileImage className="h-5 w-5" />
                    Convert to JPG
                  </>
                )}
              </button>
            </div>
          )}

          {images.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Converted Pages</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {images.length} JPG image{images.length === 1 ? "" : "s"} ready
                  </p>
                </div>

                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {images.map((image, index) => (
                  <div
                    key={image}
                    className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20"
                  >
                    <div className="aspect-[4/3] bg-white p-2">
                      <img
                        src={image}
                        alt={`Converted PDF page ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 p-3">
                      <span className="truncate text-sm font-semibold">
                        Page {index + 1}.jpg
                      </span>

                      <a
                        href={image}
                        download={`pdfumo-page-${index + 1}.jpg`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-emerald-300"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4 text-center">
                <p className="text-sm font-bold text-emerald-300">
                  PDF converted successfully!
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Download each JPG page individually.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">High Quality</p>
            <p className="mt-1 text-xs text-slate-500">
              Rendered as JPG images
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
