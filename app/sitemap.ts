import type { MetadataRoute } from "next";

const BASE_URL = "https://pdfumo.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/legal/cookie-policy",
    "/legal/disclaimer",
    "/legal/privacy-policy",
    "/legal/terms",
    "/tools/compress-pdf",
    "/tools/excel-to-pdf",
    "/tools/jpg-to-pdf",
    "/tools/merge-pdf",
    "/tools/pdf-to-excel",
    "/tools/pdf-to-jpg",
    "/tools/pdf-to-powerpoint",
    "/tools/pdf-to-word",
    "/tools/protect-pdf",
    "/tools/rotate-pdf",
    "/tools/split-pdf",
    "/tools/unlock-pdf",
    "/tools/watermark-pdf",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
