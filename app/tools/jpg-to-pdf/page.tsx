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
            JPG to PDF
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Convert JPG and PNG images into a clean PDF document directly in
            your browser.
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
              Drop your images here
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              or choose multiple images from your device
            </p>

            <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-50">
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

            <p className="mt-4 text-xs text-slate-600">
              JPG, JPEG and PNG files are supported.
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-7">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    Selected Images ({files.length})
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Images will become PDF pages in this order.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-slate-500 transition hover:text-red-400"
                >
                  Clear all
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20"
                  >
                    <div className="relative aspect-[4/3] bg-white p-2">
                      <img
                        src={item.preview}
                        alt={`Selected image ${index + 1}`}
                        className="h-full w-full object-contain"
                      />

                      <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950/80 text-xs font-black">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3">
                      <GripVertical className="h-5 w-5 shrink-0 text-slate-600" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {item.file.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
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
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={createPdf}
                disabled={processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-sm font-extrabold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Create PDF from {files.length} Image
                    {files.length === 1 ? "" : "s"}
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
                    PDF created successfully!
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    {files.length} image{files.length === 1 ? "" : "s"} converted
                    into PDF pages.
                  </p>
                </div>
              </div>

              <a
                href={result}
                download="pdfumo-images.pdf"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300"
              >
                <Download className="h-5 w-5" />
                Download PDF
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
            <p className="text-sm font-bold">Multiple Images</p>
            <p className="mt-1 text-xs text-slate-500">
              Convert several images at once
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
