"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Category } from "@/types/database";

const categorySchema = z.object({
  description: z.string().trim(),
  display_order: z.coerce.number().int().min(0, "Display order must be 0 or greater."),
  name: z.string().trim().min(2, "Category name must contain at least 2 characters."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must contain at least 2 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
});

type CategoryFormInput = z.input<typeof categorySchema>;
export type CategoryFormValues = z.output<typeof categorySchema>;

interface CategoryFormProps {
  category?: Category | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onDelete?: (category: Category) => Promise<void> | void;
  onSubmit: (values: CategoryFormValues, category?: Category | null) => Promise<void> | void;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryForm({
  category,
  isSubmitting = false,
  onCancel,
  onDelete,
  onSubmit,
}: CategoryFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      description: category?.description ?? "",
      display_order: category?.display_order ?? 0,
      name: category?.name ?? "",
      slug: category?.slug ?? "",
    },
  });

  const name = watch("name");
  const slug = watch("slug");

  useEffect(() => {
    if (!category && name && (!slug || slug === slugify(slug))) {
      setValue("slug", slugify(name), { shouldValidate: true });
    }
  }, [category, name, setValue, slug]);

  return (
    <form
      className="grid gap-5 border border-white/15 bg-black p-5 text-white"
      onSubmit={handleSubmit((values) => onSubmit(values, category))}
    >
      <div>
        <p className="font-mono text-[0.66rem] font-black uppercase text-[#ffd60a]">
          {category ? "Edit Category" : "New Category"}
        </p>
        <h3 className="mt-2 text-2xl font-black uppercase leading-none">
          {category?.name ?? "Project Class"}
        </h3>
      </div>

      <label className="grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Name
        </span>
        <input
          className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
          {...register("name")}
        />
        {errors.name ? <span className="text-sm text-[#ffd60a]">{errors.name.message}</span> : null}
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Slug
        </span>
        <input
          className="h-11 border border-white/15 bg-white/[0.04] px-3 font-mono text-sm outline-none focus:border-[#ffd60a]"
          {...register("slug")}
        />
        {errors.slug ? <span className="text-sm text-[#ffd60a]">{errors.slug.message}</span> : null}
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Description
        </span>
        <textarea
          className="min-h-24 resize-y border border-white/15 bg-white/[0.04] p-3 text-sm outline-none focus:border-[#ffd60a]"
          {...register("description")}
        />
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Display Order
        </span>
        <input
          className="h-11 border border-white/15 bg-white/[0.04] px-3 font-mono text-sm outline-none focus:border-[#ffd60a]"
          min={0}
          type="number"
          {...register("display_order")}
        />
        {errors.display_order ? (
          <span className="text-sm text-[#ffd60a]">{errors.display_order.message}</span>
        ) : null}
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <button
            className="h-11 bg-[#ffd60a] px-5 font-mono text-xs font-black uppercase text-black transition hover:bg-white disabled:opacity-55"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving" : "Save Category"}
          </button>
          <button
            className="h-11 border border-white/15 px-5 font-mono text-xs font-black uppercase text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>

        {category && onDelete ? (
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-white/15 px-4 font-mono text-xs font-black uppercase text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
            disabled={isSubmitting}
            onClick={() => onDelete(category)}
            type="button"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
