"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpWithEmail } from "../../actions/auth";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUpWithEmail, undefined);

  if (state?.message) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-black">Check your email</h2>
          <p className="mt-2 text-sm text-gray-500">{state.message}</p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 font-sans">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
            <span className="text-sm font-bold text-white">R</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-black">RentoBid</span>
        </Link>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-black">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">Start renting or listing today.</p>

          {state?.error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <form action={action} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jane Smith"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Min. 8 characters"
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-black underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
