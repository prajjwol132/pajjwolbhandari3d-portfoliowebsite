"use client";

import { ArrowUp, ArrowUpRight, Check, ChevronsRight, Copy, Mail } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePortfolioContent } from "@/components/providers/portfolio-content-provider";
import { sectionLinks } from "./portfolio-navigation";

export function PortfolioContactSection() {
  const { profile } = usePortfolioContent();
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const email = profile.email;
  const socialLinks = [...profile.social_links];
  if (
    profile.github_url &&
    !socialLinks.some((link) => link.url === profile.github_url)
  )
    socialLinks.push({ label: "GitHub", url: profile.github_url });
  if (
    profile.linkedin_url &&
    !socialLinks.some((link) => link.url === profile.linkedin_url)
  )
    socialLinks.push({ label: "LinkedIn", url: profile.linkedin_url });
  useEffect(() => () => clearTimeout(timer.current), []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    const data = new FormData(event.currentTarget);
    const name = [data.get("firstName"), data.get("lastName")].map(value => String(value ?? "").trim()).filter(Boolean).join(" ");
    const body = `${String(data.get("message")).trim()}\n\nFrom: ${name}\nReply to: ${String(data.get("email")).trim()}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Portfolio enquiry from ${name}`)}&body=${encodeURIComponent(body)}`;
    setFeedback(
      "Your email draft is ready to open in your mail app. Send it there, or copy the email address below.",
    );
  }
  async function copyEmail() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setFeedback(`You can email me directly at ${email}.`);
    }
  }
  return (
    <>
      <section
        id="contact"
        className="portfolio-contact"
        aria-labelledby="contact-heading"
      >
        <div className="contact-backdrop" aria-hidden="true">CONTACT</div>
        <div className="contact-panel">
          <div className="contact-intro">
            <h2 id="contact-heading">Contact</h2>
            <p>Have a project in mind? Let&apos;s talk.</p>
          </div>
          <form className="contact-form" aria-labelledby="contact-heading" onSubmit={submit}>
            <div className="contact-fields">
              <label htmlFor="contact-first-name">
                First Name
                <input
                  id="contact-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="Prajjwol"
                  required
                  maxLength={60}
                />
              </label>
              <label htmlFor="contact-last-name">
                Last Name
                <input
                  id="contact-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Bhandari"
                  required
                  maxLength={60}
                />
              </label>
            </div>
            <label htmlFor="contact-email">
              Email
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={254}
              />
            </label>
            <label htmlFor="contact-message">
              Message
              <textarea
                id="contact-message"
                name="message"
                placeholder="Type your message here..."
                rows={5}
                required
                minLength={10}
                maxLength={4000}
              />
            </label>
            <button className="portfolio-cta contact-submit" type="submit" disabled={!email}>
              Submit <ChevronsRight size={24} aria-hidden />
            </button>
            {feedback && (
              <p className="contact-feedback" role="status">
                {feedback}
              </p>
            )}
          </form>
        </div>
      </section>
      <footer className="portfolio-footer">
        <div className="footer-grid">
          <div>
            <strong className="footer-name">{profile.full_name}</strong>
            <p>{profile.location}</p>
            <a href="#profile" className="portfolio-text-link">
              Back to top <ArrowUp size={16} />
            </a>
          </div>
          <nav aria-label="Footer navigation">
            <span className="portfolio-eyebrow">Explore</span>
            {sectionLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="footer-connect">
            <span className="portfolio-eyebrow">Get in touch</span>
            {email && (
              <div className="footer-email">
                <a href={`mailto:${email}`}>
                  <Mail size={16} />
                  {email}
                </a>
                <button
                  onClick={copyEmail}
                  aria-label={copied ? "Email copied" : "Copy email address"}
                  title={copied ? "Copied" : "Copy email"}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}
            {socialLinks
              .filter((link) => /^https?:\/\//.test(link.url))
              .map((link) => (
                <a
                  href={link.url}
                  key={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                  <ArrowUpRight size={15} />
                </a>
              ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} {profile.full_name}
          </span>
          <span>Designed & developed by Prajjwol</span>
          <a href="/privacy">Privacy & credits</a>
        </div>
      </footer>
    </>
  );
}
