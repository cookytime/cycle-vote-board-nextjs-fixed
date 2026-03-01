import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center space-y-6">
        <h1 className="text-4xl font-black tracking-tight">🇺🇸🇬🇧 Vote Board</h1>
        <p className="text-slate-600">Pick where you want to go.</p>

        <div className="flex flex-col gap-4">
          <Link
            href="/scan"
            className="rounded-2xl bg-green-600 py-5 text-2xl font-extrabold text-white shadow-lg hover:bg-green-700 active:scale-[0.99] transition"
          >
            Member Vote (QR Scan)
          </Link>
          <Link
            href="/vote"
            className="rounded-2xl bg-blue-600 py-5 text-2xl font-extrabold text-white shadow-lg hover:bg-blue-700 active:scale-[0.99] transition"
          >
            Control Panel (Admin)
          </Link>
          <Link
            href="/display"
            className="rounded-2xl bg-black py-5 text-2xl font-extrabold text-white shadow-lg hover:bg-neutral-800 active:scale-[0.99] transition"
          >
            Scoreboard Display (TV)
          </Link>
        </div>

        <div className="text-sm text-slate-500">
          <p><span className="font-semibold">/scan</span> - QR code page for members to vote on current battle</p>
          <p><span className="font-semibold">/vote</span> - Admin control panel and manual votes</p>
          <p><span className="font-semibold">/display</span> - TV scoreboard</p>
        </div>
      </div>
    </div>
  );
}
