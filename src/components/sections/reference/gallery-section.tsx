"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Expand, GripHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/smooth-scroll-provider";
import { usePortfolioContent } from "@/components/providers/portfolio-content-provider";
import { getPageImage } from "@/data/page-media";

const photographSlots = [
  { key: "gallery_photo_1", alt: "Prajjwol seated in Kathmandu" },
  { key: "gallery_photo_2", alt: "Prajjwol smiling on a stool" },
  { key: "gallery_photo_3", alt: "An evening out" },
  {
    key: "gallery_photo_4",
    alt: "Prajjwol at Surya Events",
  },
  {
    key: "gallery_photo_5",
    alt: "Prajjwol in a red jacket overlooking a mountain landscape",
  },
];

export function GallerySection() {
  const { allProjects, error, loading, pageMedia } = usePortfolioContent();
  const photographs = photographSlots.map((photo) => ({
    src: getPageImage(pageMedia, photo.key),
    alt: pageMedia.find((item) => item.key === photo.key)?.alt_text || photo.alt,
  }));
  const projectPhotos =
    error || loading
      ? []
      : allProjects.flatMap((project) =>
          project.gallery_images.map((src) => ({ src, alt: project.title })),
        );
  const photos = [
    ...photographs,
    ...projectPhotos.filter(
      (photo, index) =>
        projectPhotos.findIndex((item) => item.src === photo.src) === index,
    ),
  ];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const pointer = useRef<number | null>(null);
  const dragged = useRef(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const { start, stop } = useSmoothScroll();
  const active = index % photos.length;
  const step = (direction: number) =>
    setIndex((value) => (value + direction + photos.length) % photos.length);
  useEffect(() => {
    if (open) stop();
    return start;
  }, [open, start, stop]);
  return (
    <section
      id="gallery"
      className="portfolio-gallery"
      aria-labelledby="gallery-heading"
    >
      <h2 id="gallery-heading" className="section-ghost">
        Gallery
      </h2>
      <div className="gallery-label">
        <span className="portfolio-eyebrow gallery-count" aria-live="polite">
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(photos.length).padStart(2, "0")}
        </span>
      </div>
      <div
        className="gallery-stage"
        role="region"
        aria-roledescription="carousel"
        aria-label="Photo gallery"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            step(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
        onPointerDown={(event) => {
          pointer.current = event.clientX;
          dragged.current = false;
        }}
        onPointerUp={(event) => {
          if (
            pointer.current !== null &&
            Math.abs(event.clientX - pointer.current) > 40
          ) {
            step(event.clientX < pointer.current ? 1 : -1);
            dragged.current = true;
          }
          pointer.current = null;
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
      >
        <div className="gallery-drag-hint" aria-hidden="true">
          Drag <GripHorizontal size={17} aria-hidden="true" />
        </div>
        <div className="gallery-orbit" aria-hidden="true">
          {Array.from({ length: 7 }, (_, ray) => <span key={ray} />)}
        </div>
        {[-1, 0, 1].map((offset) => {
          const photoIndex = (active + offset + photos.length) % photos.length;
          const photo = photos[photoIndex];
          return (
            <button
              type="button"
              className={`gallery-print gallery-print-${offset === 0 ? "center" : offset === -1 ? "left" : "right"}`}
              key={`${offset}-${photo.src}`}
              aria-label={
                offset === 0
                  ? `Enlarge ${photo.alt}`
                  : offset === -1
                    ? "Previous photograph"
                    : "Next photograph"
              }
              onClick={(event) => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                if (offset === 0) {
                  opener.current = event.currentTarget;
                  setOpen(true);
                }
                else step(offset);
              }}
            >
              <Image
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 900px) 30vw, 70vw"
                draggable={false}
              />
              {offset === 0 && (
                <span className="gallery-expand">
                  <Expand size={18} />
                </span>
              )}
            </button>
          );
        })}
        <div className="gallery-dial" aria-hidden="true"><span /><span /></div>
      </div>
      <div className="gallery-controls">
        <button
          className="portfolio-icon-button"
          aria-label="Previous gallery item"
          title="Previous photograph"
          onClick={() => step(-1)}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="gallery-position" aria-hidden>
          {photos.map((photo, item) => (
            <span key={`${photo.src}-${item}`} data-active={item === active} />
          ))}
        </div>
        <button
          className="portfolio-icon-button"
          aria-label="Next gallery item"
          title="Next photograph"
          onClick={() => step(1)}
        >
          <ArrowRight size={18} />
        </button>
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="photo-lightbox-overlay" />
          <Dialog.Content
            className="photo-lightbox"
            data-lenis-prevent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              const target = opener.current?.isConnected
                ? opener.current
                : document.querySelector<HTMLButtonElement>(".gallery-print-center");
              target?.focus({ preventScroll: true });
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") step(-1);
              if (event.key === "ArrowRight") step(1);
            }}
          >
            <Dialog.Title className="sr-only">Photo gallery</Dialog.Title>
            <Dialog.Description className="lightbox-caption">
              {photos[active].alt}
            </Dialog.Description>
            <div className="lightbox-image">
              <Image
                src={photos[active].src}
                alt={photos[active].alt}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
            <Dialog.Close
              className="portfolio-icon-button lightbox-close"
              aria-label="Close photograph"
              title="Close photograph"
            >
              <X />
            </Dialog.Close>
            <button
              className="portfolio-icon-button lightbox-previous"
              onClick={() => step(-1)}
              aria-label="Previous enlarged photograph"
            >
              <ArrowLeft />
            </button>
            <button
              className="portfolio-icon-button lightbox-next"
              onClick={() => step(1)}
              aria-label="Next enlarged photograph"
            >
              <ArrowRight />
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
