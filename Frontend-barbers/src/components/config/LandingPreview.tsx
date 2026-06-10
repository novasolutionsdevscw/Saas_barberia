import { MessageCircle } from 'lucide-react';
import type { LandingConfig } from '../../services/api';
import { mediaUrl, normalizeHex } from '../../utils/mediaUrl';

type LandingPreviewProps = {
  nombre: string;
  logo?: string | null;
  landing: LandingConfig;
};

export function LandingPreview({ nombre, logo, landing }: LandingPreviewProps) {
  const primary = normalizeHex(landing.color_principal, '#6366f1');
  const secondary = normalizeHex(landing.color_secundario, '#1e1b4b');
  const banner = mediaUrl(landing.banner);
  const logoSrc = mediaUrl(logo);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#0a0c10] shadow-xl">
      <div className="border-b border-white/5 px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Vista previa</p>
      </div>

      <div
        className="relative min-h-[320px] p-5"
        style={{
          background: banner
            ? undefined
            : `linear-gradient(180deg, ${secondary} 0%, #0a0c10 100%)`,
        }}
      >
        {banner && (
          <>
            <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(180deg, ${secondary}cc 0%, #0a0c10ee 100%)` }}
            />
          </>
        )}

        <div className="relative space-y-3">
          {logoSrc ? (
            <img src={logoSrc} alt={nombre} className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: `${primary}33`, color: primary }}
            >
              {nombre.charAt(0) || '?'}
            </div>
          )}

          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: primary }}>
            Bienvenido
          </p>
          <h3 className="text-xl font-bold text-white">{nombre || 'Tu barbería'}</h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-300">
            {landing.mensaje_bienvenida || 'Mensaje de bienvenida...'}
          </p>

          <div
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Reservar
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/5 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: primary }}>
          Sobre nosotros
        </p>
        <p className="line-clamp-2 text-xs text-slate-400">
          {landing.descripcion || 'Descripción de tu barbería...'}
        </p>
      </div>

      <div className="flex gap-2 border-t border-white/5 px-4 py-3">
        <div className="h-6 w-6 rounded-md border border-white/10" style={{ backgroundColor: primary }} />
        <div className="h-6 w-6 rounded-md border border-white/10" style={{ backgroundColor: secondary }} />
        <span className="self-center text-[10px] text-slate-500">Colores activos</span>
      </div>
    </div>
  );
}
