import { useState } from 'react';
import { X } from 'lucide-react';
import type { GaleriaCortePublico } from '../../services/api';
import { MediaImage } from '../ui/MediaImage';
import { mediaUrl } from '../../utils/mediaUrl';

type Props = {
  galeria: GaleriaCortePublico[];
};

export function GaleriaSection({ galeria }: Props) {
  const [lightbox, setLightbox] = useState<GaleriaCortePublico | null>(null);

  if (galeria.length === 0) return null;

  return (
    <section id="galeria" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-[var(--landing-primary)]">
            Portafolio
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Nuestros mejores cortes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Mira el estilo y la calidad de nuestro trabajo antes de reservar tu cita.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {galeria.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightbox(item)}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] text-left transition hover:border-[var(--landing-primary)]/40 hover:shadow-lg hover:shadow-[var(--landing-primary)]/10"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <MediaImage
                src={item.imagen}
                alt={item.titulo || 'Corte de barbería'}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                wrapperClassName="h-full w-full"
              />
              {item.titulo && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <p className="text-sm font-medium text-white">{item.titulo}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/90 p-4 sm:items-center"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={mediaUrl(lightbox.imagen) ?? lightbox.imagen}
              alt={lightbox.titulo || 'Corte'}
              className="mx-auto max-h-[70dvh] w-full rounded-2xl object-contain sm:max-h-[85vh]"
            />
            {lightbox.titulo && (
              <p className="mt-3 break-words text-center text-base font-medium text-white sm:mt-4 sm:text-lg">
                {lightbox.titulo}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
