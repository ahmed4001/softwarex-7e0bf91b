import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap, Star, Rocket, Crown, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeoHead } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    icon: Zap,
    accent: "text-emerald-500",
    description: "Get listed and discovered",
    features: [
      "Basic product listing",
      "Category placement",
      "Indexed on Google",
      "Discoverable on ReviewHunts",
    ],
  },
  {
    id: "featured",
    name: "Featured",
    price: 29,
    icon: Star,
    accent: "text-blue-500",
    description: "Stand out with more visibility",
    features: [
      "Featured badge on listing",
      "Higher ranking in category",
      "Increased visibility in search",
      "Inclusion in \"New & Featured Tools\"",
      "More clicks and exposure",
    ],
  },
  {
    id: "promotion",
    name: "Promotion",
    price: 99,
    popular: true,
    icon: Rocket,
    accent: "text-purple-500",
    description: "Amplify reach across channels",
    features: [
      "Everything in Featured",
      "Top category placement",
      "Featured in \"best tools\" pages",
      "Social media + newsletter mention",
      "YouTube promotion",
      "Performance tracking",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 199,
    icon: Crown,
    accent: "text-rose-500",
    description: "Maximum exposure and priority",
    features: [
      "Everything in Promotion",
      "Homepage featured placement",
      "Top priority ranking",
      "Comparison page features",
      "Dedicated YouTube promotion",
      "Monthly performance report",
      "Priority support",
    ],
  },
];

export default function ChoosePlanPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const submitted = params.get("submitted") === "1";
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelect = async (planId: string) => {
    if (!user) {
      navigate("/login?redirect=/choose-plan");
      return;
    }
    setSelecting(planId);
    try {
      if (planId === "free") {
        const { data, error } = await supabase.functions.invoke("activate-free-plan");
        if (error || (data as any)?.error) {
          throw new Error((data as any)?.error || error?.message || "Failed");
        }
        toast.success("You're on the Free plan. Welcome aboard!");
        navigate("/dashboard");
      } else {
        // Paid plans MUST flow through Paddle. The webhook is the only writer
        // for vendor_subscriptions paid rows.
        toast.success(`${planId.charAt(0).toUpperCase() + planId.slice(1)} plan selected — redirecting to checkout`);
        navigate(`/checkout?plan=${planId}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSelecting(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <SeoHead title="Choose Your Plan — ReviewHunts" description="Pick a plan to launch your product on ReviewHunts. Free, Featured, Promotion or Premium." />
      <div className="min-h-[80vh] py-12 md:py-16 relative">
        <div className="absolute inset-0 mesh-gradient opacity-20" />
        <div className="container max-w-6xl relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            {submitted && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4">
                <CheckCircle2 className="h-3.5 w-3.5" /> Product submitted successfully
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-display font-bold">Choose your plan</h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Start free or unlock more visibility, promotion and priority support. You can upgrade or downgrade anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isLoading = selecting === plan.id;
              return (
                <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? "ring-2 ring-primary shadow-lg" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground font-semibold">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                      <Icon className={`h-5 w-5 ${plan.accent}`} />
                    </div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                    <div className="mt-3">
                      <span className="text-3xl font-display font-bold">${plan.price}</span>
                      {plan.price > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSelect(plan.id)}
                      disabled={isLoading}
                      className={`w-full rounded-xl gap-2 ${plan.popular ? "btn-premium text-primary-foreground" : ""}`}
                      variant={plan.popular ? "default" : plan.id === "free" ? "outline" : "secondary"}
                    >
                      {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : plan.price === 0 ? <>Continue with Free <ArrowRight className="h-4 w-4" /></> : <>Get {plan.name} <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Not sure yet?{" "}
            <Link to="/dashboard" className="text-primary hover:underline font-medium">
              Skip for now and decide later
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
