"use client";

import Image from "next/image";
import { ArrowUpRight, Pause, Play, RotateCw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, registerScrollTrigger } from "@/lib/gsap";
import type { ProjectWithCategory } from "@/types/database";
import { usePortfolioContent } from "@/components/providers/portfolio-content-provider";
import { getPageImage } from "@/data/page-media";

export function FeatureVideoSection({ project, navigationOpen = false }: {
  project?: ProjectWithCategory;
  navigationOpen?: boolean;
}) {
  const { pageMedia } = usePortfolioContent();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visible = useRef(false);
  const menuOpen = useRef(navigationOpen);
  const autoplayAllowed = useRef(false);
  const intent = useRef<"auto" | "play" | "pause">("auto");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const source = project?.video_url;

  const updatePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    if (!visible.current || document.hidden || menuOpen.current) {
      video.pause();
      setPlaying(false);
      video.muted = true;
      return;
    }
    if (intent.current === "pause" || (intent.current === "auto" && !autoplayAllowed.current)) {
      video.pause();
      setPlaying(false);
      return;
    }
    if (!video.hasAttribute("src")) video.src = source;
    void video.play().catch(() => {
      // An autoplay refusal leaves the manual Play control available.
      if (videoRef.current !== video || !visible.current || document.hidden || menuOpen.current) return;
      if (!video.error && !video.muted && intent.current !== "pause") {
        video.muted = true;
        void video.play().catch(() => undefined);
      }
    });
  }, [source]);

  useEffect(() => {
    menuOpen.current = navigationOpen;
    updatePlayback();
  }, [navigationOpen, updatePlayback]);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video || !source) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    intent.current = "auto";
    video.muted = true;
    setFailed(false);
    setPlaying(false);
    const updatePreferences = () => {
      autoplayAllowed.current = !motion.matches && !connection?.saveData;
      updatePlayback();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting && entry.intersectionRatio >= 0.35;
      updatePlayback();
    }, { threshold: [0, 0.35, 0.6] });
    observer.observe(section);
    motion.addEventListener("change", updatePreferences);
    document.addEventListener("visibilitychange", updatePlayback);
    updatePreferences();
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", updatePreferences);
      document.removeEventListener("visibilitychange", updatePlayback);
      visible.current = false;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [source, updatePlayback]);

  useEffect(() => {
    if (!registerScrollTrigger() || !sectionRef.current || !stageRef.current) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(stageRef.current, { scale: 0.86, borderRadius: 8 }, {
        scale: 1,
        borderRadius: 0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 92%",
          end: "top 12%",
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      });
    });
    return () => media.revert();
  }, []);

  function togglePlayback() {
    intent.current = videoRef.current?.paused ? "play" : "pause";
    updatePlayback();
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    if (!playing) {
      intent.current = "play";
      updatePlayback();
    } else {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) video.volume = 1;
    }
  }

  function retry() {
    setFailed(false);
    videoRef.current?.load();
    intent.current = "play";
    updatePlayback();
  }

  return (
    <section ref={sectionRef} id="featured-film" className="feature-video-section" aria-labelledby="featured-film-heading">
      <h2 id="featured-film-heading" className="sr-only">{project?.title || "A different perspective"}</h2>
      <div ref={stageRef} className="feature-video-stage">
        {source ? (
          <video
            ref={videoRef}
            className="feature-video-film"
            poster={project?.featured_image_url ?? undefined}
            aria-label={project?.title || "Featured video"}
            loop
            muted
            playsInline
            preload="none"
            onPlaying={() => {
              const video = videoRef.current;
              if (!video) return;
              if (!visible.current || document.hidden || menuOpen.current || intent.current === "pause") video.pause();
              setPlaying(!video.paused);
            }}
            onPause={() => setPlaying(Boolean(videoRef.current && !videoRef.current.paused))}
            onVolumeChange={() => setMuted(Boolean(videoRef.current?.muted || videoRef.current?.volume === 0))}
            onError={() => { setFailed(true); setPlaying(false); }}
          />
        ) : (
          <Image src={getPageImage(pageMedia, "feature_video_fallback")} alt={pageMedia.find((item) => item.key === "feature_video_fallback")?.alt_text || "Prajjwol looking across the mountains"} fill sizes="100vw" />
        )}
        {source && !failed && (
          <>
            <div className="feature-video-center">
              <button
                type="button"
                className="portfolio-cta feature-video-sound"
                onClick={toggleSound}
                aria-label={!playing ? "Play video" : muted ? "Enable video sound" : "Mute video"}
              >
                {!playing ? <Play size={21} aria-hidden /> : muted ? <Volume2 size={21} aria-hidden /> : <VolumeX size={21} aria-hidden />}
                {!playing ? "Play Video" : muted ? "Sound On" : "Sound Off"}
              </button>
            </div>
            <div className="feature-video-controls">
              <button
                type="button"
                className="portfolio-icon-button"
                onClick={togglePlayback}
                aria-label={playing ? "Pause video" : "Resume video"}
                title={playing ? "Pause video" : "Resume video"}
              >
                {playing ? <Pause size={20} aria-hidden /> : <Play size={20} aria-hidden />}
              </button>
            </div>
          </>
        )}
        {source && failed && (
          <div className="feature-video-center">
            <div className="feature-video-error">
              <p role="alert">This video could not be loaded.</p>
              <button type="button" className="portfolio-cta" onClick={retry}><RotateCw size={18} aria-hidden />Retry video</button>
              <a href={source} target="_blank" rel="noreferrer">Open the video directly <ArrowUpRight size={16} aria-hidden /></a>
            </div>
          </div>
        )}
        {!source && (
          <div className="feature-video-center">
            <a className="portfolio-cta" href="#gallery">Explore the gallery <ArrowUpRight size={18} aria-hidden /></a>
          </div>
        )}
      </div>
    </section>
  );
}
