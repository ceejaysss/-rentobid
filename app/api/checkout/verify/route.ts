import Stripe from "stripe";
import { type NextRequest } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return Response.json({ error: "session_id required" }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve session";
    return Response.json({ error: msg }, { status: 400 });
  }

  return Response.json({
    status: session.payment_status,          // "paid" | "unpaid" | "no_payment_required"
    creditsAdded: parseInt(session.metadata?.credits ?? "0", 10),
    userId: session.metadata?.userId ?? null,
  });
}
