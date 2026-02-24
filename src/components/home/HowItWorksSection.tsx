import { motion } from "framer-motion";
import { Search, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "1",
    title: "Search & discover",
    desc: "Browse categories or search by name. Filter by pricing, rating, company size, and features.",
    icon: Search,
  },
  {
    step: "2",
    title: "Compare & read reviews",
    desc: "See side-by-side comparisons with real reviews from verified users at real companies.",
    icon: BarChart3,
  },
  {
    step: "3",
    title: "Make a decision",
    desc: "Choose the best tool with confidence. Visit the vendor, start a trial, or save for later.",
    icon: ArrowRight,
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-24 bg-muted/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-primary mb-2">How it works</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Three steps to the right tool
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex h-12 w-12 rounded-xl bg-primary/10 items-center justify-center mb-5">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-wider mb-2">
                Step {s.step}
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
