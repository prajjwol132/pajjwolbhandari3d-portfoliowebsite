"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Plus, Trash2, UploadCloud, X } from "lucide-react";
import { DragEvent, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import type {
  Category,
  ProjectInsert,
  ProjectStatus,
  ProjectUpdate,
  ProjectWithCategory,
} from "@/types/database";

const projectSchema = z.object({
  category_id: z.string().trim(),
  display_order: z.coerce.number().int().min(0, "Display order must be 0 or greater."),
  featured_image_url: z.string().trim(),
  full_description: z.string().trim().min(20, "Write a fuller markdown case study."),
  gallery_images: z.array(z.string().trim()).default([]),
  github_url: z.string().trim(),
  is_featured: z.boolean(),
  live_demo_url: z.string().trim(),
  short_description: z.string().trim().min(10, "Short description is too short."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must contain at least 2 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  status: z.enum(["draft", "published", "archived"]),
  tech_stack: z.array(z.string().trim().min(1)).min(1, "Add at least one technology."),
  technical_breakdown: z.record(z.string(), z.string()).default({}),
  title: z.string().trim().min(2, "Project title must contain at least 2 characters."),
  video_url: z.string().trim(),
});

type ProjectFormInput = z.input<typeof projectSchema>;
export type ProjectFormValues = z.output<typeof projectSchema>;

interface FileDropzoneProps {
  accept: string;
  description: string;
  disabled?: boolean;
  label: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

interface ProjectFormProps {
  categories: Category[];
  onCancel: () => void;
  onDelete?: (project: ProjectWithCategory) => Promise<void> | void;
  onSaved?: () => Promise<void> | void;
  project?: ProjectWithCategory | null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function FileDropzone({
  accept,
  description,
  disabled = false,
  label,
  multiple = false,
  onFiles,
}: FileDropzoneProps) {
  const inputId = useId();

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (disabled) {
      return;
    }

    onFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <label
      className="grid cursor-pointer gap-2 border border-dashed border-white/18 bg-white/[0.03] p-4 transition hover:border-[#ffd60a]"
      htmlFor={inputId}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <span className="flex items-center gap-2 font-mono text-[0.66rem] font-black uppercase text-white">
        <UploadCloud className="size-4 text-[#ffd60a]" />
        {label}
      </span>
      <span className="text-sm leading-5 text-white/52">{description}</span>
      <input
        accept={accept}
        className="sr-only"
        disabled={disabled}
        id={inputId}
        multiple={multiple}
        onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
        type="file"
      />
    </label>
  );
}

function defaultValues(project?: ProjectWithCategory | null): ProjectFormValues {
  return {
    category_id: project?.category_id ?? "",
    display_order: project?.display_order ?? 0,
    featured_image_url: project?.featured_image_url ?? "",
    full_description:
      project?.full_description ??
      "## Problem Statement\nDescribe the project context.\n\n## Solution\nExplain the architecture, user experience, and implementation decisions.\n\n## Outcome\nSummarize measurable results.",
    gallery_images: project?.gallery_images ?? [],
    github_url: project?.github_url ?? "",
    is_featured: project?.is_featured ?? false,
    live_demo_url: project?.live_demo_url ?? "",
    short_description: project?.short_description ?? "",
    slug: project?.slug ?? "",
    status: project?.status ?? "published",
    tech_stack: project?.tech_stack ?? [],
    technical_breakdown: project?.technical_breakdown ?? {},
    title: project?.title ?? "",
    video_url: project?.video_url ?? "",
  };
}

export function ProjectForm({
  categories,
  onCancel,
  onDelete,
  onSaved,
  project,
}: ProjectFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultValues(project),
  });

  const [techInput, setTechInput] = useState("");
  const [breakdownKey, setBreakdownKey] = useState("");
  const [breakdownValue, setBreakdownValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLabel, setUploadingLabel] = useState("");
  const [message, setMessage] = useState("");
  const techStack = watch("tech_stack") ?? [];
  const galleryImages = watch("gallery_images") ?? [];
  const technicalBreakdown = watch("technical_breakdown") ?? {};
  const title = watch("title");
  const slug = watch("slug");

  const addTechnology = () => {
    const next = techInput.trim();
    if (!next || techStack.some((item) => item.toLowerCase() === next.toLowerCase())) {
      return;
    }

    setValue("tech_stack", [...techStack, next], { shouldDirty: true, shouldValidate: true });
    setTechInput("");
  };

  const removeTechnology = (technology: string) => {
    setValue(
      "tech_stack",
      techStack.filter((item) => item !== technology),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const addBreakdownItem = () => {
    const key = breakdownKey.trim();
    const value = breakdownValue.trim();

    if (!key || !value) {
      return;
    }

    setValue(
      "technical_breakdown",
      {
        ...technicalBreakdown,
        [key]: value,
      },
      { shouldDirty: true, shouldValidate: true },
    );
    setBreakdownKey("");
    setBreakdownValue("");
  };

  const removeBreakdownItem = (key: string) => {
    const next = { ...technicalBreakdown };
    delete next[key];
    setValue("technical_breakdown", next, { shouldDirty: true, shouldValidate: true });
  };

  const uploadFiles = async (files: File[], bucketFolder: string) => {
    if (files.length === 0) {
      return [];
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const owner = user?.id ?? "admin";
    const projectKey = project?.id ?? crypto.randomUUID();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const path = [
        "projects",
        owner,
        projectKey,
        bucketFolder,
        `${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
      ].join("/");

      const { data, error } = await supabase.storage.from("project-media").upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("project-media").getPublicUrl(data.path);
      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleFeaturedUpload = async (files: File[]) => {
    setUploadingLabel("Uploading thumbnail");
    setMessage("");

    try {
      const [url] = await uploadFiles(files.slice(0, 1), "featured");
      if (url) {
        setValue("featured_image_url", url, { shouldDirty: true, shouldValidate: true });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Thumbnail upload failed.");
    } finally {
      setUploadingLabel("");
    }
  };

  const handleGalleryUpload = async (files: File[]) => {
    setUploadingLabel("Uploading gallery");
    setMessage("");

    try {
      const urls = await uploadFiles(files, "gallery");
      setValue("gallery_images", [...galleryImages, ...urls], {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gallery upload failed.");
    } finally {
      setUploadingLabel("");
    }
  };

  const handleVideoUpload = async (files: File[]) => {
    setUploadingLabel("Uploading video");
    setMessage("");

    try {
      const [url] = await uploadFiles(files.slice(0, 1), "video");
      if (url) {
        setValue("video_url", url, { shouldDirty: true, shouldValidate: true });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Video upload failed.");
    } finally {
      setUploadingLabel("");
    }
  };

  const removeGalleryImage = (url: string) => {
    setValue(
      "gallery_images",
      galleryImages.filter((imageUrl) => imageUrl !== url),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const onSubmit = async (values: ProjectFormValues) => {
    setIsSaving(true);
    setMessage("");

    const payload: ProjectInsert | ProjectUpdate = {
      category_id: nullable(values.category_id),
      display_order: values.display_order,
      featured_image_url: nullable(values.featured_image_url),
      full_description: values.full_description,
      gallery_images: values.gallery_images,
      github_url: nullable(values.github_url),
      is_featured: values.is_featured,
      live_demo_url: nullable(values.live_demo_url),
      short_description: values.short_description,
      slug: values.slug,
      status: values.status as ProjectStatus,
      tech_stack: values.tech_stack,
      technical_breakdown:
        Object.keys(values.technical_breakdown).length > 0 ? values.technical_breakdown : null,
      title: values.title,
      video_url: nullable(values.video_url),
    };

    try {
      const supabase = createClient();

      if (project?.id) {
        const { error } = await supabase.from("projects").update(payload).eq("id", project.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("projects").insert(payload as ProjectInsert);
        if (error) {
          throw error;
        }
      }

      setMessage("Project saved.");
      await onSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save project.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="grid gap-6 text-white" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[0.66rem] font-black uppercase text-[#ffd60a]">
            {project ? "Edit Project" : "New Project"}
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase leading-none">
            {project?.title ?? "Project Build Sheet"}
          </h2>
        </div>
        <label className="inline-flex items-center gap-3 border border-white/15 bg-white/[0.04] px-4 py-3 font-mono text-[0.66rem] font-black uppercase">
          <input className="size-4 accent-[#ffd60a]" type="checkbox" {...register("is_featured")} />
          Featured
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
            Title
          </span>
          <input
            className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
            {...register("title", {
              onBlur: () => {
                if (!project && !slug && title) {
                  setValue("slug", slugify(title), { shouldValidate: true });
                }
              },
            })}
          />
          {errors.title ? <span className="text-sm text-[#ffd60a]">{errors.title.message}</span> : null}
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
            Category
          </span>
          <select
            className="h-11 border border-white/15 bg-black px-3 text-sm outline-none focus:border-[#ffd60a]"
            {...register("category_id")}
          >
            <option value="">Unassigned</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
            Status
          </span>
          <select
            className="h-11 border border-white/15 bg-black px-3 text-sm outline-none focus:border-[#ffd60a]"
            {...register("status")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Short Description
        </span>
        <textarea
          className="min-h-24 resize-y border border-white/15 bg-white/[0.04] p-3 text-sm outline-none focus:border-[#ffd60a]"
          {...register("short_description")}
        />
        {errors.short_description ? (
          <span className="text-sm text-[#ffd60a]">{errors.short_description.message}</span>
        ) : null}
      </label>

      <div className="grid gap-3">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Tech Stack
        </span>
        <div className="flex gap-2">
          <input
            className="h-11 flex-1 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
            onChange={(event) => setTechInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTechnology();
              }
            }}
            placeholder="Next.js"
            value={techInput}
          />
          <button
            className="inline-flex h-11 items-center gap-2 bg-[#ffd60a] px-4 font-mono text-xs font-black uppercase text-black"
            onClick={addTechnology}
            type="button"
          >
            <Plus className="size-4" />
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {techStack.map((technology) => (
            <button
              className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-3 py-2 font-mono text-[0.66rem] font-black uppercase text-white hover:border-[#ffd60a]"
              key={technology}
              onClick={() => removeTechnology(technology)}
              type="button"
            >
              {technology}
              <X className="size-3" />
            </button>
          ))}
        </div>
        {errors.tech_stack ? (
          <span className="text-sm text-[#ffd60a]">{errors.tech_stack.message}</span>
        ) : null}
      </div>

      <label className="grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Full Markdown Description
        </span>
        <textarea
          className="min-h-72 resize-y border border-white/15 bg-white/[0.04] p-3 font-mono text-sm leading-6 outline-none focus:border-[#ffd60a]"
          {...register("full_description")}
        />
        {errors.full_description ? (
          <span className="text-sm text-[#ffd60a]">{errors.full_description.message}</span>
        ) : null}
      </label>

      <div className="grid gap-5 md:grid-cols-3">
        <FileDropzone
          accept="image/*"
          description="Drag a featured thumbnail image or select one from disk."
          disabled={Boolean(uploadingLabel)}
          label="Featured Thumbnail"
          onFiles={handleFeaturedUpload}
        />
        <FileDropzone
          accept="image/*"
          description="Upload one or more gallery images for the modal carousel."
          disabled={Boolean(uploadingLabel)}
          label="Gallery Images"
          multiple
          onFiles={handleGalleryUpload}
        />
        <FileDropzone
          accept="video/mp4,video/webm,video/quicktime"
          description="Upload MP4/WebM clips from the Video projects folder."
          disabled={Boolean(uploadingLabel)}
          label="Video Preview"
          onFiles={handleVideoUpload}
        />
      </div>

      {uploadingLabel ? (
        <p className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase text-[#ffd60a]">
          <Loader2 className="size-4 animate-spin" />
          {uploadingLabel}
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
            Featured Image URL
          </span>
          <input
            className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
            {...register("featured_image_url")}
          />
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
            Video URL
          </span>
          <input
            className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
            {...register("video_url")}
          />
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
            GitHub URL
          </span>
          <input
            className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
            {...register("github_url")}
          />
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
            Live Demo URL
          </span>
          <input
            className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
            {...register("live_demo_url")}
          />
        </label>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
            Gallery URLs
          </span>
          <ImagePlus className="size-4 text-[#ffd60a]" />
        </div>
        <div className="grid gap-2">
          {galleryImages.length === 0 ? (
            <p className="border border-white/10 p-3 text-sm text-white/45">No gallery images uploaded.</p>
          ) : (
            galleryImages.map((url) => (
              <div
                className="grid grid-cols-[1fr_auto] items-center gap-3 border border-white/10 bg-white/[0.03] p-3 text-sm"
                key={url}
              >
                <span className="truncate text-white/70">{url}</span>
                <button
                  className="text-white/60 transition hover:text-[#ffd60a]"
                  onClick={() => removeGalleryImage(url)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-3">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Technical Breakdown
        </span>
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
            onChange={(event) => setBreakdownKey(event.target.value)}
            placeholder="Architecture"
            value={breakdownKey}
          />
          <input
            className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
            onChange={(event) => setBreakdownValue(event.target.value)}
            placeholder="Next.js 14"
            value={breakdownValue}
          />
          <button
            className="h-11 bg-white px-4 font-mono text-xs font-black uppercase text-black transition hover:bg-[#ffd60a]"
            onClick={addBreakdownItem}
            type="button"
          >
            Add Metric
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {Object.entries(technicalBreakdown).map(([key, value]) => (
            <div
              className="grid grid-cols-[1fr_auto] items-center gap-3 border border-white/10 bg-white/[0.03] p-3"
              key={key}
            >
              <span className="text-sm text-white/72">
                <strong className="text-white">{key}:</strong> {value}
              </span>
              <button
                className="text-white/60 transition hover:text-[#ffd60a]"
                onClick={() => removeBreakdownItem(key)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="grid gap-2 md:max-w-xs">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Display Order
        </span>
        <input
          className="h-11 border border-white/15 bg-white/[0.04] px-3 font-mono text-sm outline-none focus:border-[#ffd60a]"
          min={0}
          type="number"
          {...register("display_order")}
        />
      </label>

      {message ? (
        <p className="border border-[#ffd60a]/40 bg-[#ffd60a]/10 p-3 text-sm font-semibold text-[#ffd60a]">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <button
            className="inline-flex h-12 items-center justify-center gap-2 bg-[#ffd60a] px-5 font-mono text-xs font-black uppercase text-black transition hover:bg-white disabled:opacity-55"
            disabled={isSaving || Boolean(uploadingLabel)}
            type="submit"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSaving ? "Saving" : "Save Project"}
          </button>
          <button
            className="h-12 border border-white/15 px-5 font-mono text-xs font-black uppercase text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>

        {project && onDelete ? (
          <button
            className="inline-flex h-12 items-center justify-center gap-2 border border-white/15 px-5 font-mono text-xs font-black uppercase text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
            disabled={isSaving}
            onClick={() => onDelete(project)}
            type="button"
          >
            <Trash2 className="size-4" />
            Delete Project
          </button>
        ) : null}
      </div>
    </form>
  );
}
