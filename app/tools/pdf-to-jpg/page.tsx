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

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
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
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Title */}
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <FileImage className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            PDF to JPG
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Convert PDF pages into high-quality JPG images directly in your
            browser.
          </p>
        </div>

        {/* Workspace */}
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {/* Upload */}
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
                Your PDF is processed directly in your browser.
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

              <button
                type="button"
                onClick={convertPdf}
                disabled={processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* Results */}
          {images.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Converted Pages
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {images.length} JPG image
                    {images.length === 1 ? "" : "s"} ready
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {images.map((image, index) => (
                  <div
                    key={image}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="aspect-[4/3] bg-slate-100 p-2">
                      <img
                        src={image}
                        alt={`Converted PDF page ${index + 1}`}
                        className="h-full w-full rounded-lg bg-white object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-3">
                      <span className="truncate text-sm font-semibold text-slate-700">
                        Page {index + 1}.jpg
                      </span>

                      <a
                        href={image}
                        download={`pdfumo-page-${index + 1}.jpg`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <p className="text-sm font-bold text-emerald-800">
                  PDF converted successfully!
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  Download each JPG page individually.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileImage className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-slate-900">
              High Quality
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              PDF pages are rendered as JPG images.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Upload className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-slate-900">
              Easy to Use
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Upload your PDF and convert it in a few clicks.
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
              Your PDF is processed directly in your browser.
            </p>
          </div>
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
