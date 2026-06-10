import { Package } from 'lucide-react';
import type { ProductoPublico } from '../../services/api';
import { formatPrecio } from '../../utils/format';
import { MediaImage } from '../ui/MediaImage';
import { SectionHeader } from './SectionHeader';

type ProductosSectionProps = {
  productos: ProductoPublico[];
};

export function ProductosSection({ productos }: ProductosSectionProps) {
  if (productos.length === 0) return null;

  return (
    <section id="productos" className="relative py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--landing-primary-glow),_transparent_70%)] opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          kicker="Tienda"
          title="Productos"
          description="Cuida tu estilo en casa con los productos que usamos en la barbería"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {productos.map((producto, index) => (
            <article
              key={producto.id}
              className="group animate-fade-in-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:rounded-3xl"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="aspect-[5/4] w-full overflow-hidden sm:aspect-[4/3]">
                <MediaImage
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  wrapperClassName="h-full w-full"
                  fallbackIcon="off"
                />
              </div>
              <div className="p-4 sm:p-5">
                <div className="mb-2 flex items-start gap-2">
                  {!producto.imagen && (
                    <Package className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-primary)]" />
                  )}
                  <h3 className="text-base font-semibold text-white sm:text-lg">{producto.nombre}</h3>
                </div>
                {producto.descripcion && (
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">
                    {producto.descripcion}
                  </p>
                )}
                <p className="mt-3 text-lg font-bold text-[var(--landing-primary)] sm:text-xl">
                  {formatPrecio(producto.precio)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
