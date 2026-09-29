import Image from "next/image";
import { ArrowUpRight, GitBranch, Mail } from "lucide-react";
import { PortfolioHeroSection } from "@/components/sections/portfolio-hero-section";
import { ReferenceScrollEffects } from "@/components/sections/reference-scroll-effects";

const partners = [
  "NEXT",
  "THREE",
  "GSAP",
  "SUPA",
  "R3F",
  "VERCEL",
  "LENIS",
  "RADIX",
  "FIGMA",
  "NODE",
  "POSTGRES",
  "TAILWIND",
  "FRAMER",
  "TYPESCRIPT",
  "CMS",
  "WEBGL",
  "UI LAB",
  "DEVOPS",
  "API",
  "MOTION",
  "AUTH",
  "STORAGE",
  "DESIGN",
  "PORTFOLIO",
];

const historyItems = [
  {
    count: "01",
    title: "The Foundation",
    image: "/media/projects/portfolio-engine.svg",
    caption: "Next.js 14, Supabase, TypeScript, and a content system designed before the visuals.",
  },
  {
    count: "02",
    title: "First Interfaces",
    image: "/media/projects/media-cms.svg",
    caption: "Admin-controlled project categories, image assets, video fields, and profile telemetry.",
  },
  {
    count: "03",
    title: "3D Motion Lab",
    image: "/media/projects/r3f-showcase.svg",
    caption: "React Three Fiber scenes, cursor response, and scroll-aware spatial composition.",
  },
  {
    count: "04",
    title: "Performance Pass",
    image: "/media/projects/performance-pass.svg",
    caption: "Responsive GPU quality, fallbacks, image optimization, and production validation.",
  },
  {
    count: "05",
    title: "Launch Ready",
    image: "/media/brand/prajjwol-main.png",
    caption: "A portfolio system that can grow through the dashboard without rebuilding the site.",
  },
];

const articles = [
  {
    title: "Building a developer portfolio that behaves like a product",
    meta: "Architecture / Next.js",
    image: "/media/projects/portfolio-engine.svg",
  },
  {
    title: "Scroll choreography without sacrificing mobile performance",
    meta: "Motion / GSAP",
    image: "/media/projects/performance-pass.svg",
  },
  {
    title: "CMS-first project storytelling for technical case studies",
    meta: "Supabase / Admin",
    image: "/media/projects/media-cms.svg",
  },
  {
    title: "R3F scenes tuned for smooth interactive portfolios",
    meta: "WebGL / Three",
    image: "/media/projects/r3f-showcase.svg",
  },
];

const calendar = [
  ["Phase 1", "Foundation setup", "Done"],
  ["Phase 2", "3D hero and image interaction", "Done"],
  ["Phase 3", "Scroll-driven section motion", "Done"],
  ["Phase 4", "Dynamic project showcase", "Done"],
  ["Phase 5", "Reference visual polish", "Active"],
  ["Phase 6", "Supabase production content", "Next"],
  ["Phase 7", "SEO and accessibility pass", "Next"],
  ["Phase 8", "Deployment review", "Next"],
  ["Phase 9", "Portfolio launch", "Ready"],
];

const footerLinks = [
  { label: "Profile", href: "#profile" },
  { label: "History", href: "#history" },
  { label: "Media", href: "#media" },
  { label: "Calendar", href: "#calendar" },
  { label: "Gallery", href: "#gallery" },
];

function MediaFrame({
  alt,
  className = "",
  image,
  label,
  priority = false,
}: {
  alt: string;
  className?: string;
  image: string;
  label?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={[
        "group/media relative overflow-hidden bg-black text-white",
        "before:pointer-events-none before:absolute before:inset-0 before:z-10 before:border before:border-white/15",
        className,
      ].join(" ")}
    >
      <Image
        src={image}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
        alt={alt}
        className="object-cover grayscale transition duration-500 ease-out group-hover/media:scale-105 group-hover/media:grayscale-0"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.58))]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:36px_36px]" />
      {label ? (
        <span className="absolute bottom-3 left-3 z-20 bg-[#ffd60a] px-2 py-1 font-mono text-[0.58rem] font-black uppercase text-black">
          {label}
        </span>
      ) : null}
    </div>
  );
}

function ManifestoSection() {
  return (
    <section id="manifesto" className="relative overflow-hidden bg-white px-5 py-16 text-black md:px-12 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative min-h-[34rem] md:min-h-[38rem]">
          <MediaFrame
            alt="Project preview"
            className="absolute left-0 top-0 hidden aspect-[16/10] w-44 border border-black/10 md:block"
            image="/media/projects/r3f-showcase.svg"
            label="build"
          />
          <MediaFrame
            alt="Prajjwol portrait"
            className="absolute bottom-10 right-0 hidden aspect-[4/5] w-36 border border-black/10 md:block"
            image="/media/brand/prajjwol-main.png"
            label="profile"
          />

          <div className="mx-auto flex max-w-3xl flex-col items-center pt-16 text-center md:pt-24" data-reference-reveal>
            <p className="mb-5 bg-[#ffd60a] px-3 py-2 font-mono text-[0.62rem] font-black uppercase">
              Development Manifesto
            </p>
            <h2 className="text-[clamp(2.15rem,5.7vw,5.4rem)] font-black uppercase leading-[0.84] tracking-normal">
              I&apos;m driven by progress, by finding that one{" "}
              <span className="text-[#ffd60a]">piece of improvement</span> that most people overlook.
              Every project is a chance to become{" "}
              <span className="text-[#ffd60a]">sharper, more focused, more complete.</span>
            </h2>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-x-10 gap-y-11 py-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          data-reference-reveal
        >
          {partners.map((partner, index) => (
            <div
              className="flex h-14 items-center justify-center font-mono text-xs font-black uppercase text-neutral-950"
              key={partner}
            >
              <span className={index % 6 === 0 ? "text-3xl" : index % 4 === 0 ? "text-lg" : "text-[0.68rem]"}>
                {partner}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-center" data-reference-reveal>
          <a className="bg-[#ffd60a] px-5 py-3 font-mono text-[0.64rem] font-black uppercase text-black" href="#contact">
            Become partner +
          </a>
        </div>
      </div>
    </section>
  );
}

function HistorySection() {
  return (
    <section id="history" className="relative overflow-hidden bg-black px-5 py-24 text-white md:px-12 md:py-40">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:20%_100%]" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-[1fr_auto_1fr]">
        <div className="hidden md:block" />
        <div className="mx-auto flex w-full max-w-[18rem] flex-col items-center gap-16 md:w-72">
          {historyItems.map((item, index) => (
            <article className="relative w-full" data-history-card key={item.title}>
              <MediaFrame
                alt={item.title}
                className="aspect-[4/5] w-full opacity-80"
                image={item.image}
                label={item.count}
              />
              <div className="mt-3 grid grid-cols-[auto_1fr] gap-3 font-mono text-[0.62rem] font-black uppercase">
                <span className="bg-[#ffd60a] px-2 py-1 text-black">{item.count}</span>
                <div>
                  <h3 className="text-white">{item.title}</h3>
                  <p className="mt-1 leading-4 text-white/58">{item.caption}</p>
                </div>
              </div>
              {index === 1 ? (
                <div className="absolute -right-28 top-1/2 hidden items-center gap-3 font-mono text-xs font-black text-white md:flex">
                  <span className="text-[#ffd60a]">+</span> 1/5
                </div>
              ) : null}
            </article>
          ))}
        </div>
        <div className="hidden md:block" />
      </div>
    </section>
  );
}

function MediaSection() {
  return (
    <section id="media" className="relative overflow-hidden bg-white px-5 py-14 text-black md:px-12 md:py-20">
      <div className="pointer-events-none absolute -top-8 left-0 whitespace-nowrap text-[clamp(4.8rem,14vw,13rem)] font-black uppercase leading-none text-neutral-100">
        Media & Articles
      </div>
      <div className="relative mx-auto max-w-7xl" data-reference-reveal>
        <h2 className="mb-8 text-3xl font-black uppercase leading-none md:text-4xl">Media & Articles</h2>
        <div className="grid gap-5 md:grid-cols-4">
          {articles.map((article, index) => (
            <article className="group" key={article.title}>
              <MediaFrame
                alt={article.title}
                className="aspect-[16/9] border border-black/10"
                image={article.image}
                label={`0${index + 1}`}
              />
              <h3 className="mt-3 text-sm font-black uppercase leading-tight transition-colors group-hover:text-neutral-600">
                {article.title}
              </h3>
              <p className="mt-2 font-mono text-[0.62rem] font-black uppercase text-neutral-500">{article.meta}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CalendarSection() {
  return (
    <section id="calendar" className="bg-black px-5 py-20 text-white md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl" data-reference-reveal>
        <h2 className="mb-12 text-center text-4xl font-black uppercase leading-none md:text-5xl">
          Build Calendar 2026
        </h2>
        <div className="divide-y divide-white/14 border-y border-white/14">
          {calendar.map(([phase, title, status]) => (
            <div
              className="grid grid-cols-[5.75rem_1fr_auto] items-center gap-4 py-4 font-mono text-[0.66rem] font-black uppercase md:grid-cols-[8rem_1fr_8rem]"
              key={title}
            >
              <span className="text-white/62">{phase}</span>
              <span className="text-white">{title}</span>
              <span className={status === "Done" || status === "Active" ? "text-[#ffd60a]" : "text-white/55"}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PerformanceBreakSection() {
  return (
    <section id="projects" className="relative overflow-hidden bg-white px-5 py-28 text-black md:px-12 md:py-40">
      <div className="absolute inset-x-0 top-0 h-32 opacity-35 [background-image:linear-gradient(45deg,#d9d9d9_25%,transparent_25%),linear-gradient(-45deg,#d9d9d9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#d9d9d9_75%),linear-gradient(-45deg,transparent_75%,#d9d9d9_75%)] [background-position:0_0,0_10px,10px_-10px,-10px_0] [background-size:20px_20px]" />
      <div className="mx-auto flex min-h-[30rem] max-w-5xl flex-col items-center justify-center gap-20">
        <a
          className="bg-[#ffd60a] px-5 py-3 font-mono text-[0.64rem] font-black uppercase text-black"
          data-reference-reveal
          href="#contact"
        >
          Open for performance work +
        </a>
        <div className="w-full max-w-3xl" data-reference-parallax="60">
          <MediaFrame
            alt="Prajjwol featured project preview"
            className="aspect-[16/9] rounded-sm border border-black/10"
            image="/media/brand/prajjwol-main.png"
            label="view"
          />
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section id="gallery" className="relative overflow-hidden bg-white px-5 pb-24 text-black md:px-12 md:pb-32">
      <div className="pointer-events-none text-[clamp(5.5rem,18vw,17rem)] font-black uppercase leading-none text-neutral-100">
        Gallery
      </div>
      <div className="relative mx-auto -mt-6 grid max-w-5xl grid-cols-3 items-start gap-5 md:gap-12" data-reference-reveal>
        <MediaFrame
          alt="Gallery image left"
          className="aspect-[4/5] -rotate-12 opacity-85"
          image="/media/projects/portfolio-engine.svg"
          label="drag"
        />
        <MediaFrame
          alt="Gallery image center"
          className="mt-8 aspect-square opacity-95 md:mt-0"
          image="/media/projects/r3f-showcase.svg"
          label="01"
        />
        <MediaFrame
          alt="Gallery image right"
          className="aspect-[4/5] rotate-12 opacity-85"
          image="/media/projects/media-cms.svg"
          label="drag"
        />
      </div>
      <div className="mt-10 flex justify-center gap-3">
        <button
          className="flex size-8 items-center justify-center bg-neutral-100 font-mono text-xs font-black text-neutral-500 transition hover:bg-[#ffd60a] hover:text-black"
          type="button"
          aria-label="Previous gallery item"
        >
          -
        </button>
        <button
          className="flex size-8 items-center justify-center bg-neutral-100 font-mono text-xs font-black text-neutral-500 transition hover:bg-[#ffd60a] hover:text-black"
          type="button"
          aria-label="Next gallery item"
        >
          +
        </button>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="bg-black px-5 py-12 text-white md:px-12" id="contact">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1fr_1fr]">
        <div>
          <div className="font-black uppercase">Prajjwol Bhandari</div>
          <p className="mt-3 max-w-xs text-sm text-white/62">
            Full-stack developer building fast, immersive, CMS-backed software interfaces.
          </p>
        </div>
        <nav className="grid gap-2 font-mono text-[0.68rem] font-black uppercase text-white/72">
          {footerLinks.map((link) => (
            <a className="transition hover:text-[#ffd60a]" href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-3 font-mono text-[0.68rem] font-black uppercase">
          <a className="inline-flex items-center gap-2 transition hover:text-[#ffd60a]" href="https://github.com/" rel="noreferrer" target="_blank">
            <GitBranch className="size-4" /> GitHub
          </a>
          <a className="inline-flex items-center gap-2 transition hover:text-[#ffd60a]" href="mailto:admin@prajjwol-bhandari.dev">
            <Mail className="size-4" /> admin@prajjwol-bhandari.dev
          </a>
          <a className="inline-flex items-center gap-2 transition hover:text-[#ffd60a]" href="mailto:admin@prajjwol-bhandari.dev">
            <ArrowUpRight className="size-4" /> Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

export function ReferencePortfolioPage() {
  return (
    <main className="bg-white font-sans">
      <ReferenceScrollEffects />
      <PortfolioHeroSection />
      <ManifestoSection />
      <HistorySection />
      <MediaSection />
      <CalendarSection />
      <PerformanceBreakSection />
      <GallerySection />
      <FooterSection />
    </main>
  );
}
