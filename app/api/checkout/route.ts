import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

const stripe = new Stripe(stripeKey);

const PACKAGES = {
  credits_10:  { credits: 10,  amount: 500,  label: "10 Bid Credits"  },
  credits_50:  { credits: 50,  amount: 2000, label: "50 Bid Credits"  },
  credits_100: { credits: 100, amount: 3500, label: "100 Bid Credits" },
} as const;

type PackageId = keyof typeof PACKAGES;

export async function POST(request: Request) {
  let body: { packageId?: string; userId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { packageId, userId } = body;

  if (!packageId || !(packageId in PACKAGES)) {
    return Response.json({ error: "Invalid package" }, { status: 400 });
  }
  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  const pkg = PACKAGES[packageId as PackageId];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: pkg.amount,
            product_data: { name: pkg.label, description: "RentoBid auction credits" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        credits: String(pkg.credits),
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/listings`,
    });

    if (!session.url) {
      console.error("[checkout] Stripe session created but url is null — session id:", session.id);
      return Response.json({ error: "checkout_failed" }, { status: 500 });
    }

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] stripe.checkout.sessions.create failed:", err);
    return Response.json({ error: "checkout_failed" }, { status: 500 });
  }
}
