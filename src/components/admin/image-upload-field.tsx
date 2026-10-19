"use client";

import Image from "next/image";
import { ImagePlus, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxBytes = 15 * 1024 * 1024;

export function isManagedImageSource(value: string) {
  const source = value.trim();
  if (source.startsWith("/media/")) return true;
  try {
    const url = new URL(source);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function ImageUploadField({
  label,
  onChange,
  storagePath,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  storagePath: string;
  value: string;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!allowedTypes.has(file.type)) {
      setError("Choose a JPEG, PNG, WebP, or AVIF image.");
      return;
    }
    if (file.size > maxBytes) {
      setError("Image must be 15 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "img";
      const path = `${storagePath}/${crypto.randomUUID()}.${extension}`;
      const { data, error: uploadError } = await supabase.storage.from("project-media")
        .upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = supabase.storage.from("project-media").getPublicUrl(data.path);
      onChange(publicUrl.publicUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const canPreview = isManagedImageSource(value);

  return (
    <div className="grid gap-3">
      <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">{label}</span>
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden border border-white/15 bg-white/[0.04]">
          {canPreview ? (
            <Image key={value} src={value} alt={`${label} preview`} fill unoptimized sizes="160px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center font-mono text-[0.6rem] uppercase text-white/35">No preview</span>
          )}
        </div>
        <div className="grid content-start gap-3">
          <label className="grid gap-2">
            <span className="font-mono text-[0.58rem] font-black uppercase text-white/40">Image URL</span>
            <input
              className="h-11 min-w-0 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
              onChange={(event) => onChange(event.target.value)}
              placeholder="Upload an image or paste a site/Supabase URL"
              value={value}
            />
          </label>
          <label
            className="inline-flex h-11 w-fit cursor-pointer items-center gap-2 border border-white/20 px-4 font-mono text-[0.62rem] font-black uppercase text-white transition hover:border-[#ffd60a] hover:text-[#ffd60a]"
            htmlFor={inputId}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {uploading ? "Uploading image" : "Choose image"}
            <input
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={uploading}
              id={inputId}
              onChange={(event) => {
                void upload(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
              type="file"
            />
          </label>
        </div>
      </div>
      {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
