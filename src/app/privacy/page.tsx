import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy & Credits" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-20 text-white">
      <Link href="/" className="text-[#ffd60a]">
        Back to portfolio
      </Link>
      <h1 className="mb-10 mt-12 text-4xl font-bold">Privacy & credits</h1>
      <div className="space-y-8 leading-7 text-neutral-300">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">Contact</h2>
          <p>
            The contact form opens a draft in your email application. Form
            fields are not stored by this website. Your email provider handles
            the message when you choose to send it.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">Site data</h2>
          <p>
            Portfolio content and images may be served by Supabase. The
            protected admin area uses authentication cookies to keep the site
            owner signed in. No advertising or analytics trackers have been
            added to this portfolio.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-white">
            Design & assets
          </h2>
          <p>
            Portfolio development and photography: Prajjwol Bhandari. Visual
            direction inspired by{" "}
            <a href="https://nickho-motorsports.nl/" className="underline">
              Nick Ho Motorsports
            </a>
            . This portfolio is independent and is not affiliated with the
            reference website.
          </p>
          <p className="mt-3">
            Anton is distributed under the SIL Open Font License. Interface
            icons are from Lucide. Technology marks identify the tools used and
            belong to their respective owners.
          </p>
        </section>
      </div>
    </main>
  );
}
