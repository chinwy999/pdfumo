"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

type ImageFile = {
  id: string;
  file: File;
  preview: string;
};

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  function addFiles(selected: FileList | File[]) {
    const images = Array.from(selected).filter((file) => {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();

      return (
        type === "image/jpeg" ||
        type === "image/jpg" ||
        type === "image/png" ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png")
      );
    });

    if (!images.length) {
      setError("Please select JPG, JPEG or PNG image files only.");
      return;
    }

    setError("");
    setResult(null);

    const newFiles = images.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setFiles((current) => [...current, ...newFiles]);
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const item = current.find((file) => file.id === id);

      if (item) {
        URL.revokeObjectURL(item.preview);
      }

      return current.filter((file) => file.id !== id);
    });

    if (result) {
      URL.revokeObjectURL(result);
      setResult(null);
    }
  }

  function clearAll() {
    files.forEach((item) => URL.revokeObjectURL(item.preview));

    if (result) {
      URL.revokeObjectURL(result);
    }

    setFiles([]);
    setResult(null);
    setError("");
  }

  async function imageToJpegBytes(file: File): Promise<Uint8Array> {
    const bitmap = await createImageBitmap(file);

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      throw new Error("Unable to create image canvas.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0);

    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.95);
    });

    canvas.width = 1;
    canvas.height = 1;

    if (!blob) {
      throw new Error(`Unable to process ${file.name}.`);
    }

    return new Uint8Array(await blob.arrayBuffer());
  }

  async function createPdf() {
    if (!files.length) {
      setError("Please select at least one image.");
      return;
    }

    setProcessing(true);
    setError("");

    if (result) {
      URL.revokeObjectURL(result);
      setResult(null);
    }

    try {
      const pdf = await PDFDocument.create();

      for (const item of files) {
        const jpegBytes = await imageToJpegBytes(item.file);
        const image = await pdf.embedJpg(jpegBytes);

        const maxWidth = 595;
        const maxHeight = 842;

        const scale = Math.min(
          maxWidth / image.width,
          maxHeight / image.height,
          1
        );

        const width = image.width * scale;
        const height = image.height * scale;

        const page = pdf.addPage([maxWidth, maxHeight]);

        page.drawImage(image, {
          x: (maxWidth - width) / 2,
          y: (maxHeight - height) / 2,
          width,
          height,
        });
      }

      const pdfBytes = await pdf.save();

      const blob = new Blob(
        [new Uint8Array(pdfBytes)],
        { type: "application/pdf" }
      );

      const url = URL.createObjectURL(blob);

      setResult(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the PDF. Please make sure your images are valid."
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

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <FileImage className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            JPG to PDF
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Convert JPG and PNG images into a clean PDF document directly in
            your browser.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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
              Drop your images here
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              or choose multiple images from your device
            </p>

            <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              Choose Images

              <input
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                multiple
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
              JPG, JPEG and PNG files are supported.
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
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Selected Images ({files.length})
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Images will become PDF pages in this order.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-slate-500 transition hover:text-red-600"
                >
                  Clear all
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100 p-2">
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="h-full w-full rounded-lg bg-white object-contain"
                      />

                      <div className="absolute left-4 top-4 flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-900/80 px-2 text-xs font-bold text-white">
                        {index + 1}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 border-t border-slate-200 p-3">
                      <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">
                          {item.file.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <FileImage className="h-4 w-4 shrink-0 text-indigo-500" />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={createPdf}
                disabled={processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Create PDF
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-emerald-900">
                    PDF created successfully!
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    Your {files.length} image
                    {files.length === 1 ? "" : "s"} have been combined into one
                    PDF document.
                  </p>
                </div>

                <a
                  href={result}
                  download="pdfumo-images.pdf"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-medium text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Your images are processed directly in your browser.
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileImage className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-slate-900">
              Multiple Images
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Combine multiple JPG or PNG images into one PDF.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <GripVertical className="h-5 w-5" />
            </div>

            <p className="mt-3 text-sm font-bold text-slate-900">
              Simple Ordering
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Images are added to the PDF in the selected order.
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
              No upload to a server is required.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
          <span>✓ No registration</span>
          <span>✓ JPG & PNG supported</span>
          <span>✓ Browser-based processing</span>
        </div>
      </section>
    </main>
  );
}
