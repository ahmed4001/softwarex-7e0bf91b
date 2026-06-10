import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Zap, Star, Rocket, Crown } from "lucide-react";
import { VendorBillingStatusWidget } from "@/components/vendor/VendorBillingStatusWidget";
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
      "Increased visibility in search results",
      "Basic social media mention",
      "Inclusion in \"New & Featured Tools\" section",
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
      "Social media promotion (posts & mentions)",
      "Newsletter mention",
      "YouTube promotion (video mention or inclusion)",
      "Basic performance tracking (views & clicks)",
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
      "Top priority ranking across categories",
      "Featured in comparison pages (X vs Y, alternatives)",
      "Dedicated YouTube promotion (full or highlighted inclusion)",
      "Strong social media promotion (multiple platforms)",
      "Enhanced brand highlight (logo, banner, CTA)",
      "Monthly performance report (views, clicks, engagement)",
      "Priority support and fast updates",
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
      if (plan === "free") {
        const { data, error } = await supabase.functions.invoke("activate-free-plan");
        if (error || (data as any)?.error) {
          throw new Error((data as any)?.error || error?.message || "Failed");
        }
        return { redirect: null as string | null };
      }
      // Paid plan: route to Paddle checkout — DB row is created by webhook.
      return { redirect: `/checkout?plan=${plan}` };
    },
    onSuccess: (result) => {
      if (result.redirect) {
        window.location.href = result.redirect;
      } else {
        toast.success("Plan updated!");
        queryClient.invalidateQueries({ queryKey: ["vendor-subscription"] });
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Pricing</h1>
        <p className="text-muted-foreground mt-1">Choose the right plan to grow on ReviewHunts</p>
      </div>

      <div className="mb-8">
        <VendorBillingStatusWidget />
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
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                      <span>{f}</span>
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
