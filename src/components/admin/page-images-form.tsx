"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { defaultPageMedia } from "@/data/page-media";
import { ImageUploadField, isManagedImageSource } from "@/components/admin/image-upload-field";
import type { PageMedia } from "@/types/database";

function PageImageCard({
  media,
  onSave,
  saving,
}: {
  media: PageMedia;
  onSave: (media: PageMedia) => Promise<void>;
  saving: boolean;
}) {
  const fallback = defaultPageMedia.find((item) => item.key === media.key) ?? media;
  const [imageUrl, setImageUrl] = useState(media.image_url);
  const [altText, setAltText] = useState(media.alt_text);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setImageUrl(media.image_url);
    setAltText(media.alt_text);
  }, [media.image_url, media.alt_text]);

  const save = async (useDefault = false) => {
    const next = useDefault ? fallback : { ...media, image_url: imageUrl.trim(), alt_text: altText.trim() };
    if (!next.image_url || !isManagedImageSource(next.image_url)) {
      setValidationError("Upload an image or use a local /media path or HTTPS Supabase image URL.");
      return;
    }
    setValidationError("");
    await onSave(next);
  };

  return (
    <article className="grid content-start gap-4 border border-white/12 bg-white/[0.025] p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="font-mono text-[0.58rem] font-black uppercase text-[#ffd60a]">{media.key.replaceAll("_", " ")}</p>
          <h3 className="mt-1 text-lg font-black uppercase leading-tight">{media.label}</h3>
        </div>
        <span className="shrink-0 font-mono text-[0.58rem] font-black uppercase text-white/35">Image</span>
      </div>

      <ImageUploadField
        label="Page image"
        onChange={setImageUrl}
        storagePath={`page-images/${media.key}`}
        value={imageUrl}
      />

      <label className="grid gap-2">
        <span className="font-mono text-[0.62rem] font-black uppercase text-white/50">Alternative text</span>
        <input
          className="h-10 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]"
          onChange={(event) => setAltText(event.target.value)}
          value={altText}
        />
      </label>
      {validationError ? <p role="alert" className="text-sm text-rose-300">{validationError}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex h-10 items-center gap-2 bg-[#ffd60a] px-4 font-mono text-[0.62rem] font-black uppercase text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-55"
          disabled={saving}
          onClick={() => void save()}
          type="button"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving" : "Save image"}
        </button>
        <button
          className="inline-flex h-10 items-center gap-2 border border-white/15 px-3 font-mono text-[0.6rem] font-black uppercase text-white/70 transition hover:border-white hover:text-white disabled:opacity-45"
          disabled={saving || (imageUrl === fallback.image_url && altText === fallback.alt_text)}
          onClick={() => void save(true)}
          type="button"
        >
          <RotateCcw className="size-3.5" /> Reset to original
        </button>
      </div>
    </article>
  );
}

export function PageImagesForm({
  media,
  onSave,
  savingKey,
}: {
  media: PageMedia[];
  onSave: (media: PageMedia) => Promise<void>;
  savingKey: string | null;
}) {
  const groups = [
    { title: "Home & brand", keys: ["hero_room_background", "hero_character_poster", "brand_logo"] },
    { title: "About composition", keys: ["about_photo_1", "about_photo_2", "about_photo_3", "about_photo_4"] },
    { title: "My story", keys: ["history_foundation", "history_edit", "history_motion_ai", "history_beyond_views", "history_beyond_edit"] },
    { title: "Film & gallery", keys: ["feature_video_fallback", "gallery_photo_1", "gallery_photo_2", "gallery_photo_3", "gallery_photo_4", "gallery_photo_5"] },
  ];

  return (
    <section className="grid gap-8">
      <header>
        <p className="font-mono text-[0.66rem] font-black uppercase text-[#ffd60a]">Page content</p>
        <h2 className="mt-2 text-3xl font-black uppercase leading-none">Page Images</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
          Replace fixed images used across the portfolio. Uploads are saved to Supabase Storage; project covers and project galleries are managed in Projects.
        </p>
      </header>

      {groups.map((group) => (
        <section className="grid gap-4" key={group.title} aria-label={group.title}>
          <h3 className="border-b border-white/15 pb-2 font-mono text-xs font-black uppercase text-white/70">{group.title}</h3>
          <div className="grid gap-4 xl:grid-cols-2">
            {group.keys.map((key) => {
              const item = media.find((entry) => entry.key === key) ?? defaultPageMedia.find((entry) => entry.key === key);
              if (!item) return null;
              return (
                <PageImageCard
                  key={item.key}
                  media={item}
                  onSave={onSave}
                  saving={savingKey === item.key}
                />
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
