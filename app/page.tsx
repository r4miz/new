import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4">
      <div className="max-w-2xl text-center">
        <div className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-3 py-1 rounded-full mb-6">
          AI-powered business analytics
        </div>
        <h1 className="text-5xl font-bold mb-4 leading-tight">
          Know how your business is doing.{" "}
          <span className="text-blue-400">Without a data analyst.</span>
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Upload your data. Get an AI-generated dashboard of the metrics that
          actually matter for your business — in minutes.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition"
          >
            Start free trial
          </Link>
          <Link
            href="/login"
            className="border border-slate-600 hover:border-slate-400 text-slate-300 font-medium px-6 py-3 rounded-lg transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
