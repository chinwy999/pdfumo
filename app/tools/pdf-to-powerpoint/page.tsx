"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Presentation,
  Upload,
} from "lucide-react";

declare global {
  interface Window {
    PptxGenJS?: new () => {
      layout: string;
      author: string;
      company: string;
      subject: string;
      title: string;
      addSlide: () => {
        addImage: (options: {
          data: string;
          x: number;
          y: number;
          w: number;
          h: number;
        }) => void;
      };
      writeFile: (options: { fileName: string }) => Promise<void>;
    };
  }
}

function loadPptxGenJS(): Promise<NonNullable<Window["PptxGenJS"]>> {
  return new Promise((resolve, reject) => {
    if (window.PptxGenJS) {
      resolve(window.PptxGenJS);
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";

    script.async = true;

    script.onload = () => {
      if (window.PptxGenJS) {
        resolve(window.PptxGenJS);
      } else {
        reject(
          new Error("PowerPoint engine loaded but is unavailable."),
        );
      }
    };

    script.onerror = () => {
      reject(
        new Error("Could not load the PowerPoint engine."),
      );
    };

    document.head.appendChild(script);
  });
}

export default function PdfToPowerPointPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  function selectFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Please select a PDF file only.");
      return;
    }

    setError("");
    setProgress("");
    setFile(selectedFile);
  }

  async function convertToPowerPoint() {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setProcessing(true);
    setError("");
    setProgress("Loading PDF...");

    try {
      /*
       * Use the exact PDF.js loading pattern already proven
       * to work in PDF → Word and PDF → Excel.
       */
      const pdfjs = await import("pdfjs-dist");

      const pdfjsLib = pdfjs as typeof import("pdfjs-dist");

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "/pdfjs/pdf.worker.min.mjs";

      const bytes = new Uint8Array(
        await file.arrayBuffer(),
      );

      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
      });

      const documentPdf = await loadingTask.promise;

      setProgress(
        `PDF loaded: ${documentPdf.numPages} page${
          documentPdf.numPages === 1 ? "" : "s"
        }.`,
      );

      const PptxGenJS = await loadPptxGenJS();

      const pptx = new PptxGenJS();

      pptx.author = "PDFumo";
      pptx.company = "PDFumo";
      pptx.subject = "PDF to PowerPoint conversion";
      pptx.title = file.name.replace(/\.pdf$/i, "");

      for (
        let pageNumber = 1;
        pageNumber <= documentPdf.numPages;
        pageNumber++
      ) {
        setProgress(
          `Converting page ${pageNumber} of ${documentPdf.numPages}...`,
        );

        const page =
          await documentPdf.getPage(pageNumber);

        const viewport = page.getViewport({
          scale: 1.5,
        });

        const canvas =
          document.createElement("canvas");

        const context =
          canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Could not create PDF rendering canvas.",
          );
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        const imageData =
          canvas.toDataURL("image/jpeg", 0.92);

        const slide = pptx.addSlide();

        slide.addImage({
          data: imageData,
          x: 0,
          y: 0,
          w: 10,
          h: 7.5,
        });

        canvas.width = 1;
        canvas.height = 1;

        if (typeof page.cleanup === "function") {
          page.cleanup();
        }
      }

      setProgress("Creating PowerPoint file...");

      const outputName =
        file.name.replace(/\.pdf$/i, "") +
        ".pptx";

      await pptx.writeFile({
        fileName: outputName,
      });

      setProgress(
        `Done! ${documentPdf.numPages} slide${
          documentPdf.numPages === 1 ? "" : "s"
        } created.`,
      );

      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (conversionError) {
      console.error(
        "PDF TO POWERPOINT ERROR:",
        conversionError,
      );

      const message =
        conversionError instanceof Error
          ? conversionError.message
          : String(conversionError);

      setProgress("");
      setError(
        `Conversion failed: ${message}`,
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
          <a
            href="/"
            className="flex items-center gap-3 text-slate-600 transition hover:text-indigo-600"
          >
            <ArrowLeft className="h-5 w-5" />

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500">
              <Presentation className="h-5 w-5 text-white" />
            </div>

            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              PDF<span className="text-indigo-600">umo</span>
            </span>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <Presentation className="h-8 w-8 text-orange-600" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              PDF to PowerPoint
            </h1>

            <p className="mt-3 text-slate-600">
              Convert PDF pages into PowerPoint slides
              directly in your browser.
            </p>
          </div>

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center transition hover:border-orange-400 hover:bg-slate-50"
            >
              <Upload className="mx-auto h-10 w-10 text-slate-400" />

              <p className="mt-4 text-lg font-semibold">
                Select a PDF file
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Your PDF is processed locally in your browser.
              </p>

              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) =>
                  selectFile(
                    event.target.files?.[0],
                  )
                }
              />
            </button>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
                  <FileText className="h-6 w-6 text-red-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {file.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {(
                      file.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={processing}
                onClick={convertToPowerPoint}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {progress || "Converting..."}
                  </>
                ) : (
                  <>
                    <Presentation className="h-5 w-5" />
                    Convert to PowerPoint
                  </>
                )}
              </button>
            </div>
          )}

          {progress && !processing && (
            <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              {progress}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
