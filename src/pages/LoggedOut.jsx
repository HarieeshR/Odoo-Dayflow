import { Sunrise } from "lucide-react";

// After logout, the real Dayflow app redirects to its EXISTING authentication
// entry point (sign-in page). Per the spec, this Employee Portal module does
// not own or create that screen — this is only a placeholder so the demo
// flow is visibly complete end-to-end.
export default function LoggedOut({ onBackToDemo }) {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center mx-auto mb-5">
          <Sunrise size={22} className="text-navy-950" strokeWidth={2.5} />
        </div>
        <h1 className="font-display text-xl font-bold text-white">You've been signed out</h1>
        <p className="text-mist-300/70 text-sm mt-2">
          This is where your organization's existing sign-in screen takes over. This Employee Portal module intentionally
          doesn't include its own login page.
        </p>
        <button
          onClick={onBackToDemo}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-5 py-2.5 transition"
        >
          Re-enter Employee Portal (demo)
        </button>
      </div>
    </div>
  );
}
