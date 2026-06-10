import { Clock, Scissors } from 'lucide-react';
import type { ServicioPublico } from '../../services/api';
import { formatPrecio } from '../../utils/format';
import { SectionHeader } from './SectionHeader';

type ServiciosSectionProps = {
  servicios: ServicioPublico[];
};

export function ServiciosSection({ servicios }: ServiciosSectionProps) {
  if (servicios.length === 0) return null;

  return (
    <section id="servicios" className="border-y border-white/5 bg-white/[0.02] py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Servicios"
          title="Menú de cortes y tratamientos"
          description="Precios transparentes y duración estimada para que planifiques tu visita"
        />

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          {servicios.map((servicio, index) => (
            <article
              key={servicio.uuid}
              className="animate-fade-in-up group flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-[var(--landing-primary)]/35 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--landing-primary-soft)] sm:h-14 sm:w-14">
                <Scissors className="h-6 w-6 text-[var(--landing-primary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-white sm:text-lg">{servicio.nombre}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                  <Clock className="h-4 w-4 shrink-0" />
                  {servicio.duracion} minutos
                </p>
              </div>
              <p className="shrink-0 text-lg font-bold text-[var(--landing-primary)] sm:text-xl">
                {formatPrecio(servicio.precio)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
