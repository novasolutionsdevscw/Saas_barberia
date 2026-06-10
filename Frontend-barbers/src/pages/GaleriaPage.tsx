import { useState } from 'react';
import { ExternalLink, Images } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GaleriaConfigPanel } from '../components/config/GaleriaConfigPanel';
import { Toast } from '../components/ui/Toast';
import { usePageToast } from '../hooks/usePageToast';
import { useAuth } from '../hooks/useAuth';
import { getBarberiaPublicUrl } from '../utils/barberiaQr';

export function GaleriaPage() {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = usePageToast();
  const [uploadCount, setUploadCount] = useState(0);

  const slug = user?.barberia?.slug;
  const publicUrl = slug ? getBarberiaPublicUrl(slug) : '';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-transparent p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-indigo-300">
              <Images className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">Landing pública</span>
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Galería de cortes</h1>
            <p className="mt-2 max-w-xl text-slate-400">
              Sube hasta <strong className="text-white">10 fotos</strong> de tus mejores trabajos. Aparecen en la
              sección <strong className="text-white">“Nuestros mejores cortes”</strong> de tu página pública.
            </p>
          </div>
          {publicUrl && (
            <a
              href={`${publicUrl}#galeria`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
              Ver en la landing
            </a>
          )}
        </div>
      </div>

      <GaleriaConfigPanel
        onMessage={(msg, type) => showToast(msg, type)}
        onCountChange={setUploadCount}
      />

      {uploadCount === 0 && (
        <p className="text-center text-sm text-slate-500">
          Aún no hay fotos. Usa el botón <strong className="text-slate-300">“Agregar foto a la galería”</strong>{' '}
          de arriba.
        </p>
      )}

      <p className="text-center text-xs text-slate-600">
        También puedes editar colores y textos en{' '}
        <Link to="/dashboard/configuracion" className="text-indigo-400 hover:underline">
          Configuración
        </Link>
        .
      </p>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
