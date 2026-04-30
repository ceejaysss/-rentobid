import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-black">
              RentoBid
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-black md:block">
              How it works
            </button>
            <button className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-black md:block">
              Browse listings
            </button>
            <button className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-black transition-all hover:border-gray-300 hover:bg-gray-50">
              Sign in
            </button>
            <button className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-all hover:bg-gray-800">
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col pt-20">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-gray-700">
                Now live — Bid on premium rentals
              </span>
            </div>

            {/* Heading */}
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-black sm:text-6xl lg:text-7xl">
              Rent anything.
              <br />
              <span className="text-gray-400">Bid smarter.</span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
              The first marketplace where you can rent homes, cars, and equipment 
              through real-time bidding. Get the best price, every time.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button className="flex h-14 items-center justify-center rounded-full bg-black px-8 text-base font-medium text-white transition-all hover:bg-gray-800">
                Browse listings
              </button>
              <button className="flex h-14 items-center justify-center rounded-full border border-gray-200 bg-white px-8 text-base font-medium text-black transition-all hover:border-gray-300 hover:bg-gray-50">
                Learn how it works
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Verified listings</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Digital contracts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature preview section */}
        <div className="w-full bg-gray-50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-start rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-black">List your property</h3>
                <p className="text-gray-600">Set your base price and let renters compete for the best offer.</p>
              </div>

              <div className="flex flex-col items-start rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-black">Real-time bidding</h3>
                <p className="text-gray-600">Place bids and get instant notifications when you're outbid.</p>
              </div>

              <div className="flex flex-col items-start rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-black">Fully digital</h3>
                <p className="text-gray-600">Verification, contracts, and payments—all handled online.</p>
              </div>
            </div>
          </div>
        </div>

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
              <p className="text-sm text-gray-500">
                © 2026 RentoBid. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}