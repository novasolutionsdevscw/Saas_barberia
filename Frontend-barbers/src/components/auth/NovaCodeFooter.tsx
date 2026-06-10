import { Mail, Phone } from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

const NOVA_CODE = {
  name: 'Nova Code',
  instagram: 'https://www.instagram.com/novacode.devs/',
  phone: '3108198838',
  email: 'novasolutionsdevscw@gmail.com',
} as const;

export function NovaCodeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8 bg-[#080a0e]/80 px-6 py-6 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-white">{NOVA_CODE.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Desarrollado por Nova Code · © {year}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
          <a
            href={NOVA_CODE.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 transition hover:text-indigo-300"
            aria-label="Instagram de Nova Code"
          >
            <InstagramIcon className="h-4 w-4 shrink-0 text-indigo-400" />
            <span className="hidden sm:inline">@novacode.devs</span>
          </a>

          <a
            href={`tel:${NOVA_CODE.phone}`}
            className="inline-flex items-center gap-2 transition hover:text-indigo-300"
          >
            <Phone className="h-4 w-4 shrink-0 text-indigo-400" />
            {NOVA_CODE.phone}
          </a>

          <a
            href={`mailto:${NOVA_CODE.email}`}
            className="inline-flex items-center gap-2 transition hover:text-indigo-300"
          >
            <Mail className="h-4 w-4 shrink-0 text-indigo-400" />
            <span className="max-w-[200px] truncate sm:max-w-none">{NOVA_CODE.email}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
