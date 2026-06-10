import { Phone, Scissors } from 'lucide-react';
import type { BarberoPublico } from '../../services/api';
import { MediaImage } from '../ui/MediaImage';
import { SectionHeader } from './SectionHeader';

type BarberosSectionProps = {
  barberos: BarberoPublico[];
};

export function BarberosSection({ barberos }: BarberosSectionProps) {
  if (barberos.length === 0) return null;

  return (
    <section id="barberos" className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Equipo"
          title="Nuestros barberos"
          description="Conoce a quienes darán forma a tu estilo. Reserva con el profesional que prefieras."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3">
          {barberos.map((barbero, index) => (
            <article
              key={barbero.uuid ?? barbero.id}
              className="group flex animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:rounded-3xl"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[3/4]">
                <MediaImage
                  src={barbero.foto}
                  alt={barbero.nombre}
                  className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
                  wrapperClassName="h-full w-full"
                  fallbackIcon="user"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                  <h3 className="text-lg font-bold text-white drop-shadow-md sm:text-xl">
                    {barbero.nombre}
                  </h3>
                  {barbero.especialidad && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300 sm:text-sm">
                      <Scissors className="h-3.5 w-3.5 shrink-0 text-[var(--landing-primary)]" />
                      <span className="line-clamp-2">{barbero.especialidad}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                {barbero.telefono ? (
                  <a
                    href={`tel:${barbero.telefono.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-[var(--landing-primary)]"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="break-all">{barbero.telefono}</span>
                  </a>
                ) : (
                  <p className="text-sm text-slate-600">Disponible en la barbería</p>
                )}
                <a
                  href="#reservar"
                  className="mt-auto inline-flex w-full items-center justify-center rounded-xl border border-[var(--landing-primary)]/30 bg-[var(--landing-primary-soft)] py-2.5 text-sm font-semibold text-[var(--landing-primary)] transition hover:bg-[var(--landing-primary)] hover:text-white"
                >
                  Consultar disponibilidad
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
