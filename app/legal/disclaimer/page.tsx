import Link from "next/link";

export const metadata = {
  title: "Disclaimer",
  description: "Disclaimer and limitations for PDFumo.",
};

export default function DisclaimerPage() {
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
            Disclaimer
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Last updated: September 1, 2026
          </p>

          <div className="mt-10 space-y-8 text-[15px] leading-7 text-slate-600">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">1. General Information</h2>
              <p>
                PDFumo provides general-purpose document processing tools.
                The information and functionality provided through the website
                are offered for general use and should not be considered
                professional, legal, financial, or other specialized advice.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">2. File Results</h2>
              <p>
                Although we aim to provide reliable PDF processing tools,
                results may vary depending on the structure, format, size, or
                contents of a document. You are responsible for reviewing
                generated files before relying on them.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">3. Backup Copies</h2>
              <p>
                You should maintain appropriate backup copies of important
                documents. PDFumo should not be treated as a document storage
                or backup service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">4. Third-Party Services</h2>
              <p>
                PDFumo may contain functionality provided by third parties.
                We are not responsible for the availability, policies, or
                content of external services that we do not control.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">5. Use at Your Own Risk</h2>
              <p>
                Your use of PDFumo is at your own risk. To the maximum extent
                permitted by applicable law, PDFumo disclaims warranties not
                expressly provided in its Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">6. More Information</h2>
              <p>
                For additional information about using PDFumo, please review
                our{" "}
                <Link
                  href="/legal/terms"
                  className="font-medium text-indigo-600 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/legal/privacy-policy"
                  className="font-medium text-indigo-600 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
