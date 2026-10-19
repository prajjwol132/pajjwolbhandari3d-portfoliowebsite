import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultProfile } from "@/data/portfolio-profile";

const skills = [
  "Video Editing",
  "Motion Graphics",
  "AI Video Ads",
  "Premiere Pro",
  "DaVinci Resolve",
  "Social-Media Analysis",
  "Marketing",
  "Web Development",
  "React",
  "Tailwind CSS",
];

export default function ResumePage() {
  return (
    <main className="min-h-screen bg-[#030407] px-4 py-24 text-white">
      <div className="mx-auto max-w-4xl">
        <Button asChild className="rounded-none" variant="outline">
          <Link href="/">
            <ArrowLeft />
            Back
          </Link>
        </Button>

        <section className="mt-10 border border-white/12 bg-black/42 p-6 backdrop-blur-md sm:p-10">
          <p className="font-mono text-sm font-black uppercase tracking-normal text-[#ffd60a]">
            Resume
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-normal sm:text-6xl">
            Prajjwol Bhandari
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
            {defaultProfile.headline}. {defaultProfile.bio}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="border border-white/10 p-4">
              <div className="font-mono text-2xl font-black">21</div>
              <div className="mt-2 text-sm text-zinc-400">Years old</div>
            </div>
            <div className="border border-white/10 p-4">
              <div className="font-mono text-2xl font-black">4th</div>
              <div className="mt-2 text-sm text-zinc-400">IT semester</div>
            </div>
            <div className="border border-white/10 p-4">
              <div className="font-mono text-2xl font-black">Video</div>
              <div className="mt-2 text-sm text-zinc-400">Primary creative focus</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                className="border border-white/20 px-3 py-2 text-sm font-semibold text-zinc-200"
                key={skill}
              >
                {skill}
              </span>
            ))}
          </div>

          <Button asChild className="mt-8 rounded-none bg-[#ffd60a] text-black hover:bg-yellow-400">
            <a href={`mailto:${defaultProfile.email}?subject=Prajjwol%20Bhandari%20Resume`}>
              <Download />
              Request PDF
            </a>
          </Button>
        </section>
      </div>
    </main>
  );
}
