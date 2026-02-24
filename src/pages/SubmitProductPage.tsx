import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const submissionSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(100),
  website_url: z.string().trim().url("Please enter a valid URL"),
  tagline: z.string().trim().min(5, "Tagline must be at least 5 characters").max(200),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000),
  category_id: z.string().uuid("Please select a category"),
  pricing_model: z.enum(["free", "freemium", "paid", "subscription", "one-time"]),
  company_name: z.string().trim().min(2, "Company name is required").max(100),
  contact_email: z.string().trim().email("Please enter a valid email"),
});

type SubmissionForm = z.infer<typeof submissionSchema>;

const SITE_URL = "https://softwarehub.com";

export default function SubmitProductPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SubmissionForm, string>>>({});

  const [form, setForm] = useState<SubmissionForm>({
    name: "",
    website_url: "",
    tagline: "",
    description: "",
    category_id: "",
    pricing_model: "freemium",
    company_name: "",
    contact_email: "",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: categories } = useQuery({
    queryKey: ["categories-for-submit"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const updateField = (field: keyof SubmissionForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = submissionSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SubmissionForm, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof SubmissionForm;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }

    if (!user) {
      toast.error("Please sign in to submit a product");
      navigate("/login");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("vendor_submissions").insert({
      user_id: user.id,
      product_data: result.data as any,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Product submitted! We'll review it within 2–3 business days.");
    navigate("/");
  };

  if (authChecked && !user) {
    return (
      <>
        <SeoHead title="Submit Your Product" description="Sign in to submit your software product on SoftwareHub." />
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-16 text-center">
          <Upload className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to submit your product</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create a free account or sign in to list your software on SoftwareHub and reach thousands of B2B buyers.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="outline">Sign In</Button></Link>
            <Link to="/register"><Button className="bg-primary text-primary-foreground">Create Account</Button></Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title="Submit Your Software Product"
        description="List your SaaS product on SoftwareHub. Reach B2B buyers, collect verified reviews, and grow your software business. Free to submit."
        keywords="submit software, list SaaS product, software directory listing, vendor submission, B2B software listing"
        canonicalUrl={`${SITE_URL}/submit-product`}
      />

      <main className="container py-10 max-w-2xl">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="opacity-30">/</span>
          <span className="text-foreground font-medium">Submit Product</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Submit Your Software Product</h1>
          <p className="text-muted-foreground mb-8">
            Fill in the details below. Our team reviews every submission and publishes approved products within 2–3 business days.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <FormField label="Product Name" error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Acme CRM"
                className="h-11"
              />
            </FormField>

            {/* Website URL */}
            <FormField label="Website URL" error={errors.website_url}>
              <Input
                value={form.website_url}
                onChange={(e) => updateField("website_url", e.target.value)}
                placeholder="https://yourproduct.com"
                className="h-11"
              />
            </FormField>

            {/* Tagline */}
            <FormField label="Tagline" error={errors.tagline} hint="A short one-liner for your product">
              <Input
                value={form.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
                placeholder="e.g. The CRM that closes deals faster"
                className="h-11"
              />
            </FormField>

            {/* Category */}
            <FormField label="Category" error={errors.category_id}>
              <Select value={form.category_id} onValueChange={(v) => updateField("category_id", v)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Pricing Model */}
            <FormField label="Pricing Model" error={errors.pricing_model}>
              <Select value={form.pricing_model} onValueChange={(v) => updateField("pricing_model", v)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="freemium">Freemium</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="one-time">One-Time Purchase</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {/* Description */}
            <FormField label="Product Description" error={errors.description} hint="Describe what your product does and who it's for">
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Tell us about your software product, its key features, and target audience..."
                rows={5}
              />
            </FormField>

            {/* Company Name */}
            <FormField label="Company Name" error={errors.company_name}>
              <Input
                value={form.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                placeholder="e.g. Acme Inc."
                className="h-11"
              />
            </FormField>

            {/* Contact Email */}
            <FormField label="Contact Email" error={errors.contact_email}>
              <Input
                type="email"
                value={form.contact_email}
                onChange={(e) => updateField("contact_email", e.target.value)}
                placeholder="vendor@company.com"
                className="h-11"
              />
            </FormField>

            <div className="pt-4 flex items-center gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground rounded-xl font-semibold gap-2 h-12 px-8"
              >
                {loading ? "Submitting..." : <>Submit Product <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p>
                By submitting, you agree that the information is accurate. Our team reviews every submission to ensure quality. Basic listings are free.
              </p>
            </div>
          </form>
        </motion.div>
      </main>
    </>
  );
}

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
