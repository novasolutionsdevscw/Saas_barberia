import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import type { BarberiaPublica, LandingConfig } from '../../services/api';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

type ContactSectionProps = {
  barberia: BarberiaPublica;
  landing: LandingConfig;
};

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.5a8.18 8.18 0 0 0 4.78 1.52V6.6a4.85 4.85 0 0 1-1.01-.09z" />
    </svg>
  );
}

export function ContactSection({ barberia, landing }: ContactSectionProps) {
  const whatsapp = landing.whatsapp || barberia.telefono || '';
  const socials = [
    { url: landing.facebook, icon: FacebookIcon, label: 'Facebook' },
    { url: landing.instagram, icon: InstagramIcon, label: 'Instagram' },
    { url: landing.tiktok, icon: TikTokIcon, label: 'TikTok' },
  ].filter((s) => s.url);

  return (
    <section id="contacto" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-12 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-[var(--landing-primary)]">
            Contacto
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Visítanos</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="animate-fade-in-up space-y-4 rounded-2xl border border-white/8 bg-white/[0.03] p-6 sm:p-8">
            {barberia.direccion && (
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-primary-soft)] text-[var(--landing-primary)]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Dirección</p>
                  <p className="mt-1 text-white">{barberia.direccion}</p>
                </div>
              </div>
            )}

            {barberia.telefono && (
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-primary-soft)] text-[var(--landing-primary)]">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Teléfono</p>
                  <a
                    href={`tel:${barberia.telefono}`}
                    className="mt-1 block text-white hover:text-[var(--landing-primary)]"
                  >
                    {barberia.telefono}
                  </a>
                </div>
              </div>
            )}

            {barberia.email && (
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-primary-soft)] text-[var(--landing-primary)]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Email</p>
                  <a
                    href={`mailto:${barberia.email}`}
                    className="mt-1 block text-white hover:text-[var(--landing-primary)]"
                  >
                    {barberia.email}
                  </a>
                </div>
              </div>
            )}

            {whatsapp && (
              <a
                href={buildWhatsAppUrl(whatsapp, `Hola, quiero información sobre ${barberia.nombre}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
              >
                <MessageCircle className="h-5 w-5" />
                Escribir por WhatsApp
              </a>
            )}
          </div>

          {socials.length > 0 && (
            <div className="animate-fade-in-up flex flex-col justify-center rounded-2xl border border-white/8 bg-white/[0.03] p-6 sm:p-8">
              <p className="mb-4 text-sm font-medium text-slate-400">Síguenos en redes</p>
              <div className="flex flex-wrap gap-3">
                {socials.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-[var(--landing-primary)]/50 hover:bg-[var(--landing-primary-soft)] hover:text-[var(--landing-primary)]"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
