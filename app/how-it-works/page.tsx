"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  BadgeCheck,
  Gavel,
  FileSignature,
  KeyRound,
  ImagePlus,
  SlidersHorizontal,
  TrendingUp,
  Trophy,
  Banknote,
  ShieldCheck,
  FileText,
  Lock,
} from "lucide-react";
import NavbarUserMenu from "../components/NavbarUserMenu";

const renterSteps = [
  {
    icon: Search,
    title: "Browse listings",
    description:
      "Explore homes, cars, and equipment with transparent pricing. Filter by category, location, and listing type — fixed or auction.",
  },
  {
    icon: BadgeCheck,
    title: "Get verified",
    description:
      "Upload your ID once. We verify your identity so owners know every bidder on the platform is real and qualified.",
  },
  {
    icon: Gavel,
    title: "Place your bid",
    description:
      "Compete in real-time with other qualified renters, or rent instantly at the listed fixed price — your choice.",
  },
  {
    icon: FileSignature,
    title: "Win & sign",
    description:
      "Once your bid is accepted, sign your rental agreement digitally. No back-and-forth, no paperwork piles.",
  },
  {
    icon: KeyRound,
    title: "Move in",
    description:
      "Your access is confirmed after your deposit clears. Everything is handled in-app — no phone calls required.",
  },
];

const ownerSteps = [
  {
    icon: ImagePlus,
    title: "List your property",
    description:
      "Upload photos, set your base price, and describe what makes your listing worth renting. Takes under ten minutes.",
  },
  {
    icon: SlidersHorizontal,
    title: "Choose your model",
    description:
      "Set a stable fixed monthly price, or open a live auction and let qualified renters compete for your property.",
  },
  {
    icon: TrendingUp,
    title: "Receive bids",
    description:
      "Watch verified, ID-checked renters place competitive bids in real time. Your demand signals update live.",
  },
  {
    icon: Trophy,
    title: "Pick your winner",
    description:
      "Review renter profiles and accept the bid that works best for you — or let the auction close automatically.",
  },
  {
    icon: Banknote,
    title: "Get paid",
    description:
      "The deposit is secured via Stripe before handover. You get paid on time, every time, with full transaction records.",
  },
];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Verified renters only",
    description: "Every bidder is ID-verified before they can place a single bid. You always know who you're dealing with.",
  },
  {
    icon: FileText,
    title: "Digital contracts",
    description: "Sign and store your rental agreements in-app. Legally binding, instantly accessible, nothing to print.",
  },
  {
    icon: Lock,
    title: "Secure payments",
    description: "Deposits are held safely via Stripe escrow and released only when move-in is confirmed by both parties.",
  },
];

type Tab = "renter" | "owner";

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<Tab>("renter");
  const steps = activeTab === "renter" ? renterSteps : ownerSteps;

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-black">
              RentoBid
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/how-it-works"
              className="hidden text-sm font-medium text-black underline underline-offset-4 md:block"
            >
              How it works
            </Link>
            <Link
              href="/listings"
              className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-black md:block"
            >
              Browse listings
            </Link>
            <NavbarUserMenu />
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-6 py-20 text-center lg:px-8 lg:py-28">
            <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl lg:text-6xl">
              How RentoBid works
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-gray-500">
              The smarter way to rent — transparent, competitive, trusted.
            </p>
          </div>
        </section>

        {/* ── Tab Steps ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
          {/* Tab switcher */}
          <div className="mb-14 flex justify-center">
            <div className="inline-grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1">
              {(["renter", "owner"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-8 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "renter" ? "I'm a Renter" : "I'm an Owner"}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <ol className="flex flex-col gap-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === steps.length - 1;
              return (
                <li key={step.title} className="relative flex gap-6">
                  {/* Connector line */}
                  {!isLast && (
                    <div className="absolute left-5 top-12 h-full w-px bg-gray-100" />
                  )}

                  {/* Icon circle */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
                    <Icon className="h-4 w-4 text-gray-700" strokeWidth={1.75} />
                  </div>

                  {/* Content */}
                  <div className={`pb-10 ${isLast ? "pb-0" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                        Step {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-black">
                      {step.title}
                    </h3>
                    <p className="mt-1 leading-7 text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── Trust Section ─────────────────────────────────────────────── */}
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-black">
              Built on trust
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {trustPoints.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-gray-200 bg-white px-6 py-8"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-black">
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-semibold text-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ──────────────────────────────────────────────── */}
        <section className="border-t border-gray-100">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Renter CTA */}
              <div className="flex flex-col items-start gap-4 rounded-3xl border border-gray-200 bg-white px-8 py-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
                  <Search className="h-5 w-5 text-gray-700" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    Ready to find your next rental?
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Hundreds of verified listings. Bid now or rent instantly.
                  </p>
                </div>
                <Link
                  href="/listings"
                  className="mt-auto inline-flex items-center rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  Browse listings
                </Link>
              </div>

              {/* Owner CTA */}
              <div className="flex flex-col items-start gap-4 rounded-3xl border border-gray-200 bg-white px-8 py-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
                  <ImagePlus className="h-5 w-5 text-gray-700" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    Have something to rent out?
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    List your property in minutes and start receiving qualified bids.
                  </p>
                </div>
                <Link
                  href="/"
                  className="mt-auto inline-flex items-center rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-50"
                >
                  List your property
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
                <span className="text-sm font-bold text-white">R</span>
              </div>
              <span className="text-lg font-semibold text-black">RentoBid</span>
            </div>
            <p className="text-sm text-gray-500">© 2026 RentoBid. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
