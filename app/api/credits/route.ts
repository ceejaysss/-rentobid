import { type NextRequest } from "next/server";
import { supabaseServer } from "../../lib/supabase-server";

const DEFAULT_CREDITS = 10;

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // New users haven't been inserted yet — seed with the default
  if (!data) {
    await supabaseServer.from("user_credits").insert({
      user_id: userId,
      credits: DEFAULT_CREDITS,
      updated_at: new Date().toISOString(),
    });
    return Response.json({ credits: DEFAULT_CREDITS });
  }

  return Response.json({ credits: data.credits });
}

export async function POST(request: NextRequest) {
  const { userId } = await request.json();
  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  const { data, error: fetchError } = await supabaseServer
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 500 });
  }

  const current = data?.credits ?? DEFAULT_CREDITS;
  if (current < 1) {
    return Response.json({ error: "No credits remaining", credits: 0 }, { status: 402 });
  }

  const { data: updated, error: updateError } = await supabaseServer
    .from("user_credits")
    .upsert(
      { user_id: userId, credits: current - 1, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select("credits")
    .single();

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ credits: updated.credits });
}
