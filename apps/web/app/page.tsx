import JobTable from '@/components/JobTable';
import JobCreator from '@/components/JobCreator';

export default function Home() {
  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <header className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold tracking-wider font-mono">CLIPFORGE</h1>
        <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/40">v1.0.0</span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="border border-white/10 rounded-lg p-4">
            <h2 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Submit Job</h2>
            <JobCreator />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="border border-white/10 rounded-lg p-4">
            <h2 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Jobs</h2>
            <JobTable />
          </div>
        </div>
      </div>
    </main>
  );
}
