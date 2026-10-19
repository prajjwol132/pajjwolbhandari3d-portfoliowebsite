"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Download, Expand, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/smooth-scroll-provider";
import { usePortfolioContent } from "@/components/providers/portfolio-content-provider";
import collection from "@/data/about-photos.json";

const portraits = [
  { id: "1b2f4686abf5", alt: "Prajjwol seated outdoors in a plaid blazer" },
  { id: "d462b6136b07", alt: "Prajjwol at Surya Events" },
  { id: "5a2d5930e3aa", alt: "An evening portrait of Prajjwol" },
  { id: "d0142608e030", alt: "Prajjwol seated on a stool, smiling at the camera" },
];
export function AboutPhotoComposition() {
  const { pageMedia } = usePortfolioContent();
  const photos = portraits.flatMap((portrait, index) => {
    const photo = collection.find(({ id }) => id === portrait.id);
    if (!photo) return [];
    const saved = pageMedia.find((item) => item.key === `about_photo_${index + 1}`);
    return [{
      ...photo,
      src: saved?.image_url || photo.src,
      alt: saved?.alt_text || portrait.alt,
    }];
  });
  const [selected, setSelected] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const { stop, start } = useSmoothScroll();
  const open = selected !== null;
  const active = selected === null ? null : photos[selected];

  useEffect(() => {
    if (open) stop();
    return start;
  }, [open, start, stop]);

  function step(direction: number) {
    setSelected((value) =>
      value === null
        ? null
        : (value + direction + photos.length) % photos.length,
    );
  }

  return (
    <>
      <div className="manifesto-composition">
        <div className="manifesto-message">
          <h2 id="about-heading">
            It starts with an idea.
            <br />
            I bring it <span>to life.</span>
            <br />
            With rhythm and motion.
            <br />
            A story worth watching.
            <br />
            Every frame, every sound,
            <br />
            every small detail.
            <br />
            Made to connect.
            <br />
            <span>Built to be remembered.</span>
          </h2>
        </div>
        {photos.map((photo, index) => (
          <button
            className={`manifesto-photo manifesto-photo-${index + 1}`}
            key={photo.id}
            type="button"
            data-photo-id={photo.id}
            aria-label={`Open photograph ${index + 1} of ${photos.length}`}
            onClick={(event) => {
              opener.current = event.currentTarget;
              setSelected(index);
            }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              quality={95}
              sizes="(min-width: 1024px) 200px, (min-width: 768px) 150px, 120px"
            />
            <span className="manifesto-photo-expand" aria-hidden>
              <Expand size={16} />
            </span>
          </button>
        ))}
      </div>
      <Dialog.Root
        open={open}
        onOpenChange={(value) => {
          if (!value) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="photo-lightbox-overlay" />
          <Dialog.Content
            className="photo-lightbox about-photo-lightbox"
            data-lenis-prevent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener.current?.focus({ preventScroll: true });
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                step(event.key === "ArrowRight" ? 1 : -1);
              }
            }}
          >
            <Dialog.Title className="sr-only">
              Personal photo collection
            </Dialog.Title>
            <Dialog.Description className="lightbox-caption" aria-live="polite">
              Photograph {(selected ?? 0) + 1} / {photos.length}
            </Dialog.Description>
            {active && (
              <>
                <div className="lightbox-image">
                  <Image
                    src={active.src}
                    alt={active.alt}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <a
                  className="portfolio-icon-button about-photo-download"
                  href={active.src}
                  download
                  aria-label="Download original photograph"
                  title="Download original photograph"
                >
                  <Download size={19} />
                </a>
              </>
            )}
            <Dialog.Close
              className="portfolio-icon-button lightbox-close"
              aria-label="Close photograph"
              title="Close photograph"
            >
              <X />
            </Dialog.Close>
            <button
              type="button"
              className="portfolio-icon-button lightbox-previous"
              onClick={() => step(-1)}
              aria-label="Previous photograph"
              title="Previous photograph"
            >
              <ArrowLeft />
            </button>
            <button
              type="button"
              className="portfolio-icon-button lightbox-next"
              onClick={() => step(1)}
              aria-label="Next photograph"
              title="Next photograph"
            >
              <ArrowRight />
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
