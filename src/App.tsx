import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';
import {
  CheckCircle2,
  ShieldCheck,
  Database,
  Cpu,
  Terminal,
  Activity,
  ArrowRight,
} from 'lucide-react';

export function App() {
  const [testCount, setTestCount] = useState(0);

  const verificationItems = [
    { label: 'React 18 + Strict TypeScript', status: 'Ready', icon: Cpu },
    { label: 'Vite 6 Fast Bundler', status: 'Ready', icon: Terminal },
    { label: 'Tailwind CSS + shadcn/ui Foundation', status: 'Ready', icon: CheckCircle2 },
    { label: 'Supabase BaaS Integration', status: 'Configured', icon: Database },
    { label: 'Strict Zod Boundary Validation', status: 'Active', icon: ShieldCheck },
  ];

  return (
    <div id="app-root" className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Banner */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-md shadow-blue-500/20">
              ITS
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none tracking-tight text-slate-900">
                {env.VITE_APP_NAME}
              </h1>
              <p className="mt-1 text-xs text-slate-500">Foundation Stage &bull; Phase 1</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              id="status-badge"
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
            >
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Bootstrap Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Welcome Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Activity className="h-3.5 w-3.5" />
              <span>Project Scaffold Verified</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Enterprise Production System Foundation
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The project runtime, build toolchain, type checking, styling engine, and test harness
              have been initialized according to the repository architecture specifications.
              Business modules remain intentionally decoupled until Phase 2 database migrations are
              applied.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6">
              <Button
                id="interactive-test-button"
                variant="default"
                size="default"
                onClick={() => setTestCount((c) => c + 1)}
              >
                Interactive State Check ({testCount})
              </Button>
              <Button id="docs-ref-button" variant="outline" size="default">
                <span>Phase 2 Database Next</span>
                <ArrowRight className="ml-1.5 h-4 w-4 text-slate-400" />
              </Button>
            </div>
          </div>

          {/* Foundation Checklist Grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Verified Foundation Deliverables
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {verificationItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="shadow-2xs rounded-md border border-slate-200 bg-white p-2 text-slate-700">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    </div>
                    <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-400">
          ITS-QLSX &bull; Environment:{' '}
          <span className="font-mono text-slate-600">{env.VITE_APP_ENV}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
