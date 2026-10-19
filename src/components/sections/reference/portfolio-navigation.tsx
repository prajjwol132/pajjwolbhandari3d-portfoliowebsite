"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/smooth-scroll-provider";
import { usePortfolioContent } from "@/components/providers/portfolio-content-provider";
import { getPageImage } from "@/data/page-media";

export const sectionLinks = [
  { label: "About", href: "#about" },
  { label: "My story", href: "#history" },
  { label: "Videos & work", href: "#projects" },
  { label: "Work index", href: "#calendar" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

export function PortfolioNavigation({ menuLabel = "Open menu", onMenuOpenChange }: {
  menuLabel?: string;
  onMenuOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const descriptionId = useId();
  const navigated = useRef<string | null>(null);
  const { stop, start } = useSmoothScroll();
  const { profile, pageMedia } = usePortfolioContent();
  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    onMenuOpenChange?.(nextOpen);
  }
  useEffect(() => {
    if (open) stop();
    else start();
    return start;
  }, [open, start, stop]);
  return (
    <header className="portfolio-nav">
      <a
        className="portfolio-logo"
        href="#profile"
        aria-label="Prajjwol Bhandari home"
      >
        <Image
          src={getPageImage(pageMedia, "brand_logo")}
          width={96}
          height={96}
          alt="PB"
          priority
        />
      </a>
      <Dialog.Root open={open} onOpenChange={changeOpen}>
        <Dialog.Trigger asChild>
          <button
            className="portfolio-icon-button menu-trigger"
            aria-label={menuLabel}
            title={menuLabel}
          >
            <Menu size={21} />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="portfolio-menu-shade" />
          <Dialog.Content
            className="portfolio-menu"
            data-lenis-prevent
            aria-describedby={descriptionId}
            onCloseAutoFocus={(event) => {
              if (navigated.current) {
                event.preventDefault();
                const section = document.querySelector<HTMLElement>(
                  navigated.current,
                );
                section?.setAttribute("tabindex", "-1");
                section?.focus({ preventScroll: true });
                navigated.current = null;
              }
            }}
          >
            <div className="menu-top">
              <div className="menu-brand">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} width={42} height={42} alt="" unoptimized />
                ) : null}
                <Dialog.Title>{profile.full_name}</Dialog.Title>
              </div>
              <Dialog.Close
                className="portfolio-icon-button"
                aria-label="Close menu"
                title="Close menu"
              >
                <X />
              </Dialog.Close>
            </div>
            <Dialog.Description id={descriptionId} className="sr-only">
              Portfolio navigation
            </Dialog.Description>
            <nav aria-label="Main navigation">
              {sectionLinks.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    navigated.current = link.href;
                    start();
                    changeOpen(false);
                  }}
                >
                  <span className="menu-index">0{index + 1}</span>
                  <span>{link.label}</span>
                  <ArrowUpRight />
                </a>
              ))}
            </nav>
            <div className="menu-bottom">
              <span>{profile.location}</span>
              {profile.email && (
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
