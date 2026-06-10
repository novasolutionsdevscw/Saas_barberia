import { Mail, MapPin, Phone } from 'lucide-react';
import type { BarberiaPublica, LandingConfig } from '../../services/api';
import { mediaUrl } from '../../utils/mediaUrl';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

type FooterSectionProps = {
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

export function FooterSection({ barberia, landing }: FooterSectionProps) {
  const year = new Date().getFullYear();
  const footerText =
    landing.footer_texto || `© ${year} ${barberia.nombre}. Todos los derechos reservados.`;
  const logoSrc = mediaUrl(barberia.logo);
  const whatsapp = landing.whatsapp || barberia.telefono || '';

  const socials = [
    { url: landing.facebook, icon: FacebookIcon, label: 'Facebook' },
    { url: landing.instagram, icon: InstagramIcon, label: 'Instagram' },
    { url: landing.tiktok, icon: TikTokIcon, label: 'TikTok' },
  ].filter((s) => s.url);

  return (
    <footer
      id="contacto"
      className="border-t border-white/8 bg-[#080a0e] py-14 sm:py-16"
      style={{ paddingBottom: 'max(3.5rem, calc(3.5rem + env(safe-area-inset-bottom)))' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {logoSrc ? (
                <img src={logoSrc} alt={barberia.nombre} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <span className="text-xl font-bold text-[var(--landing-primary)]">{barberia.nombre}</span>
              )}
              <div>
                <p className="font-semibold text-white">{barberia.nombre}</p>
                <p className="text-sm text-slate-500">Barbería profesional</p>
              </div>
            </div>
            <p className="max-w-md break-words text-sm leading-relaxed text-slate-400">{footerText}</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--landing-primary)]">
              Contacto y redes
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              {barberia.direccion && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-primary)]" />
                  <span className="break-words">{barberia.direccion}</span>
                </li>
              )}
              {barberia.telefono && (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-[var(--landing-primary)]" />
                  <a href={`tel:${barberia.telefono}`} className="hover:text-white">
                    {barberia.telefono}
                  </a>
                </li>
              )}
              {barberia.email && (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-[var(--landing-primary)]" />
                  <a href={`mailto:${barberia.email}`} className="break-all hover:text-white">
                    {barberia.email}
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a
                    href={buildWhatsAppUrl(whatsapp, `Hola ${barberia.nombre}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>

            {socials.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {socials.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-[var(--landing-primary)]/40 hover:text-[var(--landing-primary)]"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-slate-600">
          Powered by <span className="text-[var(--landing-primary)]/70">Barber Nova</span>
        </p>
      </div>
    </footer>
  );
}
