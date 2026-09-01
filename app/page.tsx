"use client";

import {
  ArrowRight,
  Check,
  FileArchive,
  FileImage,
  FileOutput,
  FilePlus2,
  FileText,
  GitMerge,
  Droplets,
  LockKeyhole,
  Menu,
  Scissors,
  ShieldCheck,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

const tools = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDF files into one document.",
    icon: GitMerge,
    href: "/tools/merge-pdf",
  },
  {
    title: "Split PDF",
    description: "Separate pages or extract specific pages from a PDF.",
    icon: Scissors,
    href: "/tools/split-pdf",
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size while keeping great quality.",
    icon: FileArchive,
    href: "/tools/compress-pdf",
  },
  {
    title: "PDF to JPG",
    description: "Convert PDF pages into high-quality JPG images.",
    icon: FileImage,
    href: "/tools/pdf-to-jpg",
  },
  {
    title: "JPG to PDF",
    description: "Turn your images into a clean PDF document.",
    icon: FileOutput,
    href: "/tools/jpg-to-pdf",
  },
  {
    title: "Protect PDF",
    description: "Secure your documents with password protection.",
    icon: LockKeyhole,
    href: "/tools/protect-pdf",
  },
  {
    title: "Watermark PDF",
    description: "Add custom text watermarks to every page of a PDF.",
    icon: Droplets,
    href: "/tools/watermark-pdf",
  },
];

const benefits = [
  {
    title: "Fast & Simple",
    description:
      "Complete everyday PDF tasks with a clean workflow and minimum steps.",
    icon: Zap,
  },
  {
    title: "Privacy First",
    description:
      "Your documents stay in your browser whenever the tool supports local processing.",
    icon: ShieldCheck,
  },
  {
    title: "No Registration",
    description:
      "Open a tool and get started immediately without creating an account.",
    icon: Check,
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="#"
            className="flex items-center gap-2.5"
            aria-label="PDFumo home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>

            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              PDF<span className="text-indigo-600">umo</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#tools"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Tools
            </a>

            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Features
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              About
            </a>
          </nav>

          <div className="hidden md:block">
            <a
              href="#tools"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Explore Tools
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              <a
                href="#tools"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Tools
              </a>

              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Features
              </a>

              <a
                href="#about"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                About
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 -z-0 h-72 bg-gradient-to-b from-indigo-50/80 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700">
            <FileText className="h-3.5 w-3.5" />
            Simple tools for everyday PDF tasks
          </div>

          <h1 className="text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Powerful PDF tools.
            <br />
            <span className="text-indigo-600">Simple to use.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Merge, split, compress, convert and protect your PDF files with
            simple online tools designed to help you get things done faster.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#tools"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700 hover:shadow-xl sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Choose a PDF Tool
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="#features"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              Learn More
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              No registration
            </span>

            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Easy to use
            </span>

            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Works in your browser
            </span>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section
        id="tools"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-indigo-600">
              PDF Tools
            </p>

            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Everything you need
            </h2>

            <p className="mt-3 max-w-xl text-slate-600">
              Choose a tool and complete your PDF task in just a few simple
              steps.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <a
                key={tool.title}
                href={tool.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/70"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {tool.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {tool.description}
                    </p>
                  </div>

                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-indigo-600">
              Why PDFumo
            </p>

            <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
              Designed to stay simple
            </h2>

            <p className="mt-4 text-slate-600">
              Useful PDF tools without unnecessary complexity.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-7"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {benefit.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="about"
        className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6"
      >
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-8 sm:p-14">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <FilePlus2 className="h-6 w-6" />
          </div>

          <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
            Your PDF workflow, simplified.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            PDFumo brings everyday PDF tools together in one clean,
            straightforward workspace.
          </p>

          <a
            href="#tools"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Explore PDF Tools
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <FileText className="h-4 w-4 text-white" />
            </div>

            <span className="font-extrabold text-slate-900">
              PDF<span className="text-indigo-600">umo</span>
            </span>
          </a>

          <p className="text-xs text-slate-500">
            Simple PDF tools for everyday work.
          </p>
        </div>
      </footer>
    </main>
  );
}
