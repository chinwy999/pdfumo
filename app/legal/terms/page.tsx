import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using PDFumo.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Last updated: September 1, 2026
          </p>

          <div className="mt-10 space-y-8 text-[15px] leading-7 text-slate-600">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">1. Acceptance</h2>
              <p>
                By accessing or using PDFumo, you agree to these Terms of
                Service. If you do not agree with these terms, please do not
                use the service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">2. Use of the Service</h2>
              <p>
                PDFumo provides online document tools for lawful and legitimate
                purposes. You are responsible for the files you process and
                for ensuring that your use of the service complies with
                applicable laws.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">3. Prohibited Use</h2>
              <p>
                You must not use PDFumo to process, distribute, or facilitate
                unlawful, fraudulent, abusive, malicious, or infringing
                content or activities.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">4. Your Content</h2>
              <p>
                You retain responsibility for documents and other content that
                you process using PDFumo. You must have the necessary rights
                and permissions to use such content.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">5. Availability</h2>
              <p>
                We aim to keep PDFumo available and reliable, but we do not
                guarantee uninterrupted or error-free operation. Features may
                be changed, suspended, or discontinued when necessary.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">6. No Warranty</h2>
              <p>
                PDFumo is provided on an "as is" and "as available" basis to
                the maximum extent permitted by applicable law. We do not
                guarantee that every conversion or processing operation will
                produce the result expected for every document.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, PDFumo and its
                operators shall not be liable for indirect, incidental,
                consequential, or special losses arising from use of the
                service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">8. Intellectual Property</h2>
              <p>
                The PDFumo website, branding, interface, and original
                materials are protected by applicable intellectual property
                laws. You may not reproduce or redistribute them without
                appropriate authorization.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">9. Changes</h2>
              <p>
                These terms may be updated from time to time. Continued use of
                PDFumo after changes are published constitutes acceptance of
                the updated terms to the extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">10. Contact</h2>
              <p>
                For questions regarding these terms, please use the contact
                information made available on the PDFumo website.
              </p>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
