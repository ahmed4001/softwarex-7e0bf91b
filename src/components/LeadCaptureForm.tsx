import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  company: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional(),
});

interface LeadCaptureFormProps {
  productId: string;
  vendorUserId: string;
  productName: string;
}

export function LeadCaptureForm({ productId, vendorUserId, productName }: LeadCaptureFormProps) {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      const { data: insertedLead, error } = await supabase.from("vendor_leads").insert({
        product_id: productId,
        vendor_user_id: vendorUserId,
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company || null,
        message: parsed.data.message || null,
      }).select("id").single();
      if (error) throw error;
      setSubmitted(true);

      // Fire-and-forget vendor email notification
      if (insertedLead?.id) {
        supabase.functions.invoke("notify-vendor-lead", {
          body: { leadId: insertedLead.id },
        }).catch((err) => console.error("Lead notification failed:", err));
      }
      toast.success("Your inquiry has been sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="font-semibold text-foreground">Thanks!</p>
          <p className="text-sm text-muted-foreground mt-1">The vendor will get back to you soon.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          Contact Vendor
        </CardTitle>
        <p className="text-xs text-muted-foreground">Get a quote or more info about {productName}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input className="rounded-lg h-9 text-sm" placeholder="Your name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input className="rounded-lg h-9 text-sm" type="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <Label className="text-xs">Company</Label>
            <Input className="rounded-lg h-9 text-sm" placeholder="Optional" value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea className="rounded-lg text-sm min-h-[60px]" placeholder="Tell us what you need..." value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full rounded-lg" disabled={submitting}>
            {submitting ? "Sending..." : "Send Inquiry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
