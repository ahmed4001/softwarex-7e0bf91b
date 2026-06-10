import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authed = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );
    const { data: userData } = await authed.auth.getUser();
    const user = userData.user;
    if (!user) return json({ error: "unauthenticated" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // If user already has a paid active subscription, refuse to downgrade
    // silently — they must cancel via Paddle first.
    const { data: existing } = await admin
      .from("vendor_subscriptions")
      .select("id, plan, status, paddle_subscription_id")
      .eq("user_id", user.id)
      .in("status", ["active", "past_due"])
      .maybeSingle();

    if (existing) {
      if (existing.paddle_subscription_id) {
        return json(
          { error: "You have an active paid subscription. Cancel it in Paddle before switching to Free." },
          409,
        );
      }
      // already on a free row — no-op
      if (existing.plan === "free") return json({ ok: true, plan: "free" });
      await admin
        .from("vendor_subscriptions")
        .update({ plan: "free" })
        .eq("id", existing.id);
      return json({ ok: true, plan: "free" });
    }

    await admin
      .from("vendor_subscriptions")
      .insert({ user_id: user.id, plan: "free", status: "active" });

    return json({ ok: true, plan: "free" });
  } catch (err: any) {
    console.error("activate-free-plan error", err);
    return json({ error: err.message || "Failed to activate free plan" }, 500);
  }
});
