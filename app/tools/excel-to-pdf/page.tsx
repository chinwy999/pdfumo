"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

type WorkbookData = {
  name: string;
  rows: string[][];
};

type PageSize = "portrait" | "landscape";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

function getPageDimensions(orientation: PageSize) {
  return orientation === "landscape"
    ? { width: PAGE_HEIGHT, height: PAGE_WIDTH }
    : { width: PAGE_WIDTH, height: PAGE_HEIGHT };
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  return String(value);
}

function getColumnWidths(rows: string[][], maxWidth = 150) {
  const columnCount = rows.reduce(
    (max, row) => Math.max(max, row.length),
    0,
  );

  const widths = Array.from({ length: columnCount }, (_, columnIndex) => {
    const longest = rows.reduce((max, row) => {
      const value = row[columnIndex] ?? "";
      return Math.max(max, value.length);
    }, 0);

    return Math.min(maxWidth, Math.max(45, longest * 6 + 14));
  });

  return widths;
}

function splitText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
) {
  if (!text) return [""];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
      current = word;
    } else {
      let chunk = "";

      for (const char of Array.from(word)) {
        const candidateChunk = chunk + char;

        if (
          font.widthOfTextAtSize(candidateChunk, fontSize) <=
          maxWidth
        ) {
          chunk = candidateChunk;
        } else {
          if (chunk) {
            lines.push(chunk);
          }
          chunk = char;
        }
      }

      current = chunk;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function drawCell(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  header: boolean,
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderWidth: 0.5,
    borderColor: rgb(0.78, 0.8, 0.84),
    color: header
      ? rgb(0.94, 0.95, 0.98)
      : rgb(1, 1, 1),
  });

  const padding = 5;
  const lines = splitText(
    text,
    font,
    fontSize,
    Math.max(10, width - padding * 2),
  );

  const lineHeight = fontSize + 2;
  const maxLines = Math.max(
    1,
    Math.floor((height - padding * 2) / lineHeight),
  );

  const visibleLines = lines.slice(0, maxLines);

  visibleLines.forEach((line, index) => {
    page.drawText(line, {
      x: x + padding,
      y:
        y +
        height -
        padding -
        fontSize -
        index * lineHeight,
      size: fontSize,
      font,
      color: rgb(0.12, 0.15, 0.2),
    });
  });
}

function drawWorksheet(
  pdf: PDFDocument,
  sheet: WorkbookData,
  font: PDFFont,
  orientation: PageSize,
  fontSize: number,
) {
  const { width: pageWidth, height: pageHeight } =
    getPageDimensions(orientation);

  const margin = 32;
  const topMargin = 42;
  const bottomMargin = 32;
  const rowHeight = Math.max(24, fontSize + 12);

  if (!sheet.rows.length) {
    const page = pdf.addPage([pageWidth, pageHeight]);

    page.drawText(sheet.name, {
      x: margin,
      y: pageHeight - topMargin,
      size: 16,
      font,
      color: rgb(0.12, 0.15, 0.2),
    });

    return;
  }

  const widths = getColumnWidths(
    sheet.rows,
    orientation === "landscape" ? 135 : 110,
  );

  const availableWidth = pageWidth - margin * 2;
  const totalWidth = widths.reduce((sum, value) => sum + value, 0);
  const scale =
    totalWidth > availableWidth
      ? availableWidth / totalWidth
      : 1;

  const scaledWidths = widths.map((value) => value * scale);

  let page = pdf.addPage([pageWidth, pageHeight]);

  let currentY = pageHeight - topMargin;

  function addNewPage() {
    page = pdf.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - topMargin;
  }

  function drawHeader() {
    page.drawText(sheet.name, {
      x: margin,
      y: pageHeight - 22,
      size: 11,
      font,
      color: rgb(0.3, 0.33, 0.4),
    });
  }

  function drawTableRow(row: string[], isHeader: boolean) {
    let x = margin;

    scaledWidths.forEach((cellWidth, columnIndex) => {
      const value = row[columnIndex] ?? "";

      drawCell(
        page,
        font,
        value,
        x,
        currentY - rowHeight,
        cellWidth,
        rowHeight,
        fontSize,
        isHeader,
      );

      x += cellWidth;
    });

    currentY -= rowHeight;
  }

  drawHeader();

  // Draw the first row as the table header.
  drawTableRow(sheet.rows[0], true);

  for (let rowIndex = 1; rowIndex < sheet.rows.length; rowIndex++) {
    if (currentY - rowHeight < bottomMargin) {
      addNewPage();
      drawHeader();

      // Repeat the Excel header row on every new PDF page.
      drawTableRow(sheet.rows[0], true);
    }

    drawTableRow(sheet.rows[rowIndex], false);
  }
}

export default function ExcelToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<WorkbookData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [orientation, setOrientation] =
    useState<PageSize>("portrait");
  const [fontSize, setFontSize] = useState(9);
  const [processing, setProcessing] = useState(false);
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

  async function selectFile(selected: File | undefined) {
    if (!selected) return;

    const lower = selected.name.toLowerCase();
    const valid =
      lower.endsWith(".xlsx") ||
      lower.endsWith(".xls");

    if (!valid) {
      setError("Please select an Excel file (.xlsx or .xls).");
      return;
    }

    try {
      setError("");
      clearResult();

      const buffer = await selected.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const parsedSheets: WorkbookData[] =
        workbook.SheetNames.map((name) => {
          const worksheet = workbook.Sheets[name];

          const rows = XLSX.utils
            .sheet_to_json(worksheet, {
              header: 1,
              defval: "",
              raw: false,
            })
            .map((row) =>
              (row as unknown[]).map(normalizeCellValue),
            );

          return {
            name,
            rows,
          };
        });

      if (!parsedSheets.length) {
        setError("The Excel file does not contain any worksheets.");
        return;
      }

      setFile(selected);
      setSheets(parsedSheets);
      setSelectedSheet(0);
    } catch {
      setError(
        "Unable to read this Excel file. Please make sure it is a valid .xlsx or .xls file.",
      );
      setFile(null);
      setSheets([]);
    }
  }

  async function convertToPdf() {
    if (!file || !sheets.length) {
      setError("Please select an Excel file first.");
      return;
    }

    setProcessing(true);
    setError("");
    clearResult();

    try {
      const pdf = await PDFDocument.create();
      pdf.registerFontkit(fontkit);

      const fontBytes = await fetch(
        "/pdfjs/standard_fonts/LiberationSans-Regular.ttf",
      ).then(async (response) => {
        if (!response.ok) {
          throw new Error("Font unavailable");
        }

        return response.arrayBuffer();
      });

      const font = await pdf.embedFont(fontBytes);

      drawWorksheet(
        pdf,
        sheets[selectedSheet],
        font,
        orientation,
        fontSize,
      );

      const bytes = await pdf.save();

      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      resultUrlRef.current = url;
      setResult(url);
    } catch {
      setError(
        "Unable to convert this Excel file to PDF. Please try again with a valid workbook.",
      );
    } finally {
      setProcessing(false);
    }
  }

  function clearAll() {
    clearResult();
    setFile(null);
    setSheets([]);
    setSelectedSheet(0);
    setError("");
  }

  const currentSheet = sheets[selectedSheet];

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
              <FileSpreadsheet className="h-5 w-5 text-white" />
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
            <FileSpreadsheet className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Excel to PDF
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Convert Excel spreadsheets into clean PDF documents directly in your browser.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {!file && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40 sm:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                <Upload className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                Drop your Excel file here
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                or choose a file from your device
              </p>

              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
                <Upload className="h-4 w-4" />
                Choose Excel File

                <input
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={(event) => {
                    void selectFile(event.target.files?.[0]);
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

          {file && currentSheet && (
            <div className="mt-1">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {sheets.length} worksheet{sheets.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={processing}
                  className="self-start rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-red-600 disabled:opacity-50 sm:self-auto"
                >
                  Remove
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Worksheet
                  </span>

                  <select
                    value={selectedSheet}
                    onChange={(event) =>
                      setSelectedSheet(Number(event.target.value))
                    }
                    disabled={processing}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-indigo-500"
                  >
                    {sheets.map((sheet, index) => (
                      <option key={sheet.name} value={index}>
                        {sheet.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Page
                  </span>

                  <select
                    value={orientation}
                    onChange={(event) =>
                      setOrientation(
                        event.target.value as PageSize,
                      )
                    }
                    disabled={processing}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-indigo-500"
                  >
                    <option value="portrait">
                      A4 Portrait
                    </option>
                    <option value="landscape">
                      A4 Landscape
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Font size
                  </span>

                  <select
                    value={fontSize}
                    onChange={(event) =>
                      setFontSize(Number(event.target.value))
                    }
                    disabled={processing}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-indigo-500"
                  >
                    <option value={8}>8 px</option>
                    <option value={9}>9 px</option>
                    <option value={10}>10 px</option>
                    <option value={11}>11 px</option>
                    <option value={12}>12 px</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-xs">
                    <tbody>
                      {currentSheet.rows
                        .slice(0, 20)
                        .map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className={`border-b border-r border-slate-200 px-3 py-2 ${
                                  rowIndex === 0
                                    ? "bg-slate-100 font-bold text-slate-800"
                                    : "bg-white text-slate-600"
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {currentSheet.rows.length > 20 && (
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">
                    Preview shows the first 20 rows.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void convertToPdf()}
                disabled={processing}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Converting to PDF...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-5 w-5" />
                    Convert to PDF
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
                      PDF created successfully
                    </h3>

                    <p className="mt-1 text-sm text-emerald-700">
                      Your PDF is ready to download.
                    </p>
                  </div>
                </div>

                <a
                  href={result}
                  download={`${file?.name.replace(/\.(xlsx|xls)$/i, "") || "excel"}.pdf`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>
          )}
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
