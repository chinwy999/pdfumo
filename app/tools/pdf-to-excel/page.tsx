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
import { PaddleOCR } from "@paddleocr/paddleocr-js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";

type PdfState = {
  file: File;
  pages: number;
};

// PDFumo: reverse Arabic words (PDF renders RTL text LTR).
// Detects runs of Arabic characters and reverses each word
// while keeping non-Arabic parts intact.
function reverseArabicWords(input: string): string {
  if (!input) return input;

  return input.replace(
    /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g,
    (match) => Array.from(match).reverse().join(""),
  );
}

// PDFumo: Convert Arabic Presentation Forms (U+FE70–U+FEFF)
// to their base Unicode letters, so we get "ش" instead of "ﺶ".
function normalizeArabicPresentation(input: string): string {
  return input
    .replace(/[\uFE70-\uFEFF]/g, (ch) => {
      const code = ch.charCodeAt(0);
      // Map Presentation Form to base letter using
      // Unicode's NFKC normalization (browser built-in).
      return ch.normalize("NFKC");
    })
    .replace(/[\u200f\u200e\u202a-\u202e]/g, "") // strip bidi marks
    .replace(/\u0000/g, "")                        // strip NUL
    .replace(/[\u064B-\u065F\u0670]/g, "");     // strip harakat (optional)
}

// PDFumo: merge split Arabic letters into words using X proximity.
// Tesseract returns each Arabic letter as a separate item; we must
// group them into words for correct output.
function mergeArabicLetters(
  items: PdfTextItem[],
  gapThreshold = 8,
): PdfTextItem[] {
  if (items.length === 0) return items;

  const sorted = [...items].sort((a, b) => {
    const ya = a.transform?.[5] ?? 0;
    const yb = b.transform?.[5] ?? 0;
    if (Math.abs(ya - yb) > 5) return yb - ya; // top-to-bottom

    const xa = a.transform?.[4] ?? 0;
    const xb = b.transform?.[4] ?? 0;

    // PDFumo: Arabic text is stored in PDF as LTR (visual),
    // but must be read RTL (logical). Sort Arabic pairs
    // right-to-left so mergeArabicLetters concatenates in
    // the correct order.
    const isArabicA = /[\u0600-\u06FF]/.test(a.str);
    const isArabicB = /[\u0600-\u06FF]/.test(b.str);

    if (isArabicA && isArabicB) {
      return xb - xa; // right-to-left
    }
    return xa - xb; // left-to-right
  });

  const merged: PdfTextItem[] = [];

  for (const item of sorted) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push({ ...item });
      continue;
    }

    const lastY = last.transform?.[5] ?? 0;
    const curY = item.transform?.[5] ?? 0;
    const lastX = last.transform?.[4] ?? 0;
    const lastW = last.width ?? 0;
    const curX = item.transform?.[4] ?? 0;

    const sameLine = Math.abs(lastY - curY) < 3;
    const gap = curX - (lastX + lastW);

    // Only merge Arabic letters (or Arabic + digits)
    const bothArabic =
      /[\u0600-\u06FF]/.test(last.str) &&
      /[\u0600-\u06FF]/.test(item.str);
    const arabicDigit =
      /[\u0600-\u06FF]/.test(last.str) && /[0-9]/.test(item.str);

    if (sameLine && gap < gapThreshold && (bothArabic || arabicDigit)) {
      last.str = last.str + item.str;
      last.width = (lastW ?? 0) + (item.width ?? 0) + gap;
    } else {
      merged.push({ ...item });
    }
  }

    // PDFumo: reverse each merged Arabic word
  // (PDF stores RTL text in visual order, we need logical order).
  return merged.map((item) => ({
    ...item,
    str: /[\u0600-\u06FF]/.test(item.str)
      ? Array.from(item.str).reverse().join("")
      : item.str,
  }));
}

type PdfTextItem = {
  str: string;
  transform: number[];
  width?: number;
};

export default function PdfToExcelPage() {
  const [pdf, setPdf] = useState<PdfState | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("")
  const [rawExtractionDebug, setRawExtractionDebug] = useState<string[]>([])
;
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
    setPdf({
      file,
      pages: 0,
    });
  }

  function mergeCellText(
  current: string,
  next: string,
) {
  if (!current) return next;

  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

  const currentHasArabic = arabicPattern.test(current);
  const nextHasArabic = arabicPattern.test(next);

  if (currentHasArabic && nextHasArabic) {
    return `${current}${next}`;
  }

  return `${current} ${next}`.trim();
}

function normalizeExtractedText(text: string) {
// تحسين معالجة النص العربي
return text.trim();
}


function isArabicText(text: string): boolean {
  const arabicRange = /[\u0600-\u06FF]/;
  return arabicRange.test(text);
}




/*
 * PDFumo V7 OCR TABLE RECONSTRUCTION
 *
 * Designed for scanned / corrupted Arabic table PDFs where
 * Tesseract returns reliable word bounding boxes but the
 * normal gap-based buildRows() can misplace columns.
 *
 * The tested document uses four stable visual columns.
 * Coordinates below are PDF-space coordinates obtained from
 * 300 DPI OCR rendering (image coordinates / scale 3).
 *
 * Important:
 * - Do not guess or correct OCR text.
 * - Preserve every OCR word.
 * - Use geometry to determine the column.
 * - Use the rightmost column to identify real table rows.
 */
function buildRowsOCRTable(
  items: PdfTextItem[],
  nativeItems: PdfTextItem[] = [],
) {
  type OCRWord = {
    text: string;
    x: number;
    y: number;
    width: number;
    right: number;
    centerX: number;
  };

  const arabicPattern =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

  const words: OCRWord[] = items
    .filter((item) => item.str.trim())
    .map((item) => {
      const x = item.transform[4] ?? 0;
      const y = item.transform[5] ?? 0;
      const width = item.width ?? 0;

      return {
        text: item.str.trim(),
        x,
        y,
        width,
        right: x + width,
        centerX: x + width / 2,
      };
    });

  if (words.length === 0) {
    return [];
  }

  /*
   * PDFumo V7 — corrected column geometry.
   *
   * Tesseract.js v7 returns PDF-space coordinates after the
   * OCR scale is removed. The actual tested page positions
   * are approximately:
   *
   *   column 0: x ≈ 125  -> masked ID/code
   *   column 1: x ≈ 244  -> surname / second Arabic word
   *   column 2: x ≈ 357  -> first Arabic name
   *   column 3: x ≈ 456  -> candidate number
   *
   * Use X position rather than the word center because Arabic
   * OCR words can have negative widths in RTL text.
   */
  const nearestColumn = (x: number) => {
    if (x < 200) return 0;
    if (x < 330) return 1;
    if (x < 410) return 2;
    if (x < 520) return 3;

    return null;
  };

  /*
   * Group OCR words into visual rows.
   * OCR PDF-space Y is bottom-origin, therefore higher Y
   * appears first in the document.
   */
  const sorted = [...words].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 10) {
      return b.y - a.y;
    }

    return a.x - b.x;
  });

  type Row = {
    y: number;
    words: OCRWord[];
  };

  const rowGroups: Row[] = [];

  for (const word of sorted) {
    let target: Row | undefined;

    for (const row of rowGroups) {
      if (Math.abs(row.y - word.y) <= 10) {
        target = row;
        break;
      }
    }

    if (!target) {
      rowGroups.push({
        y: word.y,
        words: [word],
      });
    } else {
      target.words.push(word);

      target.y =
        target.words.reduce(
          (sum, item) => sum + item.y,
          0,
        ) / target.words.length;
    }
  }

  rowGroups.sort((a, b) => b.y - a.y);

  /*
   * PDFumo V8 Hybrid:
   * Native PDF extraction is much more reliable for the masked
   * ID/CNI column than Arabic OCR. Keep native words separately
   * and match them to OCR rows using the same PDF Y coordinate.
   *
   * The tested document places the CNI/masked ID around X 125.
   */
  const nativeCodeWords = nativeItems
    .filter((item) => item.str.trim())
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
    }))
    .filter(
      (item) =>
        item.x < 200 &&
        /[A-Za-z]/.test(item.text) &&
        /\d/.test(item.text),
    );

  const findNativeCodeForRow = (rowY: number) => {
    if (nativeCodeWords.length === 0) {
      return "";
    }

    const candidates = nativeCodeWords
      .map((item) => ({
        ...item,
        distance: Math.abs(item.y - rowY),
      }))
      .filter((item) => item.distance <= 5)
      .sort((a, b) => a.distance - b.distance);

    return candidates[0]?.text ?? "";
  };

  /*
   * PDFumo V9 Hybrid:
   * The candidate-number column is available in the original
   * native PDF text around X 453-456.
   *
   * OCR misreads candidate 113 as 13, while native extraction
   * contains the correct value 113. Prefer native candidate
   * numbers and keep OCR as fallback.
   */
  const nativeCandidateWords = nativeItems
    .filter((item) => item.str.trim())
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
    }))
    .filter(
      (item) =>
        item.x >= 400 &&
        item.x < 520 &&
        /^\d{1,4}$/.test(item.text),
    );

  const findNativeCandidateForRow = (rowY: number) => {
    if (nativeCandidateWords.length === 0) {
      console.log(
        "[PDFumo NATIVE CANDIDATE DEBUG] EMPTY",
        JSON.stringify({
          nativeItems: nativeItems.length,
          rowY,
        }),
      );
      return "";
    }

    const candidates = nativeCandidateWords
      .map((item) => ({
        ...item,
        distance: Math.abs(item.y - rowY),
      }))
      .filter((item) => item.distance <= 5)
      .sort((a, b) => a.distance - b.distance);

    const result = candidates[0]?.text ?? "";

    if (result === "13" || rowY > 370 && rowY < 395) {
      console.log(
        "[PDFumo NATIVE CANDIDATE DEBUG]",
        JSON.stringify({
          rowY,
          nativeCandidateCount: nativeCandidateWords.length,
          native113: nativeCandidateWords.filter(
            (item) => item.text === "113",
          ),
          nearby: candidates.slice(0, 8),
          result,
        }),
      );
    }

    return result;
  };

  const output: string[][] = [];

  for (const row of rowGroups) {
    const columns: OCRWord[][] = [
      [],
      [],
      [],
      [],
    ];

    for (const word of row.words) {
      const column = nearestColumn(word.x);

      if (column !== null) {
        columns[column].push(word);
      }
    }

    /*
     * The fourth/rightmost column is the strongest signal
     * that this is an actual candidate row.
     *
     * Page 2 contains introductory text before the table;
     * this prevents that text from becoming Excel rows.
     *
     * Candidate numbers in this document are numeric, but
     * we allow OCR artifacts such as invisible RTL marks.
     */
    const candidateColumn = columns[3];

    const hasCandidateNumber =
      candidateColumn.length > 0 &&
      candidateColumn.some((word) =>
        /\d/.test(word.text),
      );

    if (!hasCandidateNumber) {
      continue;
    }

    /*
     * A valid table row should normally have at least three
     * occupied columns. This protects against isolated OCR
     * noise near the candidate-number column.
     */
    const occupiedColumns = columns.filter(
      (column) => column.length > 0,
    ).length;

    if (occupiedColumns < 3) {
      continue;
    }

    // PDFumo DEBUG — inspect OCR geometry before rowOutput
    if (row.y > 700 && row.y < 800) {
      console.log(
        "[PDFumo ROW GEOMETRY]",
        JSON.stringify({
          rowY: row.y,
          words: row.words.map((word) => ({
            text: word.text,
            x: word.x,
            y: word.y,
            width: word.width,
            right: word.right,
            detectedColumn: nearestColumn(word.x),
          })),
          columns: columns.map((column) =>
            column.map((word) => ({
              text: word.text,
              x: word.x,
              y: word.y,
              detectedColumn: nearestColumn(word.x),
            })),
          ),
        }),
      );
    }

    const rowOutput = columns.map((column) => {
      if (column.length === 0) {
        return "";
      }

      const hasArabic = column.some((word) =>
        arabicPattern.test(word.text),
      );

      const ordered = [...column].sort((a, b) =>
        hasArabic
          ? b.x - a.x
          : a.x - b.x,
      );

      return ordered
        .map((word) => word.text)
        .join(" ")
        .trim();
    });

    /*
     * PDFumo V7 final table order.
     *
     * OCR geometry detects the visual columns as:
     *   0 = masked ID/code
     *   1 = surname / second Arabic word
     *   2 = first Arabic name
     *   3 = candidate number
     *
     * Excel should expose the logical order:
     *   candidate number | first name | surname | masked ID
     */
    // PDFumo V8 Hybrid:
    // Prefer the original native PDF value for the masked
    // ID/CNI column because OCR can misread Latin characters
    // and masked codes as Arabic.
    const nativeCode = findNativeCodeForRow(row.y);
    const nativeCandidate = findNativeCandidateForRow(row.y);

    const orderedRow = [
      nativeCandidate || rowOutput[3] || "",
      rowOutput[2] ?? "",
      rowOutput[1] ?? "",
      nativeCode || rowOutput[0] || "",
    ];

    output.push(orderedRow);
  }

  console.log(
    "[PDFumo V7 OCR TABLE]",
    JSON.stringify({
      inputItems: items.length,
      rowCount: output.length,
      columnCounts: [0, 1, 2, 3].map((column) =>
        output.filter((row) => row[column]).length,
      ),
    }),
  );

  return output;
}


/*
 * Detect the specific four-column OCR table geometry before
 * enabling buildRowsOCRTable().
 *
 * OCR coordinates inside PdfTextItem are already divided by
 * the OCR scale (3), so the tested image centers:
 * 616, 1064.5, 1513, 1919
 * correspond approximately to:
 * 205.3, 354.8, 504.3, 639.7 PDF units.
 *
 * Returns null when the page does not resemble this table.
 */
function buildRowsOCRTableIfDetected(
  items: PdfTextItem[],
  nativeItems: PdfTextItem[] = [],
): string[][] | null {
  if (items.length < 80) {
    return null;
  }

  /*
   * PDFumo V7 detector — use the actual Tesseract.js
   * X positions observed on the tested document.
   *
   * Important:
   * Arabic OCR words can have negative widths, so using
   * centerX here is unreliable. Detection therefore uses
   * the word's X origin, exactly like buildRowsOCRTable().
   *
   *   x < 200       -> masked ID/code
   *   200 <= x <330 -> Arabic surname/second word
   *   330 <= x <410 -> Arabic first name
   *   410 <= x <520 -> candidate number
   */
  const counts = [0, 0, 0, 0];

  for (const item of items) {
    if (!item.str.trim()) continue;

    const x = item.transform[4] ?? 0;

    let column: number | null = null;

    if (x < 200) {
      column = 0;
    } else if (x < 330) {
      column = 1;
    } else if (x < 410) {
      column = 2;
    } else if (x < 520) {
      column = 3;
    }

    if (column !== null) {
      counts[column]++;
    }
  }

  /*
   * The tested table consistently has a dense rightmost
   * candidate-number column and three additional columns.
   */
  const detected =
    counts[3] >= 20 &&
    counts[0] >= 20 &&
    counts[1] >= 20 &&
    counts[2] >= 20;

  if (!detected) {
    return null;
  }

  console.log(
    "[PDFumo V7 DETECTED]",
    JSON.stringify({
      itemCount: items.length,
      columnWordCounts: counts,
    }),
  );

  return buildRowsOCRTable(items, nativeItems);
}

function buildRows(items: PdfTextItem[]) {
  type Word = {
    text: string;
    x: number;
    y: number;
    width: number;
    right: number;
  };

  const words: Word[] = items
    .filter((item) => item.str.trim())
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
      width: item.width ?? 0,
      right:
        (item.transform[4] ?? 0) +
        (item.width ?? 0),
    }));

  if (words.length === 0) {
    return [];
  }

  const hasArabic = (text: string) =>
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(
      text,
    );

  const arabicCount = (text: string) =>
    (
      text.match(
        /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g,
      ) || []
    ).length;

  const latinCount = (text: string) =>
    (text.match(/[A-Za-z]/g) || []).length;

  /*
   * OCR coordinates are PDF-like:
   * higher Y = higher on the page.
   *
   * Group words into visual lines first.
   */
  const sorted = [...words].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 8) {
      return b.y - a.y;
    }

    return a.x - b.x;
  });

  const rows: Word[][] = [];

  for (const word of sorted) {
    let target: Word[] | undefined;

    for (const row of rows) {
      const rowY =
        row.reduce((sum, item) => sum + item.y, 0) /
        row.length;

      if (Math.abs(rowY - word.y) <= 8) {
        target = row;
        break;
      }
    }

    if (!target) {
      target = [];
      rows.push(target);
    }

    target.push(word);
  }

  rows.sort((a, b) => {
    const ay =
      a.reduce((sum, item) => sum + item.y, 0) /
      Math.max(a.length, 1);

    const by =
      b.reduce((sum, item) => sum + item.y, 0) /
      Math.max(b.length, 1);

    return by - ay;
  });

  /*
   * Convert each visual line into logical cells.
   *
   * We deliberately DO NOT create a column from every word.
   * Instead, a large horizontal gap is treated as a table
   * column separator.
   */
  const rowCells = rows.map((row) => {
    const ordered = [...row].sort(
      (a, b) => a.x - b.x,
    );

    if (ordered.length === 0) {
      return [];
    }

    const gaps: number[] = [];

    for (let i = 1; i < ordered.length; i++) {
      gaps.push(
        Math.max(
          0,
          ordered[i].x - ordered[i - 1].right,
        ),
      );
    }

    const positiveGaps = gaps.filter(
      (gap) => gap > 1,
    );

    const sortedGaps = [...positiveGaps].sort(
      (a, b) => a - b,
    );

    const medianGap =
      sortedGaps.length > 0
        ? sortedGaps[
            Math.floor(sortedGaps.length / 2)
          ]
        : 0;

    /*
     * Normal word spacing is usually much smaller
     * than the space between table columns.
     */
    const separatorThreshold = Math.max(
      18,
      medianGap * 2.8,
    );

    const cells: Word[][] = [[]];

    for (let i = 0; i < ordered.length; i++) {
      const word = ordered[i];

      if (i > 0) {
        const gap =
          ordered[i].x -
          ordered[i - 1].right;

        if (gap >= separatorThreshold) {
          cells.push([]);
        }
      }

      cells[cells.length - 1].push(word);
    }

    return cells;
  });

  /*
   * Determine the most common number of cells.
   * This prevents occasional OCR noise from changing
   * the number of Excel columns.
   */
  const counts = new Map<number, number>();

  for (const cells of rowCells) {
    if (cells.length > 0) {
      counts.set(
        cells.length,
        (counts.get(cells.length) || 0) + 1,
      );
    }
  }

  let targetColumnCount = 1;
  let targetFrequency = 0;

  for (const [count, frequency] of counts) {
    if (frequency > targetFrequency) {
      targetColumnCount = count;
      targetFrequency = frequency;
    }
  }

  /*
   * Do not allow an OCR outlier to create dozens of columns.
   */
  targetColumnCount = Math.max(
    1,
    Math.min(targetColumnCount, 20),
  );

  /*
   * Convert cells to strings.
   *
   * Arabic:
   *   keep characters exactly as Tesseract returned them.
   *   Only order separate words according to their physical
   *   RTL position.
   *
   * Numbers / Latin:
   *   keep normal LTR order.
   */
  const output = rowCells.map((cells) => {
    let normalized = cells.map((cell) => {
      if (cell.length === 0) {
        return "";
      }

      const text = cell
        .map((item) => item.text)
        .join(" ")
        .trim();

      const ar = arabicCount(text);
      const lat = latinCount(text);

      if (ar > 0 && ar >= lat) {
        return [...cell]
          .sort((a, b) => b.x - a.x)
          .map((item) => item.text)
          .join(" ")
          .trim();
      }

      return [...cell]
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(" ")
        .trim();
    });

    /*
     * If this row has too many cells because OCR detected
     * unusually large gaps, merge the closest cells until
     * the normal table width is restored.
     */
    while (
      normalized.length > targetColumnCount
    ) {
      let bestIndex = 0;
      let bestGap = Infinity;

      for (
        let i = 1;
        i < normalized.length;
        i++
      ) {
        const left = cells[i - 1];
        const right = cells[i];

        const leftRight =
          left[left.length - 1]?.right ?? 0;

        const rightLeft =
          right[0]?.x ?? 0;

        const gap =
          rightLeft - leftRight;

        if (gap < bestGap) {
          bestGap = gap;
          bestIndex = i;
        }
      }

      normalized[bestIndex - 1] = mergeCellText(
        normalized[bestIndex - 1],
        normalized[bestIndex],
      );

      normalized.splice(bestIndex, 1);
      cells.splice(bestIndex, 1);
    }

    /*
     * If this row has fewer cells, keep the missing
     * columns empty rather than shifting data incorrectly.
     */
    while (
      normalized.length < targetColumnCount
    ) {
      normalized.push("");
    }

    return normalized;
  });

  return output.filter((row) =>
    row.some((cell) => cell.trim()),
  );
}
  function isArabicTextCorrupted(items: PdfTextItem[]): boolean {
    // PDFumo: simple, robust corruption detection.
    // Strategy:
    //  1. Presentation Forms → corrupted.
    //  2. Very short Arabic fragments → corrupted (broken font).
    //  3. Arabic + Latin mix with weird ratios → corrupted.

    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

    const arabicItems = items.filter((it) =>
      arabicPattern.test(it.str),
    );

    // PDFumo: Some Arabic PDFs have a broken font mapping where
    // PDF.js returns Arabic glyphs as Latin/extended characters.
    // In that case arabicItems.length is 0, so the normal Arabic
    // checks cannot run. Detect the strong broken-font signature first.
    if (arabicItems.length === 0) {
      const noArabicText = items.map((it) => it.str).join(" ");

      const noArabicLatinExtended = (
        noArabicText.match(
          /[ÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßêëìíîïðñòóôõö÷øùúûüýþÿ]/g,
        ) || []
      ).length;

      const noArabicLikeLatin = (
        noArabicText.match(
          /[.^,]{0,2}[A-Za-z]{2,}[.^,]{0,2}/g,
        ) || []
      ).length;

      const noArabicBrokenWords = items.filter((it) => {
        const value = it.str;
        if (value.length < 2) return false;

        const punctCount =
          (value.match(/[.,^'`~]/g) || []).length;

        const latinCount =
          (value.match(/[A-Za-z]/g) || []).length;

        return (
          punctCount >= 1 &&
          latinCount >= 1 &&
          value.length <= 10
        );
      }).length;

      const noArabicLatinItems = items.filter((it) =>
        /[A-Za-z]{3,}/.test(it.str),
      ).length;

      if (
        (
          noArabicLatinExtended >= 5 &&
          noArabicBrokenWords >= 5
        ) ||
        (
          noArabicBrokenWords >= 12 &&
          noArabicLatinItems >= 10
        ) ||
        (
          noArabicLikeLatin >= 20 &&
          noArabicLatinItems >= 10
        )
      ) {
        return true;
      }

      return false;
    }

    // Check 1: Presentation Forms (already normalized away
    // by normalizeArabicPresentation, but if any remain, corrupt).
    const rawText = items.map((it) => it.str).join(" ");
    const presentationForms =
      (rawText.match(/[\uFB50-\uFDFF\uFE70-\uFEFF]/g) || [])
        .length;
    if (presentationForms / Math.max(rawText.length, 1) > 0.03) {
      return true;
    }

    // Check 2: average Arabic item length < 4 → fragmented.
    const avgLength =
      arabicItems.reduce((sum, it) => sum + it.str.length, 0) /
      arabicItems.length;

    if (arabicItems.length >= 5 && avgLength < 4) {
      return true;
    }

    // Check 3: Arabic characters per item very low → glyphs.
    const charCount = arabicItems.reduce(
      (sum, it) =>
        sum +
        (it.str.match(new RegExp(arabicPattern, "g")) || []).length,
      0,
    );
    if (arabicItems.length >= 8 && charCount / arabicItems.length < 3) {
      return true;
    }

    // PDFumo: CHECK 4 — Force OCR when there is a lot of
    // Arabic text. Many Arabic PDFs store text in visual
    // (reversed) order with missing glyphs; OCR is the only
    // reliable way to read them.
    if (arabicItems.length >= 10) {
      return true;
    }

    // PDFumo: CHECK 5 — Suspicious Latin/Extended chars.
    // Arabic PDFs with broken WinAnsi/Identity-H fonts often
    // produce Latin Extended chars (Ê, Ë, Ì) and weird
    // patterns like "r-Jllr", "ililrl", "J^rrlJl".
    // Detect their presence.
    const allText = items.map((it) => it.str).join(" ");

    // 5a: Latin Extended chars (accented/corrupted)
    const latinExtended =
      (allText.match(/[ÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßêëìíîïðñòóôõö÷øùúûüýþÿ]/g) || [])
        .length;

    // 5b: Arabic-like Latin patterns — 3+ chars of Latin
    // mixed with ^, ., ', `, or standalone .Jl-like fragments.
    // Count occurrences of ",.J", ".Jl", "J^", "ilL", "il!", etc.
    const arabicLikeLatin =
      (allText.match(/[.^,]{0,2}[A-Za-z]{2,}[.^,]{0,2}/g) || []).length;

    // 5c: Ratio of punctuation-heavy "words" — broken fonts
    // often produce items with dots, commas, and Latin together.
    const brokenWordCount = items.filter((it) => {
      const s = it.str;
      if (s.length < 2) return false;
      const punctCount = (s.match(/[.,^'`~]/g) || []).length;
      const latinCount = (s.match(/[A-Za-z]/g) || []).length;
      return punctCount >= 1 && latinCount >= 1 && s.length <= 10;
    }).length;

    if (
      latinExtended / Math.max(allText.length, 1) > 0.03 ||
      brokenWordCount >= 5
    ) {
      return true;
    }

    // PDFumo: CHECK 6 — Page contains lots of Latin items
    // with weird shapes (like "ililrl", "J^rrlJl") but very
    // few Arabic chars. This is a strong sign of broken font.
    const latinItems = items.filter((it) =>
      /[A-Za-z]{3,}/.test(it.str),
    );
    if (
      latinItems.length >= 15 &&
      arabicItems.length <= 5
    ) {
      return true;
    }

    return false;
  }

  function normalizeArabicWord(input: string): string {
    return input
      .replace(/\u200f|\u200e/g, "")   // RTL/LTR marks
      .replace(/\u00a0/g, " ")          // NBSP
      .replace(/\s+/g, " ")             // collapse spaces
      .trim();
  }

  async function extractPageWithOCR(
    page: pdfjsLib.PDFPageProxy,
    worker: Awaited<ReturnType<typeof createWorker>>,
  ): Promise<PdfTextItem[]> {
    const scale = 3; // PDFumo: balanced accuracy/speed // TEMP: reverted for speed test

    const viewport = page.getViewport({
      scale,
    });

    const paddlePageSizeDebug = {
      pageWidth: page.view[2] - page.view[0],
      pageHeight: page.view[3] - page.view[1],
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      scale,
    };

    console.log(
      "[PDFumo PaddleOCR PAGE SIZE]",
      JSON.stringify(paddlePageSizeDebug),
    );

    setRawExtractionDebug((current) => [
      ...current,
      "",
      "===== PADDLEOCR PAGE SIZE =====",
      JSON.stringify(paddlePageSizeDebug),
    ]);

    const canvas = document.createElement("canvas");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      throw new Error("Unable to create OCR canvas.");
    }

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    const image = canvas.toDataURL("image/png");

    const result = await worker.recognize(
      image,
      {
        // PDFumo: Tesseract parameters belong in the
        // second argument in Tesseract.js v7.
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: "4",
        user_defined_dpi: "300",
      } as Record<string, string>,
      {
        blocks: true,
        text: true,
      },
    );

    const items: PdfTextItem[] = [];

    for (const block of result.data.blocks || []) {
      for (const paragraph of block.paragraphs || []) {
        for (const line of paragraph.lines || []) {
          for (const word of line.words || []) {
            const text = normalizeArabicWord(word.text ?? "");
            const box = word.bbox;

            if (!text || !box) {
              continue;
            }

            const x = box.x0 / scale;

            /*
             * PDF coordinates normally start at the bottom,
             * while OCR image coordinates start at the top.
             */
            // PDFumo: use canvas.height (scaled), not viewport.height
            const y =
              (canvas.height - box.y1) / scale;

            const width =
              (box.x1 - box.x0) / scale;

            items.push({
              str: text,
              transform: [
                1,
                0,
                0,
                1,
                x,
                y,
              ],
              width,
            });
          }
        }
      }
    }

    // PDFumo: normalize + merge Arabic letters
    const normalized = items.map((it) => ({
      ...it,
      str: normalizeArabicPresentation(it.str),
    }));

    // PDFumo: OCR already returns logical word order.
    // Do NOT run mergeArabicLetters() here because it reverses Arabic.
    return normalized.filter(
      (it) => it.str.trim().length > 0,
    );
  }


  // ============================================================
  // PDFumo PaddleOCR Arabic table engine
  // Uses the same custom Arabic model that was verified
  // successfully in ~/paddleocr-browser-test.
  // ============================================================

  type PdfumoPaddleItem = {
    text: string;
    score: number;
    poly: number[][];
  };

  type PdfumoPaddleResult = {
    items?: PdfumoPaddleItem[];
  };

  type PdfumoPaddleEngine = {
    predict(
      input: HTMLCanvasElement,
      options?: Record<string, unknown>,
    ): Promise<PdfumoPaddleResult[]>;
  };

  let pdfumoPaddleOCR: PdfumoPaddleEngine | null = null;

  async function getPdfumoPaddleOCR(): Promise<PdfumoPaddleEngine> {
    if (pdfumoPaddleOCR) {
      return pdfumoPaddleOCR;
    }

    console.log("[PDFumo PaddleOCR] Loading engine...");

    const paddleModule = await import("@paddleocr/paddleocr-js");

    pdfumoPaddleOCR = await paddleModule.PaddleOCR.create({
      textDetectionModelName: "PP-OCRv5_mobile_det",

      textDetectionModelAsset: {
        url: "/models/PP-OCRv5_mobile_det_onnx_infer.tar",
      },

      textRecognitionModelName:
        "arabic_PP-OCRv5_mobile_rec",

      textRecognitionModelAsset: {
        url:
          "/models/arabic_PP-OCRv5_mobile_rec_onnx_infer.tar",
      },

      ortOptions: {
        backend: "wasm",
      },
    });

    console.log("[PDFumo PaddleOCR] Engine ready.");

    return pdfumoPaddleOCR;
  }

  
/**
 * PDFumo hybrid merge:
 * PaddleOCR is used for Arabic names.
 * Native PDF geometry is authoritative for:
 *   - candidate number
 *   - masked ID/code
 *
 * Paddle rows are already ordered visually. We therefore replace only
 * the reliable numeric/code columns with the native PDF values.
 */
function mergePaddleRowsWithNativeGeometry(
  paddleRowsWithGeometry: PdfumoPaddleTableRow[],
  nativeItems: PdfTextItem[],
  pageHeight: number,
): string[][] {
  const nativeCandidates = nativeItems
    .filter((item) => item.str.trim())
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
    }))
    .filter(
      (item) =>
        item.x >= 400 &&
        item.x < 520 &&
        /^\d{1,4}$/.test(item.text),
    )
    .sort((a, b) => b.y - a.y);

  const nativeCodes = nativeItems
    .filter((item) => item.str.trim())
    .map((item) => ({
      text: item.str.trim(),
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
    }))
    .filter(
      (item) =>
        item.x < 200 &&
        /[A-Za-z]/.test(item.text) &&
        /\d/.test(item.text),
    )
    .sort((a, b) => b.y - a.y);

  console.log("[PDFumo HYBRID MERGE]", {
    paddleRows: paddleRowsWithGeometry.length,
    nativeCandidates: nativeCandidates.length,
    nativeCodes: nativeCodes.length,
  });

  if (
    !paddleRowsWithGeometry.length ||
    !nativeCandidates.length ||
    !nativeCodes.length
  ) {
    console.log(
      "[PDFumo HYBRID MERGE] skipped - insufficient matches",
    );

    return paddleRowsWithGeometry.map(
      (entry) => [...entry.row],
    );
  }

  /*
   * PaddleOCR poly coordinates are measured from the top of the
   * cropped table canvas.
   *
   * Native PDF coordinates are measured from the bottom of the
   * PDF page.
   *
   * Current verified crop:
   *   tableY = 300
   *   tableHeight = 550
   *   scale = 4
   *
   * Therefore:
   *
   *   nativeY = 300 + (550 - paddleY / 4)
   */
  const TABLE_X = 50;
  const TABLE_Y = 300;
  const SCALE = 4;

  void TABLE_X;

  /*
   * PaddleOCR Y is measured in pixels from the TOP of the
   * cropped table canvas.
   *
   * Native PDF Y is measured from the BOTTOM of the PDF page.
   *
   * Therefore:
   *
   *   distanceFromPdfTop = TABLE_Y + paddleY / SCALE
   *   nativeY = pageHeight - distanceFromPdfTop
   */
  const paddleYToNativeY = (paddleY: number): number =>
    pageHeight -
    (TABLE_Y + paddleY / SCALE);

  const merged = paddleRowsWithGeometry.map(
    (entry) => [...entry.row],
  );

  const usedCandidateIndexes = new Set<number>();
  const usedCodeIndexes = new Set<number>();

  const MAX_Y_DISTANCE = 6;

  let candidateMatches = 0;
  let codeMatches = 0;
  let bothMatches = 0;
  let maxCandidateDistance = 0;
  let maxCodeDistance = 0;

  for (
    let rowIndex = 0;
    rowIndex < paddleRowsWithGeometry.length;
    rowIndex += 1
  ) {
    const paddleEntry = paddleRowsWithGeometry[rowIndex];
    const row = merged[rowIndex];

    const candidate = String(row?.[3] ?? "").trim();
    const code = String(row?.[0] ?? "").trim();

    /*
     * Only candidate-table rows are eligible for native geometry
     * replacement. Header/footer OCR rows remain untouched.
     */
    const looksLikeCandidateRow =
      /^\d{1,4}$/.test(candidate) ||
      (/^[A-Za-z]/.test(code) &&
        /\d/.test(code));

    if (!looksLikeCandidateRow) {
      continue;
    }

    const nativeY = paddleYToNativeY(
      paddleEntry.y,
    );

    let bestCandidateIndex = -1;
    let bestCandidateDistance = Infinity;

    for (
      let i = 0;
      i < nativeCandidates.length;
      i += 1
    ) {
      if (usedCandidateIndexes.has(i)) {
        continue;
      }

      const distance = Math.abs(
        nativeCandidates[i].y - nativeY,
      );

      if (distance < bestCandidateDistance) {
        bestCandidateDistance = distance;
        bestCandidateIndex = i;
      }
    }

    let bestCodeIndex = -1;
    let bestCodeDistance = Infinity;

    for (
      let i = 0;
      i < nativeCodes.length;
      i += 1
    ) {
      if (usedCodeIndexes.has(i)) {
        continue;
      }

      const distance = Math.abs(
        nativeCodes[i].y - nativeY,
      );

      if (distance < bestCodeDistance) {
        bestCodeDistance = distance;
        bestCodeIndex = i;
      }
    }

    const matchedCandidate =
      bestCandidateIndex >= 0 &&
      bestCandidateDistance <= MAX_Y_DISTANCE;

    const matchedCode =
      bestCodeIndex >= 0 &&
      bestCodeDistance <= MAX_Y_DISTANCE;

    if (matchedCandidate) {
      row[3] =
        nativeCandidates[bestCandidateIndex].text;

      usedCandidateIndexes.add(bestCandidateIndex);
      candidateMatches += 1;
      maxCandidateDistance = Math.max(
        maxCandidateDistance,
        bestCandidateDistance,
      );
    }

    if (matchedCode) {
      row[0] =
        nativeCodes[bestCodeIndex].text;

      usedCodeIndexes.add(bestCodeIndex);
      codeMatches += 1;
      maxCodeDistance = Math.max(
        maxCodeDistance,
        bestCodeDistance,
      );
    }

    if (matchedCandidate && matchedCode) {
      bothMatches += 1;
    }

    if (matchedCandidate || matchedCode) {
      console.log(
        "[PDFumo HYBRID Y MATCH]",
        JSON.stringify({
          rowIndex: rowIndex + 1,
          paddleY: Number(
            paddleEntry.y.toFixed(2),
          ),
          nativeY: Number(
            nativeY.toFixed(2),
          ),
          candidate:
            matchedCandidate
              ? nativeCandidates[
                  bestCandidateIndex
                ].text
              : null,
          candidateDistance:
            matchedCandidate
              ? Number(
                  bestCandidateDistance.toFixed(2),
                )
              : null,
          code:
            matchedCode
              ? nativeCodes[bestCodeIndex].text
              : null,
          codeDistance:
            matchedCode
              ? Number(
                  bestCodeDistance.toFixed(2),
                )
              : null,
        }),
      );
    }
  }

  console.log(
    "[PDFumo HYBRID MERGE] Y-coordinate result",
    JSON.stringify({
      paddleRows:
        paddleRowsWithGeometry.length,
      candidateMatches,
      codeMatches,
      bothMatches,
      maxCandidateDistance:
        Number(maxCandidateDistance.toFixed(2)),
      maxCodeDistance:
        Number(maxCodeDistance.toFixed(2)),
    }),
  );

  return merged;
}

type PdfumoPaddleTableRow = {
    y: number;
    row: string[];
  };

  function buildPaddleTableRowsWithGeometry(
    items: PdfumoPaddleItem[],
  ): PdfumoPaddleTableRow[] | null {
    if (!items.length) {
      return null;
    }

    type Word = {
      text: string;
      score: number;
      x: number;
      y: number;
    };

    type Row = {
      y: number;
      words: Word[];
    };

    const words: Word[] = items
      .map((item) => {
        const points = Array.isArray(item.poly)
          ? item.poly
          : [];

        const xs = points
          .map((point) => Number(point?.[0]))
          .filter((value) => Number.isFinite(value));

        const ys = points
          .map((point) => Number(point?.[1]))
          .filter((value) => Number.isFinite(value));

        const x = xs.length
          ? xs.reduce((sum, value) => sum + value, 0) /
            xs.length
          : 0;

        const y = ys.length
          ? ys.reduce((sum, value) => sum + value, 0) /
            ys.length
          : 0;

        return {
          text: String(item.text || "").trim(),
          score: Number.isFinite(item.score)
            ? item.score
            : 0,
          x,
          y,
        };
      })
      .filter((word) => word.text.length > 0)
      .filter(
        (word) =>
          !/^Page\\s+\\d+\\s+de\\s+\\d+$/i.test(word.text),
      );

    if (words.length < 20) {
      return null;
    }

    const sortedWords = [...words].sort(
      (a, b) => a.y - b.y,
    );

    const rows: Row[] = [];
    const OCR_ROW_GAP = 28;

    for (const word of sortedWords) {
      const last = rows[rows.length - 1];

      if (
        last &&
        Math.abs(word.y - last.y) <= OCR_ROW_GAP
      ) {
        last.words.push(word);

        last.y =
          last.words.reduce(
            (sum, item) => sum + item.y,
            0,
          ) / last.words.length;
      } else {
        rows.push({
          y: word.y,
          words: [word],
        });
      }
    }

    if (rows.length < 5) {
      return null;
    }

    const sortedX = [...words]
      .map((word) => word.x)
      .sort((a, b) => a - b);

    if (sortedX.length < 4) {
      return null;
    }

    let centers = [
      sortedX[Math.floor(sortedX.length * 0.125)],
      sortedX[Math.floor(sortedX.length * 0.375)],
      sortedX[Math.floor(sortedX.length * 0.625)],
      sortedX[Math.floor(sortedX.length * 0.875)],
    ];

    for (let iteration = 0; iteration < 30; iteration += 1) {
      const groups: number[][] = [
        [],
        [],
        [],
        [],
      ];

      for (const value of words.map((word) => word.x)) {
        let best = 0;
        let bestDistance = Math.abs(
          value - centers[0],
        );

        for (let i = 1; i < 4; i += 1) {
          const distance = Math.abs(
            value - centers[i],
          );

          if (distance < bestDistance) {
            best = i;
            bestDistance = distance;
          }
        }

        groups[best].push(value);
      }

      const next = groups.map(
        (group, i) =>
          group.length
            ? group.reduce(
                (sum, value) => sum + value,
                0,
              ) / group.length
            : centers[i],
      );

      next.sort((a, b) => a - b);

      const changed = next.some(
        (value, i) =>
          Math.abs(value - centers[i]) > 0.5,
      );

      centers = next;

      if (!changed) {
        break;
      }
    }

    function nearestColumn(x: number): number {
      let best = 0;
      let bestDistance = Math.abs(
        x - centers[0],
      );

      for (let i = 1; i < 4; i += 1) {
        const distance = Math.abs(
          x - centers[i],
        );

        if (distance < bestDistance) {
          best = i;
          bestDistance = distance;
        }
      }

      return best;
    }

    function normalizePaddleArabic(text: string): string {
      return text.trim();
    }

    const output: PdfumoPaddleTableRow[] = [];

    for (const row of rows) {
      const columns = ["", "", "", ""];

      for (const word of [...row.words].sort(
        (a, b) => a.x - b.x,
      )) {
        const column = nearestColumn(word.x);
        const normalized = normalizePaddleArabic(
          word.text,
        );

        if (!normalized) {
          continue;
        }

        columns[column] = columns[column]
          ? `${columns[column]} ${normalized}`
          : normalized;
      }

      if (columns.some((value) => value.trim())) {
        output.push({
          y: row.y,
          row: columns,
        });
      }
    }

    console.log(
      "[PDFumo PaddleOCR TABLE GEOMETRY]",
      JSON.stringify({
        words: words.length,
        rows: output.length,
        columnCenters: centers.map((x) =>
          Number(x.toFixed(1)),
        ),
        sample: output.slice(0, 5),
      }),
    );

    return output.length ? output : null;
  }

  function buildRowsFromPdfumoPaddleOCR(
    items: PdfumoPaddleItem[],
  ): string[][] | null {
    if (!items.length) {
      return null;
    }

    type Word = {
      text: string;
      score: number;
      x: number;
      y: number;
    };

    type Row = {
      y: number;
      words: Word[];
    };

    const words: Word[] = items
      .map((item) => {
        const points = Array.isArray(item.poly)
          ? item.poly
          : [];

        const xs = points
          .map((point) => Number(point?.[0]))
          .filter((value) => Number.isFinite(value));

        const ys = points
          .map((point) => Number(point?.[1]))
          .filter((value) => Number.isFinite(value));

        const x = xs.length
          ? xs.reduce((sum, value) => sum + value, 0) /
            xs.length
          : 0;

        const y = ys.length
          ? ys.reduce((sum, value) => sum + value, 0) /
            ys.length
          : 0;

        return {
          text: String(item.text || "").trim(),
          score: Number.isFinite(item.score)
            ? item.score
            : 0,
          x,
          y,
        };
      })
      .filter((word) => word.text.length > 0)
      .filter(
        (word) =>
          !/^Page\s+\d+\s+de\s+\d+$/i.test(word.text),
      );

    if (words.length < 20) {
      return null;
    }

    // Group using PaddleOCR Y coordinates only.
    const sortedWords = [...words].sort(
      (a, b) => a.y - b.y,
    );

    const rows: Row[] = [];
    const OCR_ROW_GAP = 28;

    for (const word of sortedWords) {
      const last = rows[rows.length - 1];

      if (
        last &&
        Math.abs(word.y - last.y) <= OCR_ROW_GAP
      ) {
        last.words.push(word);

        last.y =
          last.words.reduce(
            (sum, item) => sum + item.y,
            0,
          ) / last.words.length;
      } else {
        rows.push({
          y: word.y,
          words: [word],
        });
      }
    }

    if (rows.length < 5) {
      return null;
    }

    // 1D k-means: detect the four physical columns.
    const sortedX = [...words]
      .map((word) => word.x)
      .sort((a, b) => a - b);

    if (sortedX.length < 4) {
      return null;
    }

    let centers = [
      sortedX[Math.floor(sortedX.length * 0.125)],
      sortedX[Math.floor(sortedX.length * 0.375)],
      sortedX[Math.floor(sortedX.length * 0.625)],
      sortedX[Math.floor(sortedX.length * 0.875)],
    ];

    for (let iteration = 0; iteration < 30; iteration += 1) {
      const groups: number[][] = [
        [],
        [],
        [],
        [],
      ];

      for (const value of words.map((word) => word.x)) {
        let best = 0;
        let bestDistance = Math.abs(
          value - centers[0],
        );

        for (let i = 1; i < 4; i += 1) {
          const distance = Math.abs(
            value - centers[i],
          );

          if (distance < bestDistance) {
            best = i;
            bestDistance = distance;
          }
        }

        groups[best].push(value);
      }

      const next = groups.map(
        (group, i) =>
          group.length
            ? group.reduce(
                (sum, value) => sum + value,
                0,
              ) / group.length
            : centers[i],
      );

      next.sort((a, b) => a - b);

      const changed = next.some(
        (value, i) =>
          Math.abs(value - centers[i]) > 0.5,
      );

      centers = next;

      if (!changed) {
        break;
      }
    }

    function nearestColumn(x: number): number {
      let best = 0;
      let bestDistance = Math.abs(
        x - centers[0],
      );

      for (let i = 1; i < 4; i += 1) {
        const distance = Math.abs(
          x - centers[i],
        );

        if (distance < bestDistance) {
          best = i;
          bestDistance = distance;
        }
      }

      return best;
    }

    function normalizePaddleArabic(text: string): string {
      // PaddleOCR returns Arabic text in logical reading order.
      // Do NOT reverse Arabic characters/clusters here.
      return text.trim();
    }

    const output: string[][] = [];

    for (const row of rows) {
      const columns = ["", "", "", ""];

      for (const word of [...row.words].sort(
        (a, b) => a.x - b.x,
      )) {
        const column = nearestColumn(word.x);
        const normalized = normalizePaddleArabic(
          word.text,
        );

        if (!normalized) {
          continue;
        }

        columns[column] = columns[column]
          ? `${columns[column]} ${normalized}`
          : normalized;
      }

      if (columns.some((value) => value.trim())) {
        output.push(columns);
      }
    }

    console.log(
      "[PDFumo PaddleOCR TABLE]",
      JSON.stringify({
        words: words.length,
        rows: output.length,
        columnCenters: centers.map((x) =>
          Number(x.toFixed(1)),
        ),
        sample: output.slice(0, 5),
      }),
    );

    return output.length ? output : null;
  }


  async function extractPageWithPaddleOCR(
    page: pdfjsLib.PDFPageProxy,
  ): Promise<{
    rows: string[][];
    rowsWithGeometry: PdfumoPaddleTableRow[];
  } | null> {
    console.log("[PDFumo PaddleOCR] Rendering page...");

    // Must match the verified PaddleOCR prototype.
    const scale = 4;

    const viewport = page.getViewport({
      scale,
    });

    const canvas = document.createElement("canvas");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      throw new Error(
        "Unable to create PaddleOCR canvas.",
      );
    }

    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    /*
     * The successful prototype used this fixed table crop.
     *
     * These coordinates are in the PDF/page coordinate
     * system BEFORE the scale multiplication.
     */
    const tableX = 50;
    const tableY = 300;
    const tableWidth = 500;
    const tableHeight = 550;

    const tableCanvas = document.createElement("canvas");

    tableCanvas.width =
      Math.ceil(tableWidth * scale);

    tableCanvas.height =
      Math.ceil(tableHeight * scale);

    const tableContext =
      tableCanvas.getContext("2d", {
        willReadFrequently: true,
      });

    if (!tableContext) {
      throw new Error(
        "Unable to create PaddleOCR table canvas.",
      );
    }

    tableContext.drawImage(
      canvas,
      tableX * scale,
      tableY * scale,
      tableWidth * scale,
      tableHeight * scale,
      0,
      0,
      tableCanvas.width,
      tableCanvas.height,
    );

    console.log(
      "[PDFumo PaddleOCR] Table crop:",
      tableCanvas.width,
      "x",
      tableCanvas.height,
    );

    const ocr =
      await getPdfumoPaddleOCR();

    const start = performance.now();

    const results = await ocr.predict(
      tableCanvas,
      {
        textDetLimitSideLen: 1280,
        textDetLimitType: "max",
        textRecScoreThresh: 0.2,
      },
    );

    const elapsed =
      performance.now() - start;

    const result = results[0];

    console.log(
      "[PDFumo ARABIC TEST]",
      JSON.stringify({
        a: reverseArabicWords("يلاغ"),
        b: reverseArabicWords("سايلإ"),
        c: reverseArabicWords("يعاشخ"),
        d: normalizeArabicPresentation("يلاغ"),
      }),
    );

    console.log(
      "[PDFumo ARABIC TEST]",
      JSON.stringify({
        a: reverseArabicWords("يلاغ"),
        b: reverseArabicWords("سايلإ"),
        c: reverseArabicWords("يعاشخ"),
        d: normalizeArabicPresentation("يلاغ"),
      }),
    );

    const items: PdfumoPaddleItem[] =
      Array.isArray(result?.items)
        ? result.items.map((item) => ({
            ...item,
            text: reverseArabicWords(
              normalizeArabicPresentation(item.text),
            ),
          }))
        : [];

    console.log(
      "[PDFumo PaddleOCR ITEMS]",
      JSON.stringify(
        items.slice(0, 30).map((item) => ({
          text: item.text,
          score: item.score,
          poly: item.poly,
        })),
      ),
    );

    const paddleResultDebug = {
      elapsedMs: Math.round(elapsed),
      results: results.length,
      items: items.length,
      sample: items.slice(0, 12).map((item) => ({
        text: item.text,
        score: item.score,
        poly: item.poly,
      })),
    };

    console.log(
      "[PDFumo PaddleOCR] Result:",
      JSON.stringify(paddleResultDebug),
    );

    setRawExtractionDebug((current) => [
      ...current,
      "",
      "===== PADDLEOCR RESULT =====",
      JSON.stringify(paddleResultDebug),
    ]);

    const rowsWithGeometry =
      buildPaddleTableRowsWithGeometry(items);

    if (!rowsWithGeometry) {
      console.log(
        "[PDFumo PaddleOCR] Table reconstruction failed.",
      );

      return null;
    }

    const rows =
      rowsWithGeometry.map((entry) => entry.row);

    console.log(
      "[PDFumo PaddleOCR ROWS SAMPLE]",
      JSON.stringify(rows.slice(0, 10)),
    );

    console.log(
      "[PDFumo PaddleOCR ROWS GEOMETRY SAMPLE]",
      JSON.stringify(rowsWithGeometry.slice(0, 10)),
    );

    setRawExtractionDebug((current) => [
      ...current,
      "",
      "===== PADDLEOCR ROWS =====",
      ...rows.slice(0, 10).map(
        (row, index) =>
          `ROW ${index + 1}: ${JSON.stringify(row)}`,
      ),
    ]);

    console.log(
      "[PDFumo PaddleOCR] Table reconstruction succeeded:",
      rows.length,
      "rows",
    );

    return {
      rows,
      rowsWithGeometry,
    };
  }

  async function convertToExcel() {
    if (!pdf) {
      setError("Please select a PDF file first.");
      return;
    }

    setProcessing(true);
    setError("");
    clearResult();
    setProgress("Loading PDF...");

    let ocrWorker:
      | Awaited<ReturnType<typeof createWorker>>
      | null = null;
  let ocrWorkerLang: string | null = null;

    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "/pdfjs/pdf.worker.min.mjs";

      console.log("[PDFumo DEBUG] Reading file...");
      setProgress("Reading PDF file...");

      const bytes = new Uint8Array(
        await pdf.file.arrayBuffer(),
      );

      console.log(
        "[PDFumo DEBUG] File read:",
        bytes.length,
        "bytes"
      );

      setProgress("Starting PDF.js...");

      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
      });

      console.log("[PDFumo DEBUG] getDocument started");

      loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
        console.log(
          "[PDFumo DEBUG] PDF.js progress:",
          progress.loaded,
          "/",
          progress.total
        );
      };

      console.log("[PDFumo DEBUG] Waiting for PDF.js...");
      const documentPdf = await loadingTask.promise;

      console.log(
        "[PDFumo DEBUG] PDF.js ready:",
        documentPdf.numPages,
        "pages"
      );

      setPdf((current) =>
        current
          ? {
              ...current,
              pages: documentPdf.numPages,
            }
          : current,
      );

      const workbook = XLSX.utils.book_new();

      for (
        let pageNumber = 1;
        pageNumber <= documentPdf.numPages;
        pageNumber++
      ) {
        setProgress(
          `Extracting page ${pageNumber} of ${documentPdf.numPages}...`,
        );

        const page = await documentPdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

      const rawTextItems = textContent.items.filter(
        (item): item is import("pdfjs-dist/types/src/display/api").TextItem =>
          "str" in item,
      );

      if (pageNumber === 2) {
        const page2Geometry = rawTextItems
          .filter((item) => {
            const text = item.str?.trim() ?? "";
            const x = item.transform?.[4] ?? 0;
            const y = item.transform?.[5] ?? 0;

            return (
              y <= 820 &&
              y >= 20 &&
              x >= 50 &&
              x <= 550 &&
              (/[\\u0600-\\u06FF]/.test(text) || /\\d/.test(text))
            );
          })
          .map(
            (item, index) =>
              `PAGE2[${index}]: TEXT=${JSON.stringify(item.str)} | X=${(item.transform?.[4] ?? 0).toFixed(2)} | Y=${(item.transform?.[5] ?? 0).toFixed(2)} | W=${(item.width ?? 0).toFixed(2)}`,
          );

        setRawExtractionDebug([
          "===== PAGE 2 NATIVE GEOMETRY =====",
          `Page: ${pageNumber}`,
          `Total native items: ${rawTextItems.length}`,
          `Page 2 filtered items: ${page2Geometry.length}`,
          ...page2Geometry,
        ]);
      }


      if (pageNumber === 1) {
        const geometryDebug = rawTextItems
          .filter((item) => {
            const text = item.str?.trim() ?? "";
            const x = item.transform?.[4] ?? 0;
            const y = item.transform?.[5] ?? 0;

            const hasArabic = /[\\u0600-\\u06FF]/.test(text);
            const hasNumber = /\\d/.test(text);

            // Focus on the table area rather than the page header.
            return (
              y <= 780 &&
              y >= 40 &&
              (hasArabic || hasNumber) &&
              x >= 80 &&
              x <= 520
            );
          })
          .map(
            (item, index) =>
              `TABLE[${index}]: TEXT=${JSON.stringify(item.str)} | X=${(item.transform?.[4] ?? 0).toFixed(2)} | Y=${(item.transform?.[5] ?? 0).toFixed(2)} | W=${(item.width ?? 0).toFixed(2)}`,
          );

        setRawExtractionDebug([
          "===== NATIVE TABLE GEOMETRY =====",
          `Page: ${pageNumber}`,
          `Total native items: ${rawTextItems.length}`,
          `Table-area items: ${geometryDebug.length}`,
          ...geometryDebug,
        ]);
      }


        let items: PdfTextItem[] = textContent.items
          .filter(
            (
              item,
            ): item is typeof item & {
              str: string;
              transform: number[];
              width?: number;
            } =>
              "str" in item &&
              "transform" in item &&
              Array.isArray(item.transform),
          )
          .map((item) => ({
            str: item.str,
            transform: item.transform,
            width: item.width,
          }));

        // PDFumo: normalize Arabic Presentation Forms
        // BEFORE the corruption check and BEFORE OCR.
        items = items.map((it) => ({
          ...it,
          str: normalizeArabicPresentation(it.str),
        }));

        // PDFumo: merge split Arabic letters from raw PDF text
        // (PDF often stores Arabic as separate glyphs).
        items = mergeArabicLetters(items);

        // PDFumo V8 Hybrid:
        // Preserve the native PDF text before OCR replaces `items`.
        // This is especially important for masked ID/CNI codes,
        // which native extraction reads more reliably than OCR.
        const nativeItemsForHybrid = [...items];

        // PDFumo: if PDF.js extracts no text at all,
        // the page still needs OCR.
        //
        // Some pages in this Arabic PDF expose only the footer
        // ("Page X de 105") through the native text layer.
        // Treat very low native text as incomplete extraction
        // and force OCR so the actual table content is recovered.
        const hasVeryLittleNativeText = items.length <= 6;

        const needsOCR =
          items.length === 0 ||
          hasVeryLittleNativeText ||
          isArabicTextCorrupted(items);

        // PDFumo: HARD OCR RULE
        // Pages containing only a footer such as
        // "Page X de 105" are not real text extraction.
        // Force OCR unconditionally for these pages.
        const forceOCRForLowText = items.length <= 6;

        const finalNeedsOCR =
          needsOCR || forceOCRForLowText;

        console.log(
          "[PDFumo OCR DECISION FINAL]",
          JSON.stringify({
            page: pageNumber,
            nativeItems: items.length,
            hasVeryLittleNativeText,
            needsOCR,
            forceOCRForLowText,
            finalNeedsOCR,
          }),
        );

        if (pageNumber === 1 || hasVeryLittleNativeText) {
          const pageHasArabicDebug = items.some(
            (item) => /[\u0600-\u06FF]/.test(item.str),
          );

          const debugText = items.map((item) => item.str).join(" ");

          const debugLatinExtended = (
            debugText.match(/[ÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßêëìíîïðñòóôõö÷øùúûüýþÿ]/g) || []
          ).length;

          const debugArabicLikeLatin = (
            debugText.match(/[.^,]{0,2}[A-Za-z]{2,}[.^,]{0,2}/g) || []
          ).length;

          const debugBrokenWordCount = items.filter((item) => {
            const value = item.str;
            if (value.length < 2) return false;
            const punctCount = (value.match(/[.,^'`~]/g) || []).length;
            const latinCount = (value.match(/[A-Za-z]/g) || []).length;
            return punctCount >= 1 && latinCount >= 1 && value.length <= 10;
          }).length;

          const debugLatinItems = items.filter((item) =>
            /[A-Za-z]{3,}/.test(item.str),
          ).length;

          setRawExtractionDebug((current) => [
            ...current,
            "",
            "===== OCR DECISION DEBUG =====",
            `Page: ${pageNumber}`,
            `Native items: ${items.length}`,
            `needsOCR: ${needsOCR}`,
            `forceOCRForLowText: ${forceOCRForLowText}`,
            `finalNeedsOCR: ${finalNeedsOCR}`,
            `pageHasArabic: ${pageHasArabicDebug}`,
            `Arabic items: ${items.filter((item) =>
              /[\u0600-\u06FF]/.test(item.str),
            ).length}`,
            `Latin Extended count: ${debugLatinExtended}`,
            `Arabic-like Latin count: ${debugArabicLikeLatin}`,
            `Broken word count: ${debugBrokenWordCount}`,
            `Latin items: ${debugLatinItems}`,
          ]);
        }

        console.log(
          "[PDFumo OCR FLOW BEFORE]",
          JSON.stringify({
            page: pageNumber,
            nativeItems: items.length,
            hasVeryLittleNativeText,
            needsOCR,
          }),
        );

        // ============================================================
        // PDFumo NATIVE-FIRST TABLE PATH
        //
        // This Arabic PDF has broken native Arabic glyph mappings,
        // but its PDF geometry and numeric columns remain usable.
        // Try reconstructing the tested four-column table directly
        // from native PDF items before starting any OCR engine.
        //
        // OCR remains the fallback when native reconstruction fails.
        // ============================================================

        let nativeRowsForPage: string[][] | null = null;

        if (!hasVeryLittleNativeText) {
          try {
            nativeRowsForPage =
              buildRowsOCRTableIfDetected(
                nativeItemsForHybrid,
                nativeItemsForHybrid,
              );

            console.log(
              "[PDFumo NATIVE TABLE FIRST]",
              JSON.stringify({
                page: pageNumber,
                nativeItems: nativeItemsForHybrid.length,
                detected: !!nativeRowsForPage?.length,
                rows: nativeRowsForPage?.length ?? 0,
              }),
            );
          } catch (nativeTableError) {
            console.error(
              "[PDFumo NATIVE TABLE FIRST ERROR]",
              nativeTableError,
            );

            nativeRowsForPage = null;
          }
        }

        let paddleRowsForPage: string[][] | null = null;

        if (finalNeedsOCR && !nativeRowsForPage?.length) {
          setProgress(
            `Arabic text extraction failed on page ${pageNumber}. Running OCR...`,
          );

          console.log(
            "[PDFumo OCR FLOW ENTERED]",
            JSON.stringify({
              page: pageNumber,
              nativeItems: items.length,
            }),
          );

          // PDFumo: Arabic PDFs can have broken font mappings,
          // causing PDF.js to return Latin-looking characters.
          // In that case pageHasArabic is false even though the
          // original document is Arabic.
          const pageHasArabic = items.some(
            (item) => /[\u0600-\u06FF]/.test(item.str),
          );

          const nativeTextForOCR = items
            .map((item) => item.str)
            .join(" ");

          const latinExtendedForOCR = (
            nativeTextForOCR.match(
              /[ÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßêëìíîïðñòóôõö÷øùúûüýþÿ]/g,
            ) || []
          ).length;

          const brokenWordsForOCR = items.filter((item) => {
            const value = item.str;
            if (value.length < 2) return false;

            const punctCount =
              (value.match(/[.,^'`~]/g) || []).length;

            const latinCount =
              (value.match(/[A-Za-z]/g) || []).length;

            return (
              punctCount >= 1 &&
              latinCount >= 1 &&
              value.length <= 10
            );
          }).length;

          const latinItemsForOCR = items.filter((item) =>
            /[A-Za-z]{3,}/.test(item.str),
          ).length;

          const brokenArabicFont =
            !pageHasArabic &&
            (
              (
                latinExtendedForOCR >= 5 &&
                brokenWordsForOCR >= 5
              ) ||
              (
                brokenWordsForOCR >= 12 &&
                latinItemsForOCR >= 10
              )
            );

          const lang =
            pageHasArabic || brokenArabicFont
              ? "ara+eng"
              : "fra+eng";

          console.log(
            `[PDFumo OCR] Page ${pageNumber} language: ${lang}`,
          );

          if (pageNumber === 1 || hasVeryLittleNativeText) {
            setRawExtractionDebug((current) => [
              ...current,
              "",
              "===== OCR LANGUAGE =====",
              `Page: ${pageNumber}`,
              `OCR language selected: ${lang}`,
              `Broken Arabic font: ${brokenArabicFont}`,
            ]);
          }

          // ============================================================
          // PDFumo PaddleOCR FIRST
          //
          // IMPORTANT:
          // Do NOT initialize Tesseract before PaddleOCR.
          // Tesseract Arabic worker initialization can be very expensive
          // and was delaying/stalling page 1 before PaddleOCR started.
          // Tesseract is initialized only if PaddleOCR fails.
          // ============================================================
          // For Arabic/table OCR, try the verified PaddleOCR pipeline
          // before falling back to the existing Tesseract pipeline.
          // ============================================================

          let paddleRowsResult:
            | Awaited<
                ReturnType<
                  typeof extractPageWithPaddleOCR
                >
              >
            | null = null;
          let ocrItems: PdfTextItem[] = [];

          try {
            console.log(
              "[PDFumo PaddleOCR FLOW]",
              JSON.stringify({
                page: pageNumber,
                action: "START",
              }),
            );

            setProgress(
              `Running PaddleOCR table extraction on page ${pageNumber}...`,
            );

            paddleRowsResult =
              await extractPageWithPaddleOCR(page);

            const paddleRows =
              paddleRowsResult?.rows ?? null;

            if (paddleRows?.length) {
              console.log(
                "[PDFumo PaddleOCR FLOW]",
                JSON.stringify({
                  page: pageNumber,
                  action: "SUCCESS",
                  rows: paddleRows.length,
                }),
              );
            }
          } catch (paddleError) {
            console.error(
              "[PDFumo PaddleOCR FLOW ERROR]",
              paddleError,
            );

            paddleRowsResult = null;
          }

          const paddleRows =
            paddleRowsResult?.rows ?? null;

          console.log(
            "[PDFumo HYBRID FLOW CHECK]",
            JSON.stringify({
              page: pageNumber,
              hasResult: Boolean(paddleRowsResult),
              rowsType: Array.isArray(paddleRows)
                ? "array"
                : typeof paddleRows,
              rowsLength: Array.isArray(paddleRows)
                ? paddleRows.length
                : null,
              geometryLength:
                paddleRowsResult?.rowsWithGeometry?.length ?? null,
            }),
          );

          // If PaddleOCR reconstructed the table successfully,
          // skip Tesseract for this page.
          if (paddleRows?.length) {
            console.log(
              "[PDFumo OCR FLOW]",
              JSON.stringify({
                page: pageNumber,
                engine: "PaddleOCR",
                rows: paddleRows.length,
              }),
            );

            // Merge PaddleOCR names with the reliable native PDF
            // geometry for candidate numbers and masked IDs.
            const hybridPaddleRows =
              mergePaddleRowsWithNativeGeometry(
                paddleRowsResult?.rowsWithGeometry ?? [],
                nativeItemsForHybrid,
                page.getViewport({ scale: 1 }).height,
              );

            // Show Hybrid result directly in the on-page debug panel.
            setRawExtractionDebug((current) => [
              ...current,
              "",
              "===== PADDLE / HYBRID DEBUG =====",
              `Page: ${pageNumber}`,
              `Paddle rows before hybrid: ${paddleRows.length}`,
              `Native rows available: ${nativeRowsForPage?.length ?? 0}`,
              `Hybrid rows after merge: ${hybridPaddleRows.length}`,
              "===== HYBRID ROWS SAMPLE =====",
              ...hybridPaddleRows.map(
                (row, index) =>
                  `HYBRID ${index + 1}: ${JSON.stringify(row)}`,
              ),
            ]);

            // Store the hybrid rows for the existing Excel pipeline.
            items = hybridPaddleRows.map((row) => ({
              str: row.join(" | "),
              transform: [1, 0, 0, 1, 0, 0],
              width: 0,
            }));

            // Keep the exact reconstructed hybrid rows for PaddleOCR.
            paddleRowsForPage = hybridPaddleRows;
          } else {
            console.log(
              "[PDFumo PaddleOCR FLOW]",
              JSON.stringify({
                page: pageNumber,
                action: "FAILED_OR_EMPTY",
                fallback: "Tesseract",
              }),
            );

            // Initialize Tesseract only when PaddleOCR fails.
            if (!ocrWorker || ocrWorkerLang !== lang) {
              console.log(
                "[PDFumo TESSERACT INIT]",
                JSON.stringify({
                  page: pageNumber,
                  lang,
                }),
              );

              if (ocrWorker) {
                await ocrWorker.terminate();
              }

              ocrWorker = await createWorker(
                lang,
                1,
                {
                  workerPath: "/tesseract/worker.min.js",
                  corePath: "/tesseract/tesseract-core.wasm.js",
                  langPath: "/tessdata",
                },
              );

              ocrWorkerLang = lang;

              console.log(
                "[PDFumo TESSERACT READY]",
                JSON.stringify({
                  page: pageNumber,
                  lang,
                }),
              );
            }

            console.log(
              "[PDFumo OCR CALL]",
              JSON.stringify({
                page: pageNumber,
                lang,
              }),
            );

            ocrItems =
              await extractPageWithOCR(
                page,
                ocrWorker,
              );

            items = ocrItems;
          }

          console.log(
            "[PDFumo OCR RETURNED]",
            JSON.stringify({
              page: pageNumber,
              lang,
              itemCount: ocrItems.length,
            }),
          );

          console.log(
            "[PDFumo OCR AUDIT]",
            JSON.stringify({
              page: pageNumber,
              lang,
              itemCount: ocrItems.length,
              firstItems: ocrItems.slice(0, 12).map((item) => ({
                str: item.str,
                x: item.transform?.[4],
                y: item.transform?.[5],
                width: item.width,
              })),
            }),
          );

          if (pageNumber === 1 || hasVeryLittleNativeText) {
            const candidateOCRItems = ocrItems
              .filter((item) => {
                const x = item.transform?.[4] ?? 0;
                return x >= 410 && x < 520 && item.str.trim();
              })
              .map((item) => ({
                str: item.str,
                x: item.transform?.[4],
                y: item.transform?.[5],
                width: item.width,
              }));

            setRawExtractionDebug((current) => [
              ...current,
              `OCR items: ${ocrItems.length}`,
              "===== CANDIDATE COLUMN OCR DEBUG =====",
              ...candidateOCRItems.map(
                (item, index) =>
                  `CANDIDATE[${index}]: ${item.str} | x=${item.x} | y=${item.y} | w=${item.width}`,
              ),
            ]);
          }

          if (ocrItems.length > 0) {
            items = ocrItems;
          }
        }

        /*
         * PDFumo V7:
         * Use geometry-based reconstruction only when the OCR
         * output actually matches the tested four-column table.
         * All other PDFs keep the existing generic buildRows().
         */
        const rows =
          nativeRowsForPage?.length
            ? nativeRowsForPage
            : paddleRowsForPage?.length
              ? paddleRowsForPage
              : buildRowsOCRTableIfDetected(
                  items,
                  nativeItemsForHybrid,
                ) ??
                buildRows(items);

        // PDFumo DEBUG — verify OCR Arabic reaches buildRows output
        const rowsDebugCells = rows
          .flat()
          .filter((cell) => typeof cell === "string");

        const rowsDebugArabic = rowsDebugCells.filter((cell) =>
          /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(cell),
        );

        console.log(
          "[PDFumo BUILDROWS DEBUG]",
          JSON.stringify({
            page: pageNumber,
            itemCount: items.length,
            rowCount: rows.length,
            arabicCellCount: rowsDebugArabic.length,
            arabicSample: rowsDebugArabic.slice(0, 10),
            rowsSample: rows.slice(0, 5),
          }),
        );

        setRawExtractionDebug((current) => [
          ...current,
          "",
          "===== BUILDROWS DEBUG =====",
          `Page: ${pageNumber}`,
          `OCR/native items: ${items.length}`,
          `Rows: ${rows.length}`,
          `Arabic cells: ${rowsDebugArabic.length}`,
          `Arabic sample: ${rowsDebugArabic.slice(0, 10).join(" | ")}`,
          "===== ROWS DEBUG SAMPLE =====",
          ...rows.slice(0, 5).map(
            (row, index) =>
              `ROW ${index + 1}: ${JSON.stringify(row)}`,
          ),
        ]);

        if (rows.length === 0) {
          rows.push([
            `[Page ${pageNumber} contains no extractable text.]`,
          ]);
        }

        // PDFumo DEBUG — inspect Arabic immediately before XLSX creation
        const rowsTextForDebug = rows
          .flat()
          .filter((cell) => typeof cell === "string")
          .join(" ");

        const arabicCellsForDebug = rows
          .flat()
          .filter(
            (cell) =>
              typeof cell === "string" &&
              /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(cell),
          );

        console.log(
          "[PDFumo XLSX DEBUG]",
          JSON.stringify({
            page: pageNumber,
            rowCount: rows.length,
            arabicCellCount: arabicCellsForDebug.length,
            arabicSample: arabicCellsForDebug.slice(0, 10),
            textSample: rowsTextForDebug.slice(0, 1000),
          }),
        );

        console.log(
          "[PDFumo XLSX SHEET START]",
          JSON.stringify({
            page: pageNumber,
            rows: rows.length,
            cells: rows.reduce(
              (total, row) => total + row.length,
              0,
            ),
          }),
        );

        const worksheet = XLSX.utils.aoa_to_sheet(rows);

        console.log(
          "[PDFumo XLSX SHEET DONE]",
          JSON.stringify({
            page: pageNumber,
            worksheetKeys: Object.keys(worksheet).length,
          }),
        );

        worksheet["!cols"] = Array.from(
          {
            length: Math.max(
              1,
              ...rows.map((row) => row.length),
            ),
          },
          () => ({
            wch: 22,
          }),
        );

        // PDFumo: apply an Arabic-capable font to text cells.
        // This keeps the Unicode text unchanged and only affects
        // how spreadsheet applications render the cells.
        for (const cellAddress of Object.keys(worksheet)) {
          if (cellAddress.startsWith("!")) continue;

          const cell = worksheet[cellAddress];

          if (
            cell &&
            typeof cell.v === "string" &&
            /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(
              cell.v,
            )
          ) {
            cell.s = {
              font: {
                name: "Arial",
                sz: 11,
              },
              alignment: {
                horizontal: "right",
                vertical: "center",
              },
            };
          }
        }

        const sheetName =
          documentPdf.numPages === 1
            ? "PDF Data"
            : `Page ${pageNumber}`;

        console.log(
          "[PDFumo XLSX APPEND START]",
          JSON.stringify({ page: pageNumber }),
        );

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          sheetName.slice(0, 31),
        );

        console.log(
          "[PDFumo XLSX APPEND DONE]",
          JSON.stringify({
            page: pageNumber,
            sheets: workbook.SheetNames.length,
          }),
        );
      }

      console.log(
        "[PDFumo XLSX WRITE START]",
        JSON.stringify({
          sheets: workbook.SheetNames.length,
        }),
      );

      setProgress("Creating Excel workbook...");

      const output = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([output], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);

      resultUrlRef.current = url;
      setResult(url);
      setProgress("");
    } catch (conversionError) {
      console.error("===== PDFUMO PDF TO EXCEL ERROR =====");
      console.error("ERROR OBJECT:", conversionError);
      console.error(
        "ERROR TYPE:",
        typeof conversionError,
      );
      console.error(
        "ERROR NAME:",
        conversionError instanceof Error
          ? conversionError.name
          : "NON_ERROR",
      );
      console.error(
        "ERROR MESSAGE:",
        conversionError instanceof Error
          ? conversionError.message
          : String(conversionError),
      );
      console.error(
        "ERROR STACK:",
        conversionError instanceof Error
          ? conversionError.stack
          : "NO STACK",
      );
      console.error(
        "PDF STATE:",
        pdf
          ? {
              name: pdf.file?.name,
              type: pdf.file?.type,
              size: pdf.file?.size,
              constructor: pdf.file?.constructor?.name,
              hasArrayBuffer:
                typeof pdf.file?.arrayBuffer === "function",
            }
          : null,
      );
      console.error("===== END PDFUMO ERROR =====");

      setProgress("");

      const message =
        conversionError instanceof Error
          ? conversionError.message
          : String(conversionError);

      setError(`Conversion failed: ${message}`);

      // PDFumo mobile debug: expose the real error on the page.
      setRawExtractionDebug((current) => [
        ...current,
        "===== PDFUMO CONVERSION ERROR =====",
        `TYPE: ${typeof conversionError}`,
        `NAME: ${
          conversionError instanceof Error
            ? conversionError.name
            : "NON_ERROR"
        }`,
        `MESSAGE: ${message}`,
        `STACK: ${
          conversionError instanceof Error
            ? conversionError.stack || "NO STACK"
            : "NO STACK"
        }`,
        `PDF: ${
          pdf
            ? JSON.stringify({
                name: pdf.file?.name,
                type: pdf.file?.type,
                size: pdf.file?.size,
                constructor: pdf.file?.constructor?.name,
                hasArrayBuffer:
                  typeof pdf.file?.arrayBuffer === "function",
              })
            : "null"
        }`,
      ]);

      // PDFumo mobile debug: expose the real error on the page.
      setRawExtractionDebug((current) => [
        ...current,
        "===== PDFUMO CONVERSION ERROR =====",
        `TYPE: ${typeof conversionError}`,
        `NAME: ${
          conversionError instanceof Error
            ? conversionError.name
            : "NON_ERROR"
        }`,
        `MESSAGE: ${message}`,
        `STACK: ${
          conversionError instanceof Error
            ? conversionError.stack || "NO STACK"
            : "NO STACK"
        }`,
        `PDF: ${
          pdf
            ? JSON.stringify({
                name: pdf.file?.name,
                type: pdf.file?.type,
                size: pdf.file?.size,
                constructor: pdf.file?.constructor?.name,
                hasArrayBuffer:
                  typeof pdf.file?.arrayBuffer === "function",
              })
            : "null"
        }`,
      ]);

      // PDFumo mobile debug: expose the real error on the page.
      setRawExtractionDebug((current) => [
        ...current,
        "===== PDFUMO CONVERSION ERROR =====",
        `TYPE: ${typeof conversionError}`,
        `NAME: ${
          conversionError instanceof Error
            ? conversionError.name
            : "NON_ERROR"
        }`,
        `MESSAGE: ${message}`,
        `STACK: ${
          conversionError instanceof Error
            ? conversionError.stack || "NO STACK"
            : "NO STACK"
        }`,
        `PDF: ${
          pdf
            ? JSON.stringify({
                name: pdf.file?.name,
                type: pdf.file?.type,
                size: pdf.file?.size,
                constructor: pdf.file?.constructor?.name,
                hasArrayBuffer:
                  typeof pdf.file?.arrayBuffer === "function",
              })
            : "null"
        }`,
      ]);
    } finally {
      if (ocrWorker) {
        await ocrWorker.terminate();
        ocrWorker = null;
      }

      setProcessing(false);
    }
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
  ) {
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
      : `${Math.max(
          1,
          Math.round(pdf.file.size / 1024),
        )} KB`
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
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>

            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              PDF<span className="text-indigo-600">umo</span>
            </span>
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <FileSpreadsheet className="h-7 w-7" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            PDF to Excel
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Convert PDF files into editable Excel spreadsheets
            quickly and easily.
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
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200">
              <Upload className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Drop your PDF file here
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              or choose a file from your device
            </p>

            <label
              className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 ${
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">
                    {pdf.file.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {fileSizeLabel}
                    {pdf.pages > 0
                      ? ` • ${pdf.pages} pages`
                      : ""}
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
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  <span>{progress}</span>
                </div>
              )}

              <button
                type="button"
                onClick={convertToExcel}
                disabled={processing}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Converting to Excel...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-5 w-5" />
                    Convert to Excel
                  </>
                )}
              </button>
            </div>
          )}

          {rawExtractionDebug.length > 0 && (
            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-amber-900">
                Raw Extraction Debug
              </h3>

              <p className="mt-1 text-sm text-amber-700">
                First 100 text items extracted from page 1.
              </p>

              <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-left text-xs leading-6 text-slate-100">
                {rawExtractionDebug.join("\n")}
              </pre>
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
                      Excel spreadsheet created successfully
                    </h3>

                    <p className="mt-1 text-sm text-emerald-700">
                      Your editable Excel workbook is ready.
                    </p>
                  </div>
                </div>

                <a
                  href={result}
                  download="converted.xlsx"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Download Excel
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
          <span>✓ No registration</span>
          <span>✓ Editable XLSX</span>
          <span>✓ Browser-based processing</span>
        </div>
      </section>
    </main>
  );
}
