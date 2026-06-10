import { MessageCircle, Calendar } from 'lucide-react';
import type { BarberiaPublica, LandingConfig } from '../../services/api';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { mediaUrl } from '../../utils/mediaUrl';
import { MediaImage } from '../ui/MediaImage';

type HeroSectionProps = {
  barberia: BarberiaPublica;
  landing: LandingConfig;
};

export function HeroSection({ barberia, landing }: HeroSectionProps) {
  const whatsapp = landing.whatsapp || barberia.telefono || '';
  const bannerSrc = mediaUrl(landing.banner);
  const ctaHref = whatsapp
    ? buildWhatsAppUrl(whatsapp, `Hola, quiero reservar una cita en ${barberia.nombre}`)
    : barberia.telefono
      ? `tel:${barberia.telefono}`
      : '#contacto';

  return (
    <section
      id="inicio"
      className="relative flex min-h-[min(100dvh,900px)] items-center overflow-hidden pb-16 sm:min-h-[90vh] sm:pb-20"
    >
      {bannerSrc ? (
        <>
          <img
            src={bannerSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--landing-secondary)]/90 via-[var(--landing-secondary)]/75 to-[#0a0c10]" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% -10%, var(--landing-primary-glow), transparent 60%), linear-gradient(180deg, var(--landing-secondary) 0%, #0a0c10 100%)`,
          }}
        />
      )}

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="animate-fade-in-up max-w-2xl">
          <div className="mb-5 h-14 w-14 overflow-hidden rounded-2xl border border-white/10 shadow-lg sm:mb-6 sm:h-20 sm:w-20">
            <MediaImage
              src={barberia.logo}
              alt={barberia.nombre}
              className="h-full w-full object-cover"
              wrapperClassName="h-14 w-14 sm:h-20 sm:w-20"
              fallbackIcon="user"
            />
          </div>

          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--landing-primary)] sm:text-sm">
            Bienvenido
          </p>
          <h1 className="break-words text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {barberia.nombre}
          </h1>
          <p className="mt-4 break-words text-base leading-relaxed text-slate-300 sm:mt-5 sm:text-lg md:text-xl">
            {landing.mensaje_bienvenida}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <a
              href="#reservar"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--landing-primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 sm:w-auto sm:px-6"
            >
              <Calendar className="h-5 w-5 shrink-0" />
              Reservar cita
            </a>
            {whatsapp && (
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10 sm:w-auto sm:px-6"
              >
                <MessageCircle className="h-5 w-5 shrink-0" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce sm:bottom-8 sm:block">
        <a
          href="#reservar"
          className="flex flex-col items-center gap-1 text-xs text-slate-500 hover:text-[var(--landing-primary)]"
        >
          <span className="uppercase tracking-widest">Reservar</span>
          <span className="block h-8 w-px bg-gradient-to-b from-[var(--landing-primary)] to-transparent" />
        </a>
      </div>
    </section>
  );
}
