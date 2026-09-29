"use client";

import { motion } from "framer-motion";
import type { Category } from "@/types/database";
import { cn } from "@/lib/utils";

interface CategoryFilterItem {
  count: number;
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  activeSlug: string;
  categoryCounts: Record<string, number>;
  categories: Category[];
  disabled?: boolean;
  onCategoryChange: (slug: string) => void;
  totalCount: number;
}

function formatCount(value: number) {
  return value.toString().padStart(2, "0");
}

export function CategoryFilter({
  activeSlug,
  categoryCounts,
  categories,
  disabled = false,
  onCategoryChange,
  totalCount,
}: CategoryFilterProps) {
  const items: CategoryFilterItem[] = [
    {
      count: totalCount,
      id: "all-projects",
      name: "All Projects",
      slug: "all",
    },
    ...categories.map((category) => ({
      count: categoryCounts[category.slug] ?? 0,
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
  ];

  return (
    <div
      aria-label="Project category filter"
      className="flex gap-2 overflow-x-auto border-y border-white/10 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.slug === activeSlug;

        return (
          <button
            aria-selected={isActive}
            className={cn(
              "relative shrink-0 overflow-hidden border px-4 py-3 text-left font-mono text-[0.68rem] font-black uppercase tracking-normal transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:ring-offset-2 focus:ring-offset-black",
              isActive
                ? "border-red-500/70 text-white"
                : "border-white/12 bg-black/40 text-zinc-400 hover:border-red-500/40 hover:text-white",
              disabled && "cursor-wait opacity-70",
            )}
            disabled={disabled}
            key={item.id}
            onClick={() => onCategoryChange(item.slug)}
            role="tab"
            type="button"
          >
            {isActive ? (
              <motion.span
                className="absolute inset-0 bg-red-600/18 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.26)]"
                layoutId="activeCategory"
                transition={{ duration: 0.28, ease: "easeOut" }}
              />
            ) : null}
            <span className="relative z-10 flex items-center gap-3">
              <span>{item.name}</span>
              <span
                className={cn(
                  "border px-2 py-1 text-[0.62rem]",
                  isActive
                    ? "border-red-400/60 bg-red-500/18 text-red-100"
                    : "border-white/10 bg-white/[0.03] text-zinc-500",
                )}
              >
                [ {formatCount(item.count)} ]
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
