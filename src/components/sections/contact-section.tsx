import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactSection() {
  return (
    <section className="border-t border-border/70 bg-background/70 py-24" id="contact">
      <div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            Contact
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-normal sm:text-4xl">
            Ready for the next implementation phase.
          </h2>
        </div>
        <Button asChild size="lg">
          <a href="mailto:hello@prajjwol-bhandari.dev">
            <Mail />
            Email Prajjwol
          </a>
        </Button>
      </div>
    </section>
  );
}
