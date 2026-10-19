import type { Metadata } from "next";
import { ReferencePortfolioPage } from "@/components/sections/reference-portfolio-page";

export const metadata: Metadata = {
  title: "Character Preview",
  robots: { index: false, follow: false },
};

export default function CharacterPreview() {
  return <ReferencePortfolioPage characterPreview />;
}
