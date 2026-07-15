// app/page.tsx
import Image from 'next/image';

export const metadata = {
  title: 'Turso API Gateway',
  description: 'Backend services for POS mobile environment',
};

export default function Home() {
  return (
      <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-mono p-6 sm:p-12 md:p-16 justify-between">
        <main className="w-full max-w-4xl mx-auto flex flex-col gap-12 my-auto">

          {/* Header Block */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-8 gap-4">
            <div className="flex items-center gap-4">
              <Image
                  className="invert opacity-80"
                  src="/next.svg"
                  alt="Next.js logo"
                  width={85}
                  height={17}
                  priority
              />
              <div className="h-6 w-[1px] bg-zinc-800 hidden sm:block" />
              <div>
                <h1 className="text-sm font-semibold tracking-wider text-emerald-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  API GATEWAY ACTIVE
                </h1>
                <p className="text-[10px] text-zinc-500 mt-0.5">Turso Database Cloud Matrix</p>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 bg-zinc-900/50 px-3 py-1 rounded border border-zinc-800">
              v1.0.0-production
            </div>
          </header>

          {/* Info Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Box 1: API Endpoint Health */}
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-lg p-6 space-y-4">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Service Overview</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-zinc-900/50 pb-2">
                  <span className="text-zinc-500">Database Driver</span>
                  <span className="text-zinc-300">@libsql/client/http</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900/50 pb-2">
                  <span className="text-zinc-500">Environment</span>
                  <span className="text-zinc-300">Vercel Serverless</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-zinc-500">Core Matrix</span>
                  <span className="text-emerald-400">Turso Cloud DB</span>
                </div>
              </div>
            </div>

            {/* Box 2: Registered Endpoints */}
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-lg p-6 space-y-4">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Endpoint Directory</h2>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold border border-emerald-900/50">POST</span>
                  <span className="text-zinc-300">/api/auth/login</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold border border-emerald-900/50">POST</span>
                  <span className="text-zinc-300">/api/auth/signup</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold border border-emerald-900/50">POST</span>
                  <span className="text-zinc-300">/api/auth/verify-tenant</span>
                </div>
              </div>
            </div>

          </section>

          {/* Informative Help Alert */}
          <div className="bg-zinc-900/10 border border-dashed border-zinc-850 rounded-lg p-6 text-xs text-zinc-500 leading-relaxed">
            <span className="text-zinc-300 font-bold block mb-1">Developer Notice:</span>
            This workspace houses the cloud API endpoints driving your mobile POS terminal workspace. Logging output has been fully offloaded directly to Vercel System Logs. Check the Vercel Deployments dashboard to monitor active request streams in real-time.
          </div>

        </main>

        {/* Footer */}
        <footer className="text-center text-[10px] text-zinc-600 max-w-4xl mx-auto w-full border-t border-zinc-900 pt-6">
          <p>© {new Date().getFullYear()} POS Gateway Cloud Matrix. All connections are secured via SSL.</p>
        </footer>
      </div>
  );
}