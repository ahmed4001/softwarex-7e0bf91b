import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, CreditCard, Sparkles, Crown, Zap } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    icon: Zap,
    description: "Get started with basic vendor tools",
    features: [
      { label: "Basic product listing", included: true },
      { label: "Review responses", included: true },
      { label: "Lead capture (5/mo)", included: true },
      { label: "Sponsored placements", included: false },
      { label: "Advanced analytics", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    icon: CreditCard,
    description: "For growing vendors seeking leads",
    features: [
      { label: "Enhanced product listing", included: true },
      { label: "Review responses", included: true },
      { label: "Lead capture (50/mo)", included: true },
      { label: "Bronze sponsored slots", included: true },
      { label: "Basic analytics", included: true },
      { label: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    popular: true,
    icon: Sparkles,
    description: "Full suite for serious vendors",
    features: [
      { label: "Premium product listing", included: true },
      { label: "Review responses + templates", included: true },
      { label: "Unlimited lead capture", included: true },
      { label: "Silver sponsored slots", included: true },
      { label: "Advanced analytics + ROI", included: true },
      { label: "Priority support", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    icon: Crown,
    description: "Maximum visibility and support",
    features: [
      { label: "Premium product listing", included: true },
      { label: "Review responses + templates", included: true },
      { label: "Unlimited lead capture", included: true },
      { label: "Gold sponsored slots", included: true },
      { label: "Full analytics suite", included: true },
      { label: "Dedicated priority support", included: true },
    ],
  },
];

export default function VendorPlansPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ["vendor-subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
  });

  const currentPlan = subscription?.plan || "free";

  const selectPlan = useMutation({
    mutationFn: async (plan: string) => {
      if (subscription) {
        const { error } = await supabase
          .from("vendor_subscriptions")
          .update({ plan })
          .eq("id", subscription.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vendor_subscriptions")
          .insert({ user_id: user!.id, plan });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Plan updated!");
      queryClient.invalidateQueries({ queryKey: ["vendor-subscription"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-1">Choose the right plan for your business</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${plan.popular ? "ring-2 ring-primary shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground font-semibold">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${f.included ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
                      <Check className={`h-4 w-4 flex-shrink-0 ${f.included ? "text-primary" : "text-muted-foreground/30"}`} />
                      {f.label}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-xl ${isCurrent ? "" : plan.popular ? "btn-premium text-primary-foreground" : ""}`}
                  variant={isCurrent ? "outline" : plan.popular ? "default" : "secondary"}
                  disabled={isCurrent || selectPlan.isPending}
                  onClick={() => selectPlan.mutate(plan.id)}
                >
                  {isCurrent ? "Current Plan" : "Select Plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
