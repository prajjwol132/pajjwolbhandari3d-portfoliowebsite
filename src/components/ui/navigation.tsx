"use client";

import Link from "next/link";
import { Code2 } from "lucide-react";
import { useSmoothScroll } from "@/components/providers/smooth-scroll-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export function SiteNavigation() {
  const { scrollTo } = useSmoothScroll();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/70 bg-background/58 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link className="flex items-center gap-2 text-sm font-semibold" href="#hero">
          <span className="flex size-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
            <Code2 className="size-4" />
          </span>
          <span>Prajjwol Bhandari</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              className={cn(
                "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors",
                "hover:bg-foreground/8 hover:text-foreground",
              )}
              href={item.href}
              key={item.href}
              onClick={(event) => {
                event.preventDefault();
                scrollTo(item.href, { offset: -72 });
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Button
          className="hidden sm:inline-flex"
          onClick={() => scrollTo("#contact", { offset: -72 })}
          size="sm"
          type="button"
          variant="outline"
        >
          Start a Build
        </Button>
      </div>
    </header>
  );
}
