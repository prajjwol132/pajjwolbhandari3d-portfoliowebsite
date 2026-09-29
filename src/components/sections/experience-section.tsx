import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stack = ["Next.js 14", "TypeScript", "Three.js", "GSAP", "Lenis", "Supabase"];

export function ExperienceSection() {
  return (
    <section className="container py-24" id="experience">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            Experience
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
            Engineered for fast iteration and high visual ambition.
          </h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Foundation Stack</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {stack.map((item) => (
              <span
                className="rounded-md border border-border bg-background/45 px-3 py-2 font-mono text-xs text-muted-foreground"
                key={item}
              >
                {item}
              </span>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
