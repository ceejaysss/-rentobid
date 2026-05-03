"use client";

import { useActionState, useState, useRef } from "react";
import { createListing } from "../../actions/createListing";

type ListingType = "fixed" | "auction";

const CATEGORIES = ["Home", "Car", "Equipment", "Boat", "Office"] as const;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none";

export default function CreateListingForm() {
  const [state, action, pending] = useActionState(createListing, undefined);
  const [listingType, setListingType] = useState<ListingType>("fixed");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  }

  function removeImage() {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Listing type toggle */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Listing type</span>
        <div className="flex overflow-hidden rounded-xl border border-gray-200">
          {(["fixed", "auction"] as ListingType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setListingType(type)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                listingType === type
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {type === "fixed" ? "Fixed Price" : "Auction"}
            </button>
          ))}
        </div>
        <input type="hidden" name="listing_type" value={listingType} />
      </div>

      <Field label="Title" name="title" error={state?.fieldErrors?.title}>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Modern Loft in SoHo"
          className={inputClass}
        />
      </Field>

      <Field
        label="Description"
        name="description"
        error={state?.fieldErrors?.description}
      >
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="Describe what makes your listing special..."
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Category"
          name="category"
          error={state?.fieldErrors?.category}
        >
          <select
            id="category"
            name="category"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Location"
          name="location"
          error={state?.fieldErrors?.location}
        >
          <input
            id="location"
            name="location"
            type="text"
            required
            placeholder="e.g. New York City, NY"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Base price / month ($)"
          name="price_base"
          error={state?.fieldErrors?.price_base}
        >
          <input
            id="price_base"
            name="price_base"
            type="number"
            min="1"
            step="1"
            required
            placeholder="3500"
            className={inputClass}
          />
        </Field>

        {listingType === "auction" && (
          <Field
            label="Auction end time"
            name="auction_end_time"
            error={state?.fieldErrors?.auction_end_time}
          >
            <input
              id="auction_end_time"
              name="auction_end_time"
              type="datetime-local"
              required
              className={inputClass}
            />
          </Field>
        )}
      </div>

      {/* Image upload */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">
          Listing photo (optional)
        </span>

        {imagePreview ? (
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              className="h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white hover:bg-black/80 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Upload a photo
          </button>
        )}

        <input
          ref={fileInputRef}
          id="image_file"
          name="image_file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          id="image_url"
          name="image_url"
          type="url"
          placeholder="Or paste an image URL (e.g. Unsplash)…"
          className={inputClass}
        />
        <p className="text-xs text-gray-400">
          Upload a photo or paste an image URL. Leave both blank for a default
          photo.
        </p>
      </div>

      <Field
        label="Video tour URL (optional)"
        name="video_url"
        error={state?.fieldErrors?.video_url}
      >
        <input
          id="video_url"
          name="video_url"
          type="url"
          placeholder="https://youtube.com/watch?v=…"
          className={inputClass}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex w-full items-center justify-center rounded-xl bg-black py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          "Publish listing"
        )}
      </button>
    </form>
  );
}
