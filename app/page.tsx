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
  LockKeyhole,
  Menu,
  Scissors,
  ShieldCheck,
  Sparkles,
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
  },
  {
    title: "Split PDF",
    description: "Separate pages or extract specific pages from a PDF.",
    icon: Scissors,
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size while keeping great quality.",
    icon: FileArchive,
  },
  {
    title: "PDF to JPG",
    description: "Convert PDF pages into high-quality JPG images.",
    icon: FileImage,
  },
  {
    title: "JPG to PDF",
    description: "Turn your images into a clean PDF document.",
    icon: FileOutput,
  },
  {
    title: "Protect PDF",
    description: "Secure your documents with password protection.",
    icon: LockKeyhole,
  },
];

const benefits = [
  {
    title: "Fast & Simple",
    description: "Designed to get your PDF task done with minimum steps.",
    icon: Zap,
  },
  {
    title: "Privacy First",
    description: "Your documents are handled with security and privacy in mind.",
    icon: ShieldCheck,
  },
  {
    title: "No Registration",
    description: "Start using PDFumo without creating an account.",
    icon: Check,
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#060914] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-280px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-[-180px] top-[420px] h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#060914]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              PDF<span className="text-cyan-400">umo</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#tools" className="text-sm text-slate-300 transition hover:text-white">
              Tools
            </a>
            <a href="#features" className="text-sm text-slate-300 transition hover:text-white">
              Features
            </a>
            <a href="#about" className="text-sm text-slate-300 transition hover:text-white">
              About
            </a>
          </nav>

          <div className="hidden md:block">
            <a
              href="#tools"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-50"
            >
              Explore Tools
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-slate-300 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/[0.07] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#tools" onClick={() => setMenuOpen(false)} className="text-slate-300">
                Tools
              </a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="text-slate-300">
                Features
              </a>
              <a href="#about" onClick={() => setMenuOpen(false)} className="text-slate-300">
                About
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs font-semibold text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Powerful PDF tools, made simple
          </div>

          <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            All Your PDF Tools.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Simple. Fast. Free.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Merge, split, compress, convert and protect your PDF files with
            simple online tools designed for everyone.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#tools"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 text-sm font-extrabold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02] sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Choose a PDF Tool
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="#features"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-bold text-white transition hover:bg-white/[0.08] sm:w-auto"
            >
              Learn More
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              No registration
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Easy to use
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Works in your browser
            </span>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-cyan-400">
              PDF Tools
            </p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Everything you need
            </h2>
            <p className="mt-3 max-w-xl text-slate-400">
              Start with one of our most popular PDF tools. More tools can be
              added as PDFumo grows.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <a
                key={tool.title}
                href="#"
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.06]"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-400/15">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">{tool.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-400" />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-y border-white/[0.06] bg-white/[0.018]"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-cyan-400">
              Why PDFumo
            </p>
            <h2 className="text-3xl font-black sm:text-4xl">
              Built around simplicity
            </h2>
            <p className="mt-4 text-slate-400">
              Powerful functionality without a complicated interface.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-white/[0.07] bg-[#090d19] p-7"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.08] via-blue-500/[0.05] to-violet-500/[0.08] p-8 sm:p-14">
          <FilePlus2 className="mx-auto mb-5 h-10 w-10 text-cyan-300" />
          <h2 className="text-3xl font-black sm:text-4xl">
            Your PDF workflow, simplified.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            PDFumo is being built to make everyday PDF tasks faster, cleaner
            and easier.
          </p>
          <a
            href="#tools"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-50"
          >
            Explore PDF Tools
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600">
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-bold">
              PDF<span className="text-cyan-400">umo</span>
            </span>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} PDFumo. All rights reserved.
          </p>

          <div className="flex gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
            <a href="#" className="hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
