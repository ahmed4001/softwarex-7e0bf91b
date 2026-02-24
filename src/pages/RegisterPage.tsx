import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Check your email to confirm your account!");
    navigate("/login");
  };

  return (
    <>
      <SeoHead title="Create Account" />
      <div className="min-h-[80vh] flex items-center justify-center py-16 relative">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative"
        >
          <div className="text-center mb-10">
            <div className="h-14 w-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
              <span className="text-xl font-display font-black text-primary-foreground">S</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">Create account</h1>
            <p className="text-muted-foreground mt-2">Start reviewing software today</p>
          </div>
          <div className="glass-card p-8">
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" className="mt-2 h-12 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-2 h-12 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} className="mt-2 h-12 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-12 btn-premium rounded-xl text-primary-foreground font-semibold gap-2" disabled={loading}>
                {loading ? "Creating account..." : <>Get Started <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
