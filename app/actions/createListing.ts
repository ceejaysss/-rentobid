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
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    redirect("/auth/login");
  }
  const user = authData.user;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const priceRaw = String(formData.get("price_base") ?? "").trim();
  const listingType = String(formData.get("listing_type") ?? "fixed").trim();
  const auctionEndRaw =
    listingType === "auction"
      ? String(formData.get("auction_end_time") ?? "").trim()
      : "";
  // image_url is set by the client-side upload in CreateListingForm (Supabase public URL or pasted URL)
  const imageUrlRaw = String(formData.get("image_url") ?? "").trim();
  const videoUrl = String(formData.get("video_url") ?? "").trim();

  console.log("[createListing] image_url received from form:", imageUrlRaw || "(none)");

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
  if (listingType === "auction") {
    if (!auctionEndRaw) {
      fieldErrors.auction_end_time = "Auction end time is required.";
    } else {
      const parsed = new Date(auctionEndRaw);
      if (isNaN(parsed.getTime())) {
        fieldErrors.auction_end_time = "Enter a valid date and time.";
      } else if (parsed <= new Date()) {
        fieldErrors.auction_end_time = "Auction end time must be in the future.";
      } else {
        auctionEndTime = parsed.toISOString();
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Image URL was uploaded client-side to Supabase Storage; server action just receives the public URL
  const imageUrl: string | null = imageUrlRaw || null;
  console.log("[createListing] saving image_url to listings table:", imageUrl ?? "(null — no photo)");

  // Insert listing and get ID back so we can record ownership
  const { data: inserted, error } = await supabaseServer
    .from("listings")
    .insert({
      owner_id: user.id,
      title,
      description,
      category,
      location,
      image_url: imageUrl,
      video_url: videoUrl || null,
      price_base: priceBase,
      auction_end_time: auctionEndTime,
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  // Record in listing_owners so the auction upsell banner can detect ownership
  if (inserted?.id) {
    await supabaseServer
      .from("listing_owners")
      .insert({ listing_id: String(inserted.id), user_id: user.id });
    // Non-fatal — listing is already created; worst case the upsell banner won't show
  }

  redirect("/dashboard");
}
