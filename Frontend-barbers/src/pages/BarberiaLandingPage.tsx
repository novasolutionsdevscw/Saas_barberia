import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Scissors } from 'lucide-react';
import { api, type LandingPageData } from '../services/api';
import { LandingTheme } from '../components/landing/LandingTheme';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { ReservaSection } from '../components/landing/ReservaSection';
import { GaleriaSection } from '../components/landing/GaleriaSection';
import { FooterSection } from '../components/landing/FooterSection';
import { WhatsAppFloat } from '../components/landing/WhatsAppFloat';

export function BarberiaLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<LandingPageData | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Enlace inválido');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await api.getLandingBySlug(slug);
        setData(res);
        document.title = `${res.barberia.nombre} | Barber Nova`;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Barbería no encontrada');
        document.title = 'Barbería no encontrada';
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0c10]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#0f1117_50%)] p-6">
        <div className="card w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-300">
            <Scissors className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-white">Barbería no encontrada</h1>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const whatsapp = data.landing.whatsapp || data.barberia.telefono || '';
  const servicios = data.servicios ?? [];
  const galeria = data.galeria ?? [];

  return (
    <LandingTheme landing={data.landing}>
      <LandingNavbar barberia={data.barberia} />
      <main className="pb-24 sm:pb-28">
        <HeroSection barberia={data.barberia} landing={data.landing} />
        {slug && (
          <ReservaSection
            slug={slug}
            barberiaNombre={data.barberia.nombre}
            whatsapp={whatsapp}
            barberos={data.barberos}
            servicios={servicios}
            pagoConfig={{
              pago_modo: (data.landing.pago_modo as 'sin_pago' | 'abono' | 'pago_total') ?? 'sin_pago',
              pago_nequi: data.landing.pago_nequi,
              pago_daviplata: data.landing.pago_daviplata,
              pago_cuenta_bancaria: data.landing.pago_cuenta_bancaria,
              pago_monto_abono: data.landing.pago_monto_abono,
              pago_hold_minutos: data.landing.pago_hold_minutos,
            }}
          />
        )}
        <GaleriaSection galeria={galeria} />
        <FooterSection barberia={data.barberia} landing={data.landing} />
      </main>
      <WhatsAppFloat phone={whatsapp} barberiaNombre={data.barberia.nombre} />
    </LandingTheme>
  );
}
