import { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function NewsletterSection() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    if (error) {
      if (error.code === "23505") toast.info("You're already subscribed!");
      else toast.error("Failed to subscribe.");
    } else {
      toast.success("You're in! Check your inbox.");
      setEmail("");
    }
  };

  return (
    <section className="py-12 md:py-14 border-t border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Weekly insights</h3>
              <p className="text-sm text-muted-foreground">New reviews, comparisons, and software tips. No spam.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@company.com"
              className="h-11 rounded-lg bg-card w-full md:w-72"
              required
            />
            <Button type="submit" className="h-11 px-6 rounded-lg font-semibold bg-primary text-primary-foreground flex-shrink-0">
              Subscribe
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
