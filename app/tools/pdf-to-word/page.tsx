"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Document, ImageRun, Packer, Paragraph, TextRun } from "docx";

type PdfState = {
  file: File;
  pages: number;
};

type ExtractedWordImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

function imageDataToRgba(
  image: any,
  width: number,
  height: number,
): Uint8ClampedArray | null {
  if (!image?.data) return null;

  const data = new Uint8Array(image.data);
  const pixels = width * height;

  if (data.length === pixels * 4) {
    return new Uint8ClampedArray(data);
  }

  if (data.length === pixels * 3) {
    const rgba = new Uint8ClampedArray(pixels * 4);

    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      rgba[j] = data[i];
      rgba[j + 1] = data[i + 1];
      rgba[j + 2] = data[i + 2];
      rgba[j + 3] = 255;
    }

    return rgba;
  }

  return null;
}

async function imageObjectToPng(
  image: any,
): Promise<ExtractedWordImage | null> {
  try {
    if (!image) return null;

    const width = Number(image.width ?? 0);
    const height = Number(image.height ?? 0);

    if (!width || !height) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    if (image.bitmap) {
      ctx.drawImage(image.bitmap, 0, 0, width, height);
    } else {
      const rgba = imageDataToRgba(image, width, height);

      if (!rgba) return null;

      const imageData = new ImageData(
        new Uint8ClampedArray(rgba),
        width,
        height,
      );

      ctx.putImageData(imageData, 0, 0);
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) return null;

    return {
      data: new Uint8Array(await blob.arrayBuffer()),
      width,
      height,
    };
  } catch (error) {
    console.warn("PDFUMO — image conversion failed:", error);
    return null;
  }
}

function getPdfImageObject(
  store: any,
  imageId: string,
  timeoutMs = 1500,
): Promise<any | null> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: any | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    try {
      store.get(imageId, (image: any) => {
        finish(image);
      });
    } catch {
      finish(null);
    }
  });
}

async function extractPageImages(
  page: any,
  pdfjsLib: any,
): Promise<ImageRun[]> {
  const images: ImageRun[] = [];

  try {
    const operatorList = await page.getOperatorList();

    const imageIds = new Set<string>();
    const inlineImages: any[] = [];

    for (let index = 0; index < operatorList.fnArray.length; index++) {
      const fn = operatorList.fnArray[index];
      const args = operatorList.argsArray[index];

      if (!args || !args.length) continue;

      if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintJpegXObject ||
        fn === pdfjsLib.OPS.paintImageXObjectRepeat
      ) {
        if (typeof args[0] === "string") {
          imageIds.add(args[0]);
        }
      }

      if (
        fn === pdfjsLib.OPS.paintInlineImageXObject ||
        fn === pdfjsLib.OPS.paintInlineImageXObjectGroup
      ) {
        if (args[0] && typeof args[0] === "object") {
          inlineImages.push(args[0]);
        }
      }
    }

    const resolvedImages = await Promise.all(
      [...imageIds].map(async (imageId) => {
        const store = imageId.startsWith("g_")
          ? page.commonObjs
          : page.objs;

        return getPdfImageObject(store, imageId);
      }),
    );

    const allImages = [
      ...resolvedImages.filter(Boolean),
      ...inlineImages,
    ];

    for (const image of allImages) {
      const png = await imageObjectToPng(image);

      if (!png) continue;

      const maxWidth = 600;
      const maxHeight = 450;
      const scale = Math.min(
        1,
        maxWidth / png.width,
        maxHeight / png.height,
      );

      images.push(
        new ImageRun({
          type: "png",
          data: png.data,
          transformation: {
            width: Math.max(1, Math.round(png.width * scale)),
            height: Math.max(1, Math.round(png.height * scale)),
          },
        }),
      );
    }

    console.log(
      `PDFUMO PDF.JS — page images: ${images.length} extracted`,
    );
  } catch (error) {
    console.warn("PDFUMO — page image extraction skipped:", error);
  }

  return images;
}

export default function PdfToWordPage() {
  const [pdf, setPdf] = useState<PdfState | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }
    };
  }, []);

  function clearResult() {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }

    setResult(null);
  }

  function selectFile(file: File | undefined) {
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Please select a PDF file only.");
      return;
    }

    setError("");
    clearResult();
    setProgress("");
    setPdf({ file, pages: 0 });
  }

  async function convertToWord() {
    if (!pdf) {
      setError("Please select a PDF file first.");
      return;
    }

    setProcessing(true);
    setError("");
    clearResult();
    setProgress("Loading PDF...");

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

      const pdfjsLib = pdfjs as typeof import("pdfjs-dist/legacy/build/pdf.mjs");

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "/pdfjs/pdf.worker.min.mjs";

      const bytes = new Uint8Array(await pdf.file.arrayBuffer());

      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
        standardFontDataUrl: "/pdfjs/standard_fonts/",
        cMapUrl: "/pdfjs/cmaps/",
        cMapPacked: true,
      });

      const documentPdf = await loadingTask.promise;

      setPdf((current) =>
        current
          ? {
              ...current,
              pages: documentPdf.numPages,
            }
          : current,
      );

      const paragraphs: Paragraph[] = [];

      for (let pageNumber = 1; pageNumber <= documentPdf.numPages; pageNumber++) {
        setProgress(
          `Extracting page ${pageNumber} of ${documentPdf.numPages}...`,
        );

        const page = await documentPdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

        const pageImages = await extractPageImages(page, pdfjsLib);

        if (pageImages.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: pageImages,
              spacing: {
                after: 120,
              },
            }),
          );
        }

        type PositionedTextItem = {
          text: string;
          x: number;
          y: number;
          width: number;
          fontSize: number;
        };

        const positionedItems: PositionedTextItem[] = textContent.items
          .filter(
            (
              item,
            ): item is typeof item & {
              str: string;
              transform: number[];
              width: number;
            } =>
              "str" in item &&
              "transform" in item &&
              Array.isArray(item.transform),
          )
          .map((item) => {
            const transform = item.transform;

            const x = Number(transform[4] ?? 0);
            const y = Number(transform[5] ?? 0);

            const fontSize = Math.max(
              1,
              Math.sqrt(
                Number(transform[0] ?? 0) ** 2 +
                  Number(transform[1] ?? 0) ** 2,
              ),
            );

            return {
              text: item.str.trim(),
              x,
              y,
              width: Number(item.width ?? 0),
              fontSize,
            };
          })
          .filter((item) => item.text.length > 0);

        console.log(
          `PDFUMO PDF.JS — page ${pageNumber}: ${positionedItems.length} positioned items`,
          positionedItems.slice(0, 20),
        );

        setProgress(
          `Page ${pageNumber}: ${positionedItems.length} text items found`,
        );

        if (pageNumber > 1) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: "" })],
              pageBreakBefore: true,
            }),
          );
        }

        if (positionedItems.length === 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Page ${pageNumber} contains no extractable text.]`,
                  italics: true,
                }),
              ],
            }),
          );
          continue;
        }

        /*
         * Reconstruct the visual reading order.
         *
         * PDF.js gives us positioned fragments, not normal lines.
         * First sort vertically, then horizontally.
         */

        const sortedItems = [...positionedItems].sort((a, b) => {
          const yDifference = Math.abs(a.y - b.y);

          if (yDifference > 3) {
            return b.y - a.y;
          }

          return a.x - b.x;
        });

        type TextLine = {
          items: PositionedTextItem[];
          y: number;
          fontSize: number;
        };

        const lines: TextLine[] = [];

        for (const item of sortedItems) {
          const tolerance = Math.max(3, item.fontSize * 0.45);

          let line = lines.find(
            (candidate) => Math.abs(candidate.y - item.y) <= tolerance,
          );

          if (!line) {
            line = {
              items: [],
              y: item.y,
              fontSize: item.fontSize,
            };

            lines.push(line);
          }

          line.items.push(item);
          line.fontSize = Math.max(line.fontSize, item.fontSize);
        }

        lines.sort((a, b) => b.y - a.y);

        /*
         * Convert each visual line into readable text.
         */

        const reconstructedLines = lines
          .map((line) => {
            line.items.sort((a, b) => a.x - b.x);

            let text = "";

            for (let index = 0; index < line.items.length; index++) {
              const item = line.items[index];
              const previous = line.items[index - 1];

              if (!previous) {
                text = item.text;
                continue;
              }

              const previousEnd = previous.x + previous.width;
              const gap = item.x - previousEnd;

              const needsSpace =
                !text.endsWith(" ") &&
                !item.text.startsWith(" ") &&
                (
                  gap > Math.max(1.5, line.fontSize * 0.12) ||
                  (
                    /[A-Za-z0-9]$/.test(text) &&
                    /^[A-Za-z0-9]/.test(item.text)
                  )
                );

              text += needsSpace ? ` ${item.text}` : item.text;
            }

            return {
              text: text.replace(/\s+/g, " ").trim(),
              y: line.y,
              fontSize: line.fontSize,
            };
          })
          .filter((line) => line.text.length > 0);

        /*
         * Combine normal wrapped lines into paragraphs.
         * Large vertical gaps create a new Word paragraph.
         */

        let currentParagraph = "";

        let previousLine:
          | (typeof reconstructedLines)[number]
          | null = null;

        function flushParagraph() {
          const text = currentParagraph.trim();

          if (!text) return;

          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text,
                }),
              ],
              spacing: {
                after: 120,
              },
            }),
          );

          currentParagraph = "";
        }

        for (const line of reconstructedLines) {
          if (!previousLine) {
            currentParagraph = line.text;
            previousLine = line;
            continue;
          }

          const verticalGap = previousLine.y - line.y;

          const expectedLineHeight = Math.max(
            previousLine.fontSize,
            line.fontSize,
            8,
          );

          if (verticalGap > expectedLineHeight * 1.8) {
            flushParagraph();
            currentParagraph = line.text;
          } else {
            currentParagraph += ` ${line.text}`;
          }

          previousLine = line;
        }

        flushParagraph();
      }

      if (paragraphs.length === 0) {
        throw new Error("No extractable text was found in this PDF.");
      }

      setProgress("Creating Word document...");

      const wordDocument = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(wordDocument);

      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult(url);
      setProgress("");
    } catch (conversionError) {
      console.error("PDF TO WORD ERROR:", conversionError);

      setProgress("");

      const message =
        conversionError instanceof Error
          ? conversionError.message
          : String(conversionError);

      setError(`Conversion failed: ${message}`);
    } finally {
      setProcessing(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    if (!processing) {
      selectFile(event.dataTransfer.files?.[0]);
    }
  }

  function clearFile() {
    if (processing) return;

    clearResult();
    setPdf(null);
    setError("");
    setProgress("");
  }

  const fileSizeLabel = pdf
    ? pdf.file.size >= 1024 * 1024
      ? `${(pdf.file.size / 1024 / 1024).toFixed(2)} MB`
      : `${Math.max(1, Math.round(pdf.file.size / 1024))} KB`
    : "";

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
            <FileText className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            PDF to Word
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Convert PDF files into editable Word documents quickly and easily.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div
            onDragOver={(event) => {
              event.preventDefault();

              if (!processing) {
                setDragActive(true);
              }
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
              Drop your PDF file here
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              or choose a file from your device
            </p>

            <label
              className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 ${
                processing
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
            >
              <Upload className="h-4 w-4" />
              Choose PDF File

              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={processing}
                className="hidden"
                onChange={(event) => {
                  selectFile(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            <p className="mt-4 text-xs text-slate-500">
              Your file is processed directly in your browser.
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {pdf && (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {pdf.file.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {fileSizeLabel}
                    {pdf.pages > 0 ? ` • ${pdf.pages} pages` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearFile}
                  disabled={processing}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remove PDF"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {progress && (
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-white p-4 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  <span>{progress}</span>
                </div>
              )}

              <button
                type="button"
                onClick={convertToWord}
                disabled={processing}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Converting to Word...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Convert to Word
                  </>
                )}
              </button>
            </div>
          )}

          {result && (
            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-emerald-900">
                      Word document created successfully
                    </h3>

                    <p className="mt-1 text-sm text-emerald-700">
                      Your editable Word document is ready.
                    </p>
                  </div>
                </div>

                <a
                  href={result}
                  download="converted.docx"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Download Word
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
          <span>✓ No registration</span>
          <span>✓ Editable DOCX</span>
          <span>✓ Browser-based processing</span>
        </div>
      </section>
    </main>
  );
}
