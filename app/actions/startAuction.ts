"use server";

import { supabaseServer } from "../lib/supabase-server";
import { createClient } from "../lib/supabase/server";

export async function startAuction(
  listingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  // Verify ownership via listing_owners table
  const { data: ownerRow } = await supabaseServer
    .from("listing_owners")
    .select("user_id")
    .eq("listing_id", listingId)
    .maybeSingle();

  if (!ownerRow || ownerRow.user_id !== user.id) {
    return { success: false, error: "Not authorized." };
  }

  const { error } = await supabaseServer
    .from("listing_upgrade_requests")
    .insert({ listing_id: listingId });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
