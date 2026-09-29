"use client";

import { Lock, LogIn, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AdminLoginFormProps {
  hasConfigError?: boolean;
  nextPath?: string;
}

export function AdminLoginForm({
  hasConfigError = false,
  nextPath = "/admin/dashboard",
}: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Check your credentials and try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="w-full max-w-md border border-white/15 bg-black/78 p-6 shadow-2xl backdrop-blur md:p-8"
      onSubmit={handleSubmit}
    >
      <div className="mb-8">
        <p className="font-mono text-[0.68rem] font-black uppercase text-[#ffd60a]">
          Protected CMS
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-[0.82] text-white md:text-5xl">
          Admin
          <span className="block">Control</span>
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/58">
          Sign in with the Supabase admin account to manage Prajjwol&apos;s projects,
          categories, profile telemetry, images, and video assets.
        </p>
      </div>

      <label className="grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Email
        </span>
        <span className="flex h-12 items-center gap-3 border border-white/15 bg-white/[0.04] px-3 text-white focus-within:border-[#ffd60a]">
          <Mail className="size-4 text-[#ffd60a]" />
          <input
            autoComplete="email"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-white/25"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            required
            type="email"
            value={email}
          />
        </span>
      </label>

      <label className="mt-4 grid gap-2">
        <span className="font-mono text-[0.66rem] font-black uppercase text-white/55">
          Password
        </span>
        <span className="flex h-12 items-center gap-3 border border-white/15 bg-white/[0.04] px-3 text-white focus-within:border-[#ffd60a]">
          <Lock className="size-4 text-[#ffd60a]" />
          <input
            autoComplete="current-password"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-white/25"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
            required
            type="password"
            value={password}
          />
        </span>
      </label>

      {hasConfigError && !errorMessage ? (
        <p className="mt-4 border border-[#ffd60a]/40 bg-[#ffd60a]/10 p-3 text-sm font-semibold text-[#ffd60a]">
          Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL
          and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before entering the dashboard.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 border border-[#ffd60a]/40 bg-[#ffd60a]/10 p-3 text-sm font-semibold text-[#ffd60a]">
          {errorMessage}
        </p>
      ) : null}

      <button
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 bg-[#ffd60a] px-5 font-mono text-xs font-black uppercase text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
        disabled={isSubmitting}
        type="submit"
      >
        <LogIn className="size-4" />
        {isSubmitting ? "Authenticating" : "Enter Dashboard"}
      </button>
    </form>
  );
}
