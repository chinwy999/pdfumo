import Link from "next/link";

export const metadata = {
  title: "Cookie Policy",
  description: "Learn how PDFumo uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            PDF<span className="text-indigo-600">umo</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
            Back to PDFumo
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <p className="mb-3 text-sm font-semibold text-indigo-600">Legal</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Cookie Policy
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Last updated: September 1, 2026
          </p>

          <div className="mt-10 space-y-8 text-[15px] leading-7 text-slate-600">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files or similar technologies that may
                be stored on your device when you visit a website. They can
                help websites remember settings, maintain functionality, and
                understand how visitors use a service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">2. How PDFumo May Use Cookies</h2>
              <p>
                PDFumo may use essential cookies or similar technologies for
                security, functionality, preferences, and website operation.
                If analytics or advertising services are enabled, those
                services may use additional technologies according to their
                respective policies.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">3. Managing Cookies</h2>
              <p>
                Most modern browsers allow you to view, block, or delete
                cookies through their privacy settings. Disabling certain
                cookies may affect some website functionality.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">4. Third-Party Technologies</h2>
              <p>
                Third-party providers used by PDFumo may place or access their
                own cookies or similar technologies. Their use of such
                technologies is governed by their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">5. Updates</h2>
              <p>
                This Cookie Policy may be updated when our technologies or
                services change. The latest revision date will be shown at the
                top of this page.
              </p>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
