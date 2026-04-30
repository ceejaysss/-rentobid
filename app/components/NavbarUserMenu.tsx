"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Props {
  // Server components can pre-fetch and pass user to avoid flash
  initialUser?: User | null;
}

export default function NavbarUserMenu({ initialUser }: Props) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // If server already passed a user, skip the client fetch
    if (initialUser !== undefined) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, [initialUser]);

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth/login"
          className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-black transition-all hover:border-gray-300 hover:bg-gray-50"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800"
        >
          Get started
        </Link>
      </div>
    );
  }

  const initials = (user.user_metadata?.full_name as string | undefined)
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="relative flex items-center gap-4">
      <Link
        href="/listings"
        className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-black md:block"
      >
        Dashboard
      </Link>

      <button
        onClick={() => setDropdownOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white transition-opacity hover:opacity-80"
        aria-label="Account menu"
      >
        {initials}
      </button>

      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 min-w-[180px] rounded-2xl border border-gray-100 bg-white p-1 shadow-lg">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user.user_metadata?.full_name ?? user.email}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <hr className="my-1 border-gray-100" />
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
