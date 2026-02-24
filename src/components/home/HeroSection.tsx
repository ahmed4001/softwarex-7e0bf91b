import { motion } from "framer-motion";
import { Search, ArrowRight, CheckCircle, Shield, TrendingUp } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative bg-foreground overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container relative z-10 py-20 md:py-28 lg:py-36">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-sm font-medium mb-8">
              <TrendingUp className="h-3.5 w-3.5" />
              #1 Software Review Platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold text-white leading-[1.08] mb-6">
              Find the right software
              <br />
              <span className="text-primary">for your team</span>
            </h1>

            <p className="text-lg md:text-xl text-white/50 mb-10 max-w-xl leading-relaxed">
              Compare features, read verified reviews, and make confident decisions. Trusted by 10,000+ professionals.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <SearchBar variant="hero" className="max-w-xl" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center gap-6 text-sm text-white/40"
          >
            {[
              { icon: CheckCircle, text: "Free to use" },
              { icon: Shield, text: "Verified reviews" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {text}
              </span>
            ))}
            <span className="text-white/20">·</span>
            <span className="text-white/40">CRM · Marketing · HR · Analytics · more</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
