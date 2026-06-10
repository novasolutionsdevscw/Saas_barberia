import { Outlet } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { NovaCodeFooter } from '../components/auth/NovaCodeFooter';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#0f1117_50%)]">
      <div className="mx-auto grid flex-1 max-w-6xl items-center gap-8 px-6 py-10 lg:grid-cols-2">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-200">
            <Scissors className="h-4 w-4" />
            Barbers Nova SaaS
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">
            Tu barbería, tu sistema independiente
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-400">
            Multi-tenant seguro: cada barbería opera con datos aislados, dashboard propio y
            configuración personalizada.
          </p>
        </section>

        <section className="card mx-auto w-full max-w-md animate-in fade-in">
          <Outlet />
        </section>
      </div>

      <NovaCodeFooter />
    </div>
  );
}
