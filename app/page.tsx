"use client";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
  Presentation,
  Scissors,
  ShieldCheck,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const tools = [
  {
    titleEn: "Merge PDF",
    titleFr: "Fusionner un PDF",
    titleAr: "دمج PDF",
    descriptionEn: "Combine multiple PDF files into one document.",
    descriptionAr: "اجمع عدة ملفات PDF في مستند واحد.",
    descriptionFr:
      "Combinez plusieurs fichiers PDF en un seul document.",
    icon: GitMerge,
    href: "/tools/merge-pdf",
  },
  {
    titleEn: "Split PDF",
    titleFr: "Diviser un PDF",
    titleAr: "تقسيم PDF",
    descriptionEn: "Separate pages or extract specific pages from a PDF.",
    descriptionAr: "افصل الصفحات أو استخرج صفحات محددة من ملف PDF.",
    descriptionFr:
      "Séparez les pages ou extrayez des pages spécifiques d’un PDF.",
    icon: Scissors,
    href: "/tools/split-pdf",
  },
  {
    titleEn: "Compress PDF",
    titleFr: "Compresser un PDF",
    titleAr: "ضغط PDF",
    descriptionEn: "Reduce PDF file size while keeping great quality.",
    descriptionAr: "قلّل حجم ملف PDF مع الحفاظ على جودة ممتازة.",
    descriptionFr:
      "Réduisez la taille de vos fichiers PDF tout en conservant une excellente qualité.",
    icon: FileArchive,
    href: "/tools/compress-pdf",
  },
  {
    titleEn: "PDF to JPG",
    titleFr: "PDF en JPG",
    titleAr: "PDF إلى JPG",
    descriptionEn: "Convert PDF pages into high-quality JPG images.",
    descriptionAr: "حوّل صفحات PDF إلى صور JPG عالية الجودة.",
    descriptionFr:
      "Convertissez les pages PDF en images JPG de haute qualité.",
    icon: FileImage,
    href: "/tools/pdf-to-jpg",
  },
  {
    titleEn: "JPG to PDF",
    titleFr: "JPG en PDF",
    titleAr: "JPG إلى PDF",
    descriptionEn: "Turn your images into a clean PDF document.",
    descriptionAr: "حوّل صورك إلى مستند PDF منظم.",
    descriptionFr:
      "Transformez vos images en un document PDF propre.",
    icon: FileOutput,
    href: "/tools/jpg-to-pdf",
  },
  {
    titleEn: "Protect PDF",
    titleFr: "Protéger un PDF",
    titleAr: "حماية PDF",
    descriptionEn: "Secure your documents with password protection.",
    descriptionAr: "احمِ مستنداتك باستخدام كلمة مرور.",
    descriptionFr:
      "Sécurisez vos documents avec une protection par mot de passe.",
    icon: LockKeyhole,
    href: "/tools/protect-pdf",
  },
  {
    titleEn: "Watermark PDF",
    titleFr: "Filigrane PDF",
    titleAr: "علامة مائية على PDF",
    descriptionEn: "Add custom text watermarks to every page of a PDF.",
    descriptionAr: "أضف علامات مائية نصية مخصصة إلى كل صفحة من ملف PDF.",
    descriptionFr:
      "Ajoutez des filigranes textuels personnalisés à chaque page d’un PDF.",
    icon: Droplets,
    href: "/tools/watermark-pdf",
  },
  {
    titleEn: "PDF to Word",
    titleFr: "PDF en Word",
    titleAr: "PDF إلى Word",
    descriptionEn: "Convert PDF files into editable Word documents.",
    descriptionAr: "حوّل ملفات PDF إلى مستندات Word قابلة للتعديل.",
    descriptionFr:
      "Convertissez vos fichiers PDF en documents Word modifiables.",
    icon: FileText,
    href: "/tools/pdf-to-word",
  },
  {
    titleEn: "PDF to Excel",
    titleFr: "PDF en Excel",
    titleAr: "PDF إلى Excel",
    descriptionEn: "Convert PDF tables into Excel spreadsheets.",
    descriptionAr: "حوّل جداول PDF إلى جداول بيانات Excel.",
    descriptionFr:
      "Convertissez les tableaux PDF en feuilles de calcul Excel.",
    icon: FileOutput,
    href: "/tools/pdf-to-excel",
  },
  {
    titleEn: "PDF to PowerPoint",
    titleFr: "PDF en PowerPoint",
    titleAr: "PDF إلى PowerPoint",
    descriptionEn: "Convert PDF pages into PowerPoint presentations.",
    descriptionAr: "حوّل صفحات PDF إلى عروض تقديمية PowerPoint.",
    descriptionFr:
      "Convertissez les pages PDF en présentations PowerPoint.",
    icon: Presentation,
    href: "/tools/pdf-to-powerpoint",
  },
];

const benefits = [
  {
    titleEn: "Fast & Simple",
    titleFr: "Rapide et simple",
    titleAr: "سريع وبسيط",
    descriptionEn:
      "Complete everyday PDF tasks with a clean workflow and minimum steps.",
    descriptionAr:
      "أنجز مهام PDF اليومية من خلال خطوات واضحة وبأقل عدد ممكن من الإجراءات.",
    descriptionFr:
      "Effectuez vos tâches PDF quotidiennes avec un flux de travail clair et un minimum d’étapes.",
    icon: Zap,
  },
  {
    titleEn: "Privacy First",
    titleFr: "La confidentialité avant tout",
    titleAr: "الخصوصية أولًا",
    descriptionEn:
      "Your documents stay in your browser whenever the tool supports local processing.",
    descriptionAr:
      "تبقى مستنداتك في متصفحك عندما تدعم الأداة المعالجة المحلية.",
    descriptionFr:
      "Vos documents restent dans votre navigateur lorsque l’outil prend en charge le traitement local.",
    icon: ShieldCheck,
  },
  {
    titleEn: "No Registration",
    titleFr: "Sans inscription",
    titleAr: "بدون تسجيل",
    descriptionEn:
      "Open a tool and get started immediately without creating an account.",
    descriptionAr:
      "افتح الأداة وابدأ فورًا دون الحاجة إلى إنشاء حساب.",
    descriptionFr:
      "Ouvrez un outil et commencez immédiatement sans créer de compte.",
    icon: Check,
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language } = useLanguage();
  const ar = language === "ar";
  const fr = language === "fr";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={fr ? "Accueil de PDFumo" : ar ? "الصفحة الرئيسية لـ PDFumo" : "PDFumo home"}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>

            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              PDF<span className="text-indigo-600">umo</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#tools"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              {fr ? "Outils" : ar ? "الأدوات" : "Tools"}
            </a>

            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              {fr ? "Fonctionnalités" : ar ? "المميزات" : "Features"}
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              {fr ? "À propos" : ar ? "حول PDFumo" : "About"}
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />

            <a
              href="#tools"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              {fr ? "Explorer les outils" : ar ? "استكشف الأدوات" : "Explore Tools"}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label={fr ? "Ouvrir ou fermer le menu" : ar ? "فتح أو إغلاق القائمة" : "Toggle menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              <a
                href="#tools"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {fr ? "Outils" : ar ? "الأدوات" : "Tools"}
              </a>

              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {fr ? "Fonctionnalités" : ar ? "المميزات" : "Features"}
              </a>

              <a
                href="#about"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {fr ? "À propos" : ar ? "حول PDFumo" : "About"}
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
            {fr ? "Outils PDF gratuits en ligne" : ar ? "أدوات PDF مجانية عبر الإنترنت" : "Free online PDF tools"}
          </div>

          <h1 className="text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            {fr ? "Des outils PDF puissants." : ar ? "أدوات PDF قوية." : "Powerful PDF tools."}
            <br />
            <span className="text-indigo-600">{fr ? "Simples, rapides et gratuits." : ar ? "بسيطة وسريعة ومجانية." : "Simple, fast, and free."}</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {fr
              ? "Fusionnez, divisez, compressez, convertissez, protégez et ajoutez des filigranes à vos fichiers PDF avec des outils en ligne simples conçus pour vous aider à travailler plus rapidement."
              : ar
              ? "ادمج ملفات PDF وقسّمها واضغطها وحوّلها واحمِها وأضف إليها علامات مائية باستخدام أدوات بسيطة عبر الإنترنت مصممة لإنجاز مهامك بشكل أسرع."
              : "Merge, split, compress, convert, protect and watermark your PDF files with simple online tools designed to help you get things done faster."}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#tools"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700 hover:shadow-xl sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              {fr ? "Choisissez un outil PDF" : ar ? "اختر أداة PDF" : "Choose a PDF Tool"}
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="#features"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              {fr ? "En savoir plus" : ar ? "اعرف المزيد" : "Learn More"}
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {fr ? "Sans inscription" : ar ? "لا حاجة للتسجيل" : "No registration"}
            </span>

            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {fr ? "Facile à utiliser" : ar ? "سهل الاستخدام" : "Easy to use"}
            </span>

            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {fr ? "Fonctionne directement dans votre navigateur" : ar ? "يعمل مباشرة في متصفحك" : "Works in your browser"}
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
              {fr ? "Outils PDF" : ar ? "أدوات PDF" : "PDF Tools"}
            </p>

            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {fr ? "Tout ce dont vous avez besoin" : ar ? "كل ما تحتاجه" : "Everything you need"}
            </h2>

            <p className="mt-3 max-w-xl text-slate-600">
              {fr
                ? "Choisissez un outil et effectuez votre tâche PDF en quelques étapes simples."
                : ar
                ? "اختر أداة وأنجز مهمة PDF الخاصة بك في بضع خطوات بسيطة."
                : "Choose a tool and complete your PDF task in just a few simple steps."}
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <a
                key={fr ? tool.titleFr : ar ? tool.titleAr : tool.titleEn}
                href={tool.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/70"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {fr ? tool.titleFr : ar ? tool.titleAr : tool.titleEn}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {fr ? tool.descriptionFr : ar ? tool.descriptionAr : tool.descriptionEn}
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
              {fr ? "Pourquoi PDFumo" : ar ? "لماذا PDFumo" : "Why PDFumo"}
            </p>

            <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
              {fr ? "Conçu pour rester simple" : ar ? "مصمم ليبقى بسيطًا" : "Designed to stay simple"}
            </h2>

            <p className="mt-4 text-slate-600">
              {fr ? "Des outils PDF utiles sans complexité inutile." : ar ? "أدوات PDF مفيدة بدون تعقيد غير ضروري." : "Useful PDF tools without unnecessary complexity."}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={fr ? benefit.titleFr : ar ? benefit.titleAr : benefit.titleEn}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-7"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {fr ? benefit.titleFr : ar ? benefit.titleAr : benefit.titleEn}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {fr ? benefit.descriptionFr : ar ? benefit.descriptionAr : benefit.descriptionEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6"
      >
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-8 sm:p-14">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <FileText className="h-6 w-6" />
          </div>

          <span className="text-sm font-bold uppercase tracking-wider text-indigo-600">
            {fr ? "À propos de PDFumo" : ar ? "حول PDFumo" : "About PDFumo"}
          </span>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            {fr ? "Des outils PDF simples pour le travail quotidien." : ar ? "أدوات PDF بسيطة للعمل اليومي." : "Simple PDF tools for everyday work."}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {fr
              ? "PDFumo est une plateforme gratuite en ligne qui réunit les outils PDF essentiels dans un espace simple et facile à utiliser."
              : ar
              ? "PDFumo منصة مجانية عبر الإنترنت تجمع أدوات PDF الأساسية في مكان واحد بسيط وسهل الاستخدام."
              : "PDFumo is a free online platform that brings essential PDF tools together in one simple and easy-to-use place."}
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            {fr
              ? "Compressez, fusionnez, divisez, convertissez, protégez et ajoutez des filigranes à vos fichiers PDF sans étapes inutiles ni création de compte. Notre objectif est de rendre les tâches PDF courantes plus rapides, plus claires et plus accessibles."
              : ar
              ? "اضغط ملفات PDF وادمجها وقسّمها وحوّلها واحمِها وأضف إليها علامات مائية دون خطوات غير ضرورية أو تسجيل حساب. هدفنا هو جعل مهام PDF الشائعة أسرع وأوضح وأسهل للجميع."
              : "Compress, merge, split, convert, protect, and watermark PDF files without unnecessary steps or account registration. Our goal is to make common PDF tasks faster, clearer, and more accessible."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-semibold text-slate-700">
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {fr ? "Gratuit à utiliser" : ar ? "مجاني للاستخدام" : "Free to use"}
            </span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {fr ? "Sans inscription" : ar ? "لا حاجة للتسجيل" : "No registration"}
            </span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {fr ? "Flux de travail simple" : ar ? "سير عمل بسيط" : "Simple workflow"}
            </span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">
              {fr ? "Axé sur la confidentialité" : ar ? "يركز على الخصوصية" : "Privacy focused"}
            </span>
          </div>

          <a
            href="#tools"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {fr ? "Explorer les outils PDF" : ar ? "استكشف أدوات PDF" : "Explore PDF Tools"}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                  <FileText className="h-4 w-4 text-white" />
                </div>

                <span className="font-extrabold text-slate-900">
                  PDF<span className="text-indigo-600">umo</span>
                </span>
              </Link>

              <p className="mt-3 text-sm text-slate-500">
                {fr ? "Des outils PDF simples pour le travail quotidien." : ar ? "أدوات PDF بسيطة للعمل اليومي." : "Simple PDF tools for everyday work."}
              </p>
            </div>

            <nav
              aria-label={fr ? "Liens légaux" : ar ? "روابط قانونية" : "Legal"}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"
            >
              <Link
                href="/legal/privacy-policy"
                className="text-slate-500 transition hover:text-indigo-600"
              >
                {fr ? "Politique de confidentialité" : ar ? "سياسة الخصوصية" : "Privacy Policy"}
              </Link>

              <Link
                href="/legal/terms"
                className="text-slate-500 transition hover:text-indigo-600"
              >
                {fr ? "Conditions d’utilisation" : ar ? "شروط الاستخدام" : "Terms of Service"}
              </Link>

              <Link
                href="/legal/cookie-policy"
                className="text-slate-500 transition hover:text-indigo-600"
              >
                {fr ? "Politique relative aux cookies" : ar ? "سياسة ملفات تعريف الارتباط" : "Cookie Policy"}
              </Link>

              <Link
                href="/legal/disclaimer"
                className="text-slate-500 transition hover:text-indigo-600"
              >
                {fr ? "Avertissement" : ar ? "إخلاء المسؤولية" : "Disclaimer"}
              </Link>
            </nav>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400">
              {fr
                ? `© ${new Date().getFullYear()} PDFumo. Tous droits réservés.`
                : ar
                ? `© ${new Date().getFullYear()} PDFumo. جميع الحقوق محفوظة.`
                : `© ${new Date().getFullYear()} PDFumo. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
