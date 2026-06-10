// Admin-only: re-runs the subscription mutation logic for a stored webhook event.
// - Rate limited per admin (10 reprocesses / 5 min, 50 / hour).
// - Every attempt (allowed, denied, success, error) is recorded in paddle_reprocess_audit.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ACTIVATE_EVENTS = new Set([
  "transaction.completed",
  "subscription.activated",
  "subscription.created",
  "subscription.updated",
  "subscription.resumed",
]);
const CANCEL_EVENTS = new Set(["subscription.canceled"]);
const PAST_DUE_EVENTS = new Set(["subscription.past_due", "subscription.paused"]);

// Rate limits per admin user
const SHORT_WINDOW_MS = 5 * 60 * 1000;
const SHORT_WINDOW_MAX = 10;
const LONG_WINDOW_MS = 60 * 60 * 1000;
const LONG_WINDOW_MAX = 50;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;

  let adminUserId: string | null = null;
  let adminEmail: string | null = null;
  let eventIdForAudit = "";
  let eventTypeForAudit: string | null = null;
  let targetUserId: string | null = null;
  let planForAudit: string | null = null;

  const writeAudit = async (
    status: string,
    actions: string[] | null,
    error: string | null,
  ) => {
    try {
      await admin.from("paddle_reprocess_audit").insert({
        admin_user_id: adminUserId,
        admin_email: adminEmail,
        event_id: eventIdForAudit || "unknown",
        event_type: eventTypeForAudit,
        target_user_id: targetUserId,
        plan: planForAudit,
        status,
        actions: actions ? actions : null,
        error,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (e) {
      console.error("audit log insert failed", e);
    }
  };

  try {
    const authed = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );
    const { data: userData } = await authed.auth.getUser();
    const user = userData.user;
    if (!user) {
      await writeAudit("denied_unauthenticated", null, null);
      return json({ error: "unauthenticated" }, 401);
    }
    adminUserId = user.id;
    adminEmail = user.email ?? null;

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    const { data: isSuper } = await admin.rpc("has_role", { _user_id: user.id, _role: "superadmin" });
    if (!isAdmin && !isSuper) {
      await writeAudit("denied_forbidden", null, null);
      return json({ error: "forbidden" }, 403);
    }

    // Rate limit: count recent successful + allowed attempts for this admin
    const longSince = new Date(Date.now() - LONG_WINDOW_MS).toISOString();
    const { data: recent, error: recentErr } = await admin
      .from("paddle_reprocess_audit")
      .select("created_at,status")
      .eq("admin_user_id", user.id)
      .gte("created_at", longSince)
      .order("created_at", { ascending: false });
    if (recentErr) console.error("rate-limit lookup failed", recentErr);

    const countable = (recent ?? []).filter((r) =>
      r.status === "success" || r.status === "no_action" || r.status === "error",
    );
    const shortCutoff = Date.now() - SHORT_WINDOW_MS;
    const shortCount = countable.filter((r) => new Date(r.created_at as string).getTime() >= shortCutoff).length;
    const longCount = countable.length;

    if (shortCount >= SHORT_WINDOW_MAX || longCount >= LONG_WINDOW_MAX) {
      await writeAudit("denied_rate_limited", null,
        `short=${shortCount}/${SHORT_WINDOW_MAX} long=${longCount}/${LONG_WINDOW_MAX}`);
      return json(
        {
          error: "rate_limited",
          message: `Too many reprocess attempts. Limits: ${SHORT_WINDOW_MAX}/5min, ${LONG_WINDOW_MAX}/hour.`,
          short_count: shortCount,
          long_count: longCount,
        },
        429,
      );
    }

    const body = await req.json().catch(() => ({}));
    const event_id = body?.event_id;
    if (!event_id || typeof event_id !== "string") {
      await writeAudit("denied_bad_request", null, "event_id required");
      return json({ error: "event_id required" }, 400);
    }
    eventIdForAudit = event_id;

    const { data: evt, error: evtErr } = await admin
      .from("paddle_webhook_events")
      .select("*")
      .eq("event_id", event_id)
      .maybeSingle();
    if (evtErr) throw evtErr;
    if (!evt) {
      await writeAudit("error", null, "event not found");
      return json({ error: "event not found" }, 404);
    }
    if (!evt.payload) {
      await writeAudit("error", null, "event has no stored payload");
      return json({ error: "event has no stored payload — cannot reprocess" }, 400);
    }

    const payload: any = evt.payload;
    const eventType: string = payload?.event_type || evt.event_type || "";
    eventTypeForAudit = eventType;
    const data = payload?.data || {};
    const custom = data?.custom_data || {};
    const userId: string | undefined = custom.user_id || evt.user_id;
    const plan: string | undefined = custom.plan || evt.plan;
    targetUserId = userId ?? null;
    planForAudit = plan ?? null;
    if (!userId || !plan) {
      await writeAudit("error", null, "payload missing user_id/plan");
      return json({ error: "payload missing user_id/plan" }, 400);
    }

    const periodEnd: string | null =
      data?.current_billing_period?.ends_at || data?.billing_period?.ends_at || data?.next_billed_at || null;
    const paddleSubId: string | null = data?.subscription_id || (data?.id?.toString().startsWith("sub_") ? data.id : null);
    const paddleCustomerId: string | null = data?.customer_id || null;
    const paddlePriceId: string | null = data?.items?.[0]?.price?.id || data?.items?.[0]?.price_id || null;

    const now = new Date().toISOString();
    const actions: string[] = [];

    if (ACTIVATE_EVENTS.has(eventType)) {
      const patch: Record<string, unknown> = {
        plan, status: "active", last_event_at: now, canceled_at: null,
      };
      if (periodEnd) { patch.current_period_end = periodEnd; patch.expires_at = periodEnd; }
      if (paddleSubId) patch.paddle_subscription_id = paddleSubId;
      if (paddleCustomerId) patch.paddle_customer_id = paddleCustomerId;
      if (paddlePriceId) patch.paddle_price_id = paddlePriceId;

      let updatedId: string | null = null;
      if (paddleSubId) {
        const { data: row } = await admin
          .from("vendor_subscriptions").update(patch)
          .eq("paddle_subscription_id", paddleSubId).select("id").maybeSingle();
        updatedId = row?.id ?? null;
      }
      if (!updatedId) {
        const { data: row } = await admin
          .from("vendor_subscriptions").update(patch)
          .eq("user_id", userId).in("status", ["active", "past_due"]).select("id").maybeSingle();
        updatedId = row?.id ?? null;
      }
      if (!updatedId) {
        await admin.from("vendor_subscriptions").insert({ user_id: userId, ...patch });
        actions.push("inserted");
      } else {
        actions.push("updated");
      }
    } else if (PAST_DUE_EVENTS.has(eventType)) {
      await admin.from("vendor_subscriptions")
        .update({ status: "past_due", last_event_at: now })
        .eq("user_id", userId).eq("status", "active");
      actions.push("past_due");
    } else if (CANCEL_EVENTS.has(eventType)) {
      await admin.from("vendor_subscriptions")
        .update({ status: "canceled", canceled_at: now, last_event_at: now })
        .eq("user_id", userId).in("status", ["active", "past_due"]);
      actions.push("canceled");
    } else {
      await writeAudit("no_action", [], `event_type ${eventType} has no action`);
      return json({ ok: true, note: `event_type ${eventType} has no action` });
    }

    await writeAudit("success", actions, null);
    return json({ ok: true, event_id, event_type: eventType, user_id: userId, plan, actions });
  } catch (err: any) {
    console.error("paddle-reprocess-event error", err);
    await writeAudit("error", null, err?.message ?? String(err));
    return json({ error: err.message }, 500);
  }
});
