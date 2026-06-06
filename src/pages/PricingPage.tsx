import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, Star, Rocket, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    icon: Zap,
    accent: "text-emerald-500",
    bgAccent: "bg-emerald-500/10",
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
    bgAccent: "bg-blue-500/10",
    description: "Stand out with more visibility",
    features: [
      "Featured badge on listing",
      "Higher ranking in category",
      "Increased visibility in search results",
      "Basic social media mention",
      'Inclusion in "New & Featured Tools" section',
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
    bgAccent: "bg-purple-500/10",
    description: "Amplify reach across channels",
    features: [
      "Everything in Featured",
      "Top category placement",
      'Featured in "best tools" pages',
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
    bgAccent: "bg-rose-500/10",
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

export default function PricingPage() {
  return (
    <>
      <SeoHead
        title="Pricing Plans | ReviewHunts"
        description="Choose the right plan to grow your product on ReviewHunts. From Free listings to Premium promotions."
        canonicalUrl="/pricing"
      />

      <div className="container py-16 md:py-24">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
            Pricing Plans
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose the right plan to grow your product on ReviewHunts. Start free and scale as you grow.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all hover:shadow-lg ${
                  plan.popular ? "ring-2 ring-primary shadow-xl" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-3">
                  <div
                    className={`mx-auto h-12 w-12 rounded-2xl ${plan.bgAccent} flex items-center justify-center mb-3`}
                  >
                    <Icon className={`h-6 w-6 ${plan.accent}`} />
                  </div>
                  <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-display font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground ml-1">/month</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pt-0">
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full rounded-xl font-semibold ${
                      plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to={`/choose-plan?plan=${plan.id}`}>
                      {plan.price === 0 ? "Get Started Free" : "Choose Plan"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Bottom CTA */}
        <div className="mt-20 text-center max-w-xl mx-auto">
          <h2 className="text-xl font-display font-semibold mb-3">Need a custom plan?</h2>
          <p className="text-muted-foreground mb-6">
            Contact us for enterprise pricing, bulk listings, or tailored promotion packages.
          </p>
          <Button variant="outline" asChild>
            <Link to="/contact">Contact Sales</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
