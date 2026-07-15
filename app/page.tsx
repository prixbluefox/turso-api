// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LocalLog {
  id: string;
  route: string;
  method: string;
  status: number;
  message: string;
  created_at: string;
}

export default function Home() {
  const [logs, setLogs] = useState<LocalLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to read server logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Poll server every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
      <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100 font-mono p-6 sm:p-12 md:p-16">
        <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-between gap-8">

          {/* Header Block with App Logo */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-6 w-full gap-4">
            <div className="flex items-center gap-4">
              <Image
                  className="invert"
                  src="/next.svg"
                  alt="Next.js logo"
                  width={85}
                  height={17}
                  priority
              />
              <div className="h-6 w-[1px] bg-zinc-800 hidden sm:block" />
              <div>
                <h1 className="text-sm font-semibold tracking-wider text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SYSTEM GATEWAY
                </h1>
                <p className="text-[10px] text-zinc-500 mt-0.5">Real-time Backend Runtime Log Monitor</p>
              </div>
            </div>
            <button
                onClick={fetchLogs}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium py-1.5 px-3.5 rounded border border-zinc-800 active:scale-95 transition-all"
            >
              Force Refresh
            </button>
          </header>

          {/* Live Terminal Log Stream Window */}
          <div className="flex-1 min-h-[400px] bg-black border border-zinc-850 rounded-lg shadow-2xl flex flex-col overflow-hidden">

            {/* Mock Window Bar */}
            <div className="bg-zinc-900/60 px-4 py-3 flex items-center justify-between border-b border-zinc-850">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <span className="text-[11px] text-zinc-500 font-sans ml-2">in_memory_server.log</span>
              </div>
              <div className="text-[10px] text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">
                Active Stream
              </div>
            </div>

            {/* Log List Output */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 text-[11px] leading-5">
              {loading ? (
                  <div className="text-zinc-600 animate-pulse flex items-center gap-2">
                    <span>⚡</span> Establishing local server stream...
                  </div>
              ) : logs.length === 0 ? (
                  <div className="text-zinc-700 italic">
                    No active traffic caught yet. Fire requests through your mobile client or signup pages to inspect.
                  </div>
              ) : (
                  logs.map((log) => {
                    const isError = log.status >= 400;
                    const isSuccess = log.status >= 200 && log.status < 300;

                    return (
                        <div
                            key={log.id}
                            className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4 py-1.5 border-b border-zinc-900/30 hover:bg-zinc-900/20 px-2 rounded transition-colors"
                        >
                          {/* Timestamp */}
                          <span className="text-zinc-600 shrink-0 select-none">
                      [{new Date(log.created_at).toLocaleTimeString()}]
                    </span>

                          {/* HTTP Block */}
                          <div className="flex items-center gap-2 shrink-0">
                      <span className="bg-zinc-900 text-zinc-400 font-bold px-1.5 py-0.5 rounded text-[9px] border border-zinc-850">
                        {log.method}
                      </span>
                            <span className={`font-bold shrink-0 ${isError ? 'text-rose-500' : isSuccess ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {log.status}
                      </span>
                          </div>

                          {/* Route Location */}
                          <span className="text-zinc-300 font-semibold shrink-0 select-all">
                      {log.route}
                    </span>

                          {/* Process Message Details */}
                          <span className={`flex-1 break-all ${isError ? 'text-rose-400/90' : 'text-zinc-400'}`}>
                      → {log.message}
                    </span>
                        </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center md:text-left text-[10px] text-zinc-600 border-t border-zinc-900 pt-4 flex flex-col md:flex-row justify-between items-center gap-2">
            <p>Next.js Memory logs are non-persistent and will refresh on server restart.</p>
            <a
                href="/api/logs"
                target="_blank"
                className="hover:underline text-emerald-500/80"
            >
              Raw JSON Output
            </a>
          </footer>
        </main>
      </div>
  );
}