"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProfileInsert, SocialLink, TelemetryMetric } from "@/types/database";

const profileSchema = z.object({
  avatar_url: z.string().trim(),
  bio: z.string().trim().min(20, "Bio must contain at least 20 characters."),
  email: z.string().trim(),
  full_name: z.string().trim().min(2, "Full name is required."),
  github_url: z.string().trim(),
  headline: z.string().trim().min(2, "Headline is required."),
  linkedin_url: z.string().trim(),
  location: z.string().trim(),
  metrics_json: z.string().trim().min(2, "Metrics JSON is required."),
  resume_url: z.string().trim(),
  social_links_json: z.string().trim().min(2, "Social links JSON is required."),
  tagline: z.string().trim(),
  title: z.string().trim(),
  website_url: z.string().trim(),
});

type ProfileSettingsValues = z.infer<typeof profileSchema>;

interface ProfileSettingsFormProps {
  onSaved?: () => Promise<void> | void;
  profile?: Profile | null;
}

const defaultMetrics: TelemetryMetric[] = [
  { detail: "Production-focused development", label: "Years Exp", value: "3+" },
  { detail: "Full-stack, CMS, 3D, and media builds", label: "Projects", value: "15+" },
  { detail: "Built around reliable delivery", label: "Client Satisfaction", value: "100%" },
  { detail: "Next.js, Supabase, GSAP, R3F", label: "Core Spec", value: "Next / Three" },
];

const defaultSocialLinks: SocialLink[] = [
  { icon: "github", label: "GitHub", url: "https://github.com/" },
  { icon: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/" },
  { icon: "mail", label: "Email", url: "mailto:hello@prajjwol-bhandari.dev" },
];

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseJsonArray<T>(value: string, guard: (entry: unknown) => entry is T, label: string) {
  const parsed = JSON.parse(value) as unknown;

  if (!Array.isArray(parsed) || !parsed.every(guard)) {
    throw new Error(`${label} must be a JSON array with the required fields.`);
  }

  return parsed;
}

function isMetric(entry: unknown): entry is TelemetryMetric {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const metric = entry as Record<string, unknown>;
  return typeof metric.label === "string" && typeof metric.value === "string";
}

function isSocialLink(entry: unknown): entry is SocialLink {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const link = entry as Record<string, unknown>;
  return typeof link.label === "string" && typeof link.url === "string";
}

function defaultValues(profile?: Profile | null): ProfileSettingsValues {
  return {
    avatar_url: profile?.avatar_url ?? "",
    bio:
      profile?.bio ??
      "Prajjwol Bhandari builds fast, cinematic web interfaces with Next.js, TypeScript, Supabase, React Three Fiber, and GSAP.",
    email: profile?.email ?? "hello@prajjwol-bhandari.dev",
    full_name: profile?.full_name ?? "Prajjwol Bhandari",
    github_url: profile?.github_url ?? "https://github.com/",
    headline: profile?.headline ?? "Full-Stack & 3D Developer",
    linkedin_url: profile?.linkedin_url ?? "https://www.linkedin.com/",
    location: profile?.location ?? "Kathmandu, Nepal",
    metrics_json: formatJson(profile?.metrics?.length ? profile.metrics : defaultMetrics),
    resume_url: profile?.resume_url ?? "/resume",
    social_links_json: formatJson(
      profile?.social_links?.length ? profile.social_links : defaultSocialLinks,
    ),
    tagline:
      profile?.tagline ??
      "I build polished web systems where backend structure, motion, and visual depth work as one product.",
    title: profile?.title ?? "Full-Stack Software Engineer / 3D Creative Developer",
    website_url: profile?.website_url ?? "https://prajjwol-bhandari.dev",
  };
}

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ProfileSettingsForm({ onSaved, profile }: ProfileSettingsFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultValues(profile),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (values: ProfileSettingsValues) => {
    setIsSaving(true);
    setMessage("");

    try {
      const metrics = parseJsonArray(values.metrics_json, isMetric, "Metrics");
      const socialLinks = parseJsonArray(values.social_links_json, isSocialLink, "Social links");
      const profileId = profile?.id ?? crypto.randomUUID();
      const payload: ProfileInsert = {
        avatar_url: nullable(values.avatar_url),
        bio: values.bio,
        email: nullable(values.email),
        full_name: values.full_name,
        github_url: nullable(values.github_url),
        headline: values.headline,
        id: profileId,
        linkedin_url: nullable(values.linkedin_url),
        location: nullable(values.location),
        metrics,
        resume_url: nullable(values.resume_url),
        social_links: socialLinks,
        tagline: nullable(values.tagline),
        title: nullable(values.title),
        website_url: nullable(values.website_url),
      };

      const supabase = createClient();
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

      if (error) {
        throw error;
      }

      setMessage("Profile settings saved.");
      await onSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="grid gap-5 text-white" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <p className="font-mono text-[0.66rem] font-black uppercase text-[#ffd60a]">
          Profile & Telemetry
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase leading-none">Driver Card CMS</h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Full Name</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("full_name")} />
          {errors.full_name ? <span className="text-sm text-[#ffd60a]">{errors.full_name.message}</span> : null}
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Headline</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("headline")} />
          {errors.headline ? <span className="text-sm text-[#ffd60a]">{errors.headline.message}</span> : null}
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Title</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("title")} />
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Location</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("location")} />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Tagline</span>
        <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("tagline")} />
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Bio</span>
        <textarea className="min-h-40 resize-y border border-white/15 bg-white/[0.04] p-3 text-sm leading-6 outline-none focus:border-[#ffd60a]" {...register("bio")} />
        {errors.bio ? <span className="text-sm text-[#ffd60a]">{errors.bio.message}</span> : null}
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Email</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("email")} />
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Resume URL</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("resume_url")} />
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">GitHub URL</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("github_url")} />
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">LinkedIn URL</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("linkedin_url")} />
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Website URL</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("website_url")} />
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Avatar URL</span>
          <input className="h-11 border border-white/15 bg-white/[0.04] px-3 text-sm outline-none focus:border-[#ffd60a]" {...register("avatar_url")} />
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Metrics JSON</span>
          <textarea className="min-h-72 resize-y border border-white/15 bg-white/[0.04] p-3 font-mono text-xs leading-5 outline-none focus:border-[#ffd60a]" spellCheck={false} {...register("metrics_json")} />
          {errors.metrics_json ? <span className="text-sm text-[#ffd60a]">{errors.metrics_json.message}</span> : null}
        </label>
        <label className="grid gap-2">
          <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">Social Links JSON</span>
          <textarea className="min-h-72 resize-y border border-white/15 bg-white/[0.04] p-3 font-mono text-xs leading-5 outline-none focus:border-[#ffd60a]" spellCheck={false} {...register("social_links_json")} />
          {errors.social_links_json ? <span className="text-sm text-[#ffd60a]">{errors.social_links_json.message}</span> : null}
        </label>
      </div>

      {message ? (
        <p className="border border-[#ffd60a]/40 bg-[#ffd60a]/10 p-3 text-sm font-semibold text-[#ffd60a]">
          {message}
        </p>
      ) : null}

      <button
        className="inline-flex h-12 w-fit items-center justify-center gap-2 bg-[#ffd60a] px-5 font-mono text-xs font-black uppercase text-black transition hover:bg-white disabled:opacity-55"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {isSaving ? "Saving Profile" : "Save Profile Settings"}
      </button>
    </form>
  );
}
