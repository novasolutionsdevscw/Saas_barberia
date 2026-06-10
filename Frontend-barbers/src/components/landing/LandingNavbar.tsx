import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { BarberiaPublica } from '../../services/api';
import { MediaImage } from '../ui/MediaImage';

type LandingNavbarProps = {
  barberia: BarberiaPublica;
};

const links = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#reservar', label: 'Reservar' },
  { href: '#galeria', label: 'Galería' },
  { href: '#contacto', label: 'Contacto' },
];

export function LandingNavbar({ barberia }: LandingNavbarProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0c10]/90 backdrop-blur-xl supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#inicio" className="flex min-w-0 items-center gap-2.5 sm:gap-3" onClick={close}>
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg sm:h-10 sm:w-10">
            <MediaImage
              src={barberia.logo}
              alt={barberia.nombre}
              className="h-full w-full object-cover"
              wrapperClassName="h-9 w-9 sm:h-10 sm:w-10"
              fallbackIcon="user"
            />
          </div>
          <span className="truncate text-sm font-semibold text-white sm:text-base">
            {barberia.nombre}
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition hover:bg-white/5 ${
                link.href === '#reservar'
                  ? 'bg-[var(--landing-primary)]/20 font-medium text-[var(--landing-primary)]'
                  : 'text-slate-400 hover:text-[var(--landing-primary)]'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={close} aria-hidden />
          <nav className="fixed inset-x-0 top-[53px] z-50 max-h-[calc(100dvh-53px)] overflow-y-auto border-t border-white/5 bg-[#0a0c10]/98 px-4 py-4 backdrop-blur-xl lg:hidden">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={close}
                    className={`block rounded-xl px-4 py-3.5 text-base font-medium transition hover:bg-white/5 hover:text-[var(--landing-primary)] ${
                      link.href === '#reservar'
                        ? 'bg-[var(--landing-primary)]/15 text-[var(--landing-primary)]'
                        : 'text-slate-200'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
