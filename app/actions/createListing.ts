"use server";

import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import { supabaseServer } from "../lib/supabase-server";

export type CreateListingState =
  | { error?: string; fieldErrors?: Partial<Record<string, string>> }
  | undefined;

const VALID_CATEGORIES = ["Home", "Car", "Equipment", "Boat", "Office"] as const;

export async function createListing(
  _prev: CreateListingState,
  formData: FormData
): Promise<CreateListingState> {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Extract fields
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const priceRaw = String(formData.get("price_base") ?? "").trim();
  const auctionEndRaw = String(formData.get("auction_end_time") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  // Validate
  const fieldErrors: Partial<Record<string, string>> = {};

  if (!title || title.length < 3) {
    fieldErrors.title = "Title must be at least 3 characters.";
  }
  if (!description || description.length < 20) {
    fieldErrors.description = "Description must be at least 20 characters.";
  }
  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    fieldErrors.category = "Please select a valid category.";
  }
  if (!location) {
    fieldErrors.location = "Location is required.";
  }

  const priceBase = parseFloat(priceRaw);
  if (isNaN(priceBase) || priceBase <= 0) {
    fieldErrors.price_base = "Enter a valid price greater than 0.";
  }

  let auctionEndTime: string | null = null;
  if (auctionEndRaw) {
    const parsed = new Date(auctionEndRaw);
    if (isNaN(parsed.getTime())) {
      fieldErrors.auction_end_time = "Enter a valid date and time.";
    } else if (parsed <= new Date()) {
      fieldErrors.auction_end_time = "Auction end time must be in the future.";
    } else {
      auctionEndTime = parsed.toISOString();
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Insert — use service role to bypass RLS while user-level policies aren't wired yet
  const { error } = await supabaseServer.from("listings").insert({
    owner_id: user.id,
    title,
    description,
    category,
    location,
    image_url: imageUrl || null,
    price_base: priceBase,
    auction_end_time: auctionEndTime,
    status: "active",
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/listings");
}
