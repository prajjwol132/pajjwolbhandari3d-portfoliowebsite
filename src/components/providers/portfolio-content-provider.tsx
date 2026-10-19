"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useProjects } from "@/hooks/use-projects";
import { createClient } from "@/lib/supabase/client";
import type { PageMedia, Profile } from "@/types/database";

import { defaultProfile } from "@/data/portfolio-profile";
import { defaultPageMedia, mergePageMedia } from "@/data/page-media";

type PortfolioContent = ReturnType<typeof useProjects> & { profile: Profile; pageMedia: PageMedia[] };
const PortfolioContext = createContext<PortfolioContent | null>(null);

export function PortfolioContentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const projects = useProjects();
  const [profile, setProfile] = useState(defaultProfile);
  const [pageMedia, setPageMedia] = useState(defaultPageMedia);
  useEffect(() => {
    const abort = new AbortController();
    const timeout = window.setTimeout(() => abort.abort(), 5000);
    async function load() {
      try {
        const client = createClient();
        const [profileResponse, pageMediaResponse] = await Promise.all([
          client
            .from("profiles")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(1)
            .abortSignal(abort.signal)
            .maybeSingle(),
          client
            .from("page_media")
            .select("*")
            .order("display_order", { ascending: true })
            .abortSignal(abort.signal),
        ]);
        if (!profileResponse.error && profileResponse.data && !abort.signal.aborted) {
          setProfile({
            ...defaultProfile,
            ...profileResponse.data,
            metrics: Array.isArray(profileResponse.data.metrics) ? profileResponse.data.metrics : [],
            social_links: Array.isArray(profileResponse.data.social_links)
              ? profileResponse.data.social_links
              : [],
          });
        }
        if (!pageMediaResponse.error && !abort.signal.aborted) {
          setPageMedia(mergePageMedia(pageMediaResponse.data));
        }
      } catch {
        // Local content keeps the public portfolio usable while the CMS is unavailable.
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      abort.abort();
      window.clearTimeout(timeout);
    };
  }, []);
  return (
    <PortfolioContext.Provider value={{ ...projects, pageMedia, profile }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContent() {
  const content = useContext(PortfolioContext);
  if (!content) throw new Error("PortfolioContentProvider is required.");
  return content;
}
