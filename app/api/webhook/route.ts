import Stripe from "stripe";
import { supabaseServer } from "../../lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("[webhook] Missing stripe-signature header");
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("[webhook] Signature verification failed:", msg);
    return new Response(`Webhook error: ${msg}`, { status: 400 });
  }

  console.log("[webhook] Received event:", event.type, event.id);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const creditsToAdd = parseInt(session.metadata?.credits ?? "0", 10);

    if (!userId || creditsToAdd <= 0) {
      console.error("[webhook] Invalid metadata — userId:", userId, "credits:", creditsToAdd);
      return new Response("Invalid session metadata", { status: 400 });
    }

    console.log("[webhook] Processing credit grant — userId:", userId, "creditsToAdd:", creditsToAdd);

    const { data: existing, error: readError } = await supabaseServer
      .from("user_credits")
      .select("credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (readError) {
      console.error("[webhook] DB read error:", readError.message);
      return new Response("Database read error: " + readError.message, { status: 500 });
    }

    const current = existing?.credits ?? 0;
    const next = current + creditsToAdd;

    console.log("[webhook] Credit balance:", current, "→", next, "for userId:", userId);

    const { error: writeError } = await supabaseServer
      .from("user_credits")
      .upsert(
        { user_id: userId, credits: next, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (writeError) {
      console.error("[webhook] DB write error:", writeError.message, "userId:", userId);
      return new Response("Database write error: " + writeError.message, { status: 500 });
    }

    console.log("[webhook] ✓ Credits updated — userId:", userId, "new balance:", next);
  }

  return new Response("OK", { status: 200 });
}
