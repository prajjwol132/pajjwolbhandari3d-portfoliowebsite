import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const skills = [
  "Next.js",
  "TypeScript",
  "React Three Fiber",
  "GSAP",
  "Supabase",
  "PostgreSQL",
  "Tailwind CSS",
  "Node.js",
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
          <p className="font-mono text-sm font-black uppercase tracking-normal text-red-300">
            Resume
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-normal sm:text-6xl">
            Prajjwol Bhandari
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
            Full-stack and 3D web developer focused on interactive products,
            performant frontend systems, immersive WebGL interfaces, and typed
            backend integrations.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="border border-white/10 p-4">
              <div className="font-mono text-2xl font-black">10+</div>
              <div className="mt-2 text-sm text-zinc-400">Projects Built</div>
            </div>
            <div className="border border-white/10 p-4">
              <div className="font-mono text-2xl font-black">3+</div>
              <div className="mt-2 text-sm text-zinc-400">Years Experience</div>
            </div>
            <div className="border border-white/10 p-4">
              <div className="font-mono text-2xl font-black">100%</div>
              <div className="mt-2 text-sm text-zinc-400">Custom Code</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                className="border border-red-500/30 bg-red-600/10 px-3 py-2 text-sm font-semibold text-red-100"
                key={skill}
              >
                {skill}
              </span>
            ))}
          </div>

          <Button asChild className="mt-8 rounded-none bg-red-600 hover:bg-red-500">
            <a href="mailto:hello@prajjwol-bhandari.dev?subject=Prajjwol%20Bhandari%20Resume">
              <Download />
              Request PDF
            </a>
          </Button>
        </section>
      </div>
    </main>
  );
}
