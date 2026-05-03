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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

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
  const imageUrlRaw = String(formData.get("image_url") ?? "").trim();
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  const imageFile = formData.get("image_file") as File | null;

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

  // Upload image file if provided; fall back to pasted URL
  let imageUrl: string | null = imageUrlRaw || null;
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseServer.storage
      .from("listing-images")
      .upload(path, imageFile, { contentType: imageFile.type });

    if (uploadError) {
      return { error: `Image upload failed: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from("listing-images").getPublicUrl(path);
    imageUrl = publicUrl;
  }

  const { error } = await supabaseServer.from("listings").insert({
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
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/listings");
}
