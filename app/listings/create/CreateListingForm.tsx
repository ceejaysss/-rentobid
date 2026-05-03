"use client";

import { useActionState } from "react";
import { createListing } from "../../actions/createListing";

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

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Field
        label="Title"
        name="title"
        error={state?.fieldErrors?.title}
      >
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

        <Field
          label="Auction end time (optional)"
          name="auction_end_time"
          error={state?.fieldErrors?.auction_end_time}
        >
          <input
            id="auction_end_time"
            name="auction_end_time"
            type="datetime-local"
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Image URL (optional)"
        name="image_url"
        error={state?.fieldErrors?.image_url}
      >
        <input
          id="image_url"
          name="image_url"
          type="url"
          placeholder="https://images.unsplash.com/..."
          className={inputClass}
        />
      </Field>

      <p className="text-xs text-gray-400">
        Tip: paste any Unsplash image URL for a great-looking listing.
        Leave blank for a default photo.
      </p>

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
