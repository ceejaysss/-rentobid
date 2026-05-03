import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import NavbarUserMenu from "../../components/NavbarUserMenu";
import CreateListingForm from "./CreateListingForm";

export default async function CreateListingPage() {
  // Auth guard — redirect to login if no session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

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
              href="/listings"
              className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-black md:block"
            >
              Browse listings
            </Link>
            <NavbarUserMenu initialUser={user} />
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-2xl px-6 py-12 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/listings" className="transition-colors hover:text-black">
              Listings
            </Link>
            <span>/</span>
            <span className="text-black">Create listing</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-black">
              Create a listing
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Fill in the details below. You can edit your listing at any time.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <CreateListingForm />
          </div>
        </div>
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
