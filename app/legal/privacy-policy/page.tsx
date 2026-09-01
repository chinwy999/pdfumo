import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "Learn how PDFumo handles privacy and personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            PDF<span className="text-indigo-600">umo</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            Back to PDFumo
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <p className="mb-3 text-sm font-semibold text-indigo-600">
            Legal
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Last updated: September 1, 2026
          </p>

          <div className="mt-10 space-y-8 text-[15px] leading-7 text-slate-600">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                1. Introduction
              </h2>
              <p>
                PDFumo provides online PDF tools that allow users to
                compress, merge, split, convert, protect, and watermark
                documents. We respect your privacy and aim to minimize the
                information required to use our services.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                2. File Processing
              </h2>
              <p>
                PDFumo tools are designed to process files directly in your
                browser whenever the specific tool supports local processing.
                In such cases, your documents do not need to be uploaded to
                our servers for processing.
              </p>
              <p className="mt-3">
                You should always review the behavior of the particular tool
                you are using and avoid uploading confidential documents to
                any online service unless you are comfortable doing so.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                3. Information We May Collect
              </h2>
              <p>
                Depending on how PDFumo is operated and which third-party
                services are enabled, limited technical information may be
                collected, such as IP address, browser type, device
                information, approximate location, pages visited, and
                diagnostic information.
              </p>
              <p className="mt-3">
                We do not intentionally collect the contents of documents
                processed locally in your browser.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                4. Cookies and Similar Technologies
              </h2>
              <p>
                PDFumo may use essential technologies required to operate,
                secure, and improve the website. Third-party analytics,
                advertising, or other services may also use cookies or
                similar technologies if they are enabled.
              </p>
              <p className="mt-3">
                For more information, please see our{" "}
                <Link
                  href="/legal/cookie-policy"
                  className="font-medium text-indigo-600 hover:underline"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                5. Third-Party Services
              </h2>
              <p>
                PDFumo may use third-party providers for hosting, analytics,
                security, advertising, or other website functionality. Those
                providers may process information according to their own
                privacy policies.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                6. Data Security
              </h2>
              <p>
                We take reasonable measures to protect the website and the
                information associated with its operation. However, no
                internet service can guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                7. Children
              </h2>
              <p>
                PDFumo is not intended to knowingly collect personal
                information from children. If you believe that a child has
                provided personal information to the service, please contact
                us so appropriate action can be considered.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                8. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. Any
                changes will be reflected on this page with an updated
                revision date.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                9. Contact
              </h2>
              <p>
                If you have questions about this Privacy Policy or PDFumo's
                privacy practices, please use the contact information made
                available on the website.
              </p>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
