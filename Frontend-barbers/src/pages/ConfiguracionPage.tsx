import { FormEvent, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, CreditCard, ExternalLink, Globe, ImagePlus, Images, Palette, Save, Share2, Sparkles, Type } from 'lucide-react';
import { GaleriaConfigPanel } from '../components/config/GaleriaConfigPanel';
import { api, type LandingConfig } from '../services/api';
import { useAuth, type Barberia } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { LandingPreview } from '../components/config/LandingPreview';
import { getBarberiaPublicUrl } from '../utils/barberiaQr';
import { mediaUrl, normalizeHex } from '../utils/mediaUrl';

const defaultLanding: LandingConfig = {
  color_principal: '#6366f1',
  color_secundario: '#1e1b4b',
  mensaje_bienvenida: '',
  descripcion: '',
  whatsapp: '',
  banner: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  footer_texto: '',
  pago_modo: 'sin_pago',
  pago_nequi: '',
  pago_daviplata: '',
  pago_cuenta_bancaria: '',
  pago_monto_abono: '10000',
  pago_hold_minutos: '15',
};

type TabId = 'marca' | 'apariencia' | 'contenido' | 'pagos' | 'redes';

const tabs: { id: TabId; label: string; icon: typeof Globe }[] = [
  { id: 'marca', label: 'Marca', icon: Globe },
  { id: 'apariencia', label: 'Apariencia', icon: Palette },
  { id: 'contenido', label: 'Contenido', icon: Type },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
  { id: 'redes', label: 'Redes', icon: Share2 },
];

export function ConfiguracionPage() {
  const { updateBarberiaLocal } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<TabId>('marca');

  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', direccion: '' });
  const [landing, setLanding] = useState<LandingConfig>(defaultLanding);
  const [slug, setSlug] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getConfiguracion();
        const barberia: Barberia = data.barberia;
        setForm({
          nombre: barberia.nombre || '',
          telefono: barberia.telefono || '',
          email: barberia.email || '',
          direccion: barberia.direccion || '',
        });
        setSlug(barberia.slug || '');
        setLogoPreview(barberia.logo || null);
        if (data.landing) {
          setLanding({
            ...defaultLanding,
            ...data.landing,
            color_principal: normalizeHex(data.landing.color_principal ?? ''),
            color_secundario: normalizeHex(data.landing.color_secundario ?? '', '#1e1b4b'),
            mensaje_bienvenida: data.landing.mensaje_bienvenida ?? '',
            descripcion: data.landing.descripcion ?? '',
            whatsapp: data.landing.whatsapp ?? '',
            banner: data.landing.banner ?? '',
            facebook: data.landing.facebook ?? '',
            instagram: data.landing.instagram ?? '',
            tiktok: data.landing.tiktok ?? '',
            footer_texto: data.landing.footer_texto ?? '',
            pago_modo: data.landing.pago_modo ?? 'sin_pago',
            pago_nequi: data.landing.pago_nequi ?? '',
            pago_daviplata: data.landing.pago_daviplata ?? '',
            pago_cuenta_bancaria: data.landing.pago_cuenta_bancaria ?? '',
            pago_monto_abono: String(data.landing.pago_monto_abono ?? '10000'),
            pago_hold_minutos: String(data.landing.pago_hold_minutos ?? '15'),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la configuración');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveAll = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const general = await api.updateConfiguracion(form);
      updateBarberiaLocal(general.barberia);
      if (general.barberia.slug) setSlug(general.barberia.slug);
      if (general.barberia.logo) setLogoPreview(general.barberia.logo);

      const landingRes = await api.updateLandingConfig({
        ...landing,
        color_principal: normalizeHex(landing.color_principal),
        color_secundario: normalizeHex(landing.color_secundario, '#1e1b4b'),
      });
      setLanding({
        ...landingRes.landing,
        color_principal: normalizeHex(landingRes.landing.color_principal),
        color_secundario: normalizeHex(landingRes.landing.color_secundario, '#1e1b4b'),
      });
      setMessage('Cambios guardados. Tu landing pública se actualizó.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = await api.uploadLogo(file);
      updateBarberiaLocal(data.barberia);
      setLogoPreview(data.barberia.logo ?? null);
      setMessage('Logo actualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir logo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleBannerChange = async (file?: File) => {
    if (!file) return;
    setUploadingBanner(true);
    setError('');
    try {
      const data = await api.uploadBanner(file);
      setLanding((prev) => ({ ...prev, banner: data.landing.banner }));
      setMessage('Banner actualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir banner');
    } finally {
      setUploadingBanner(false);
      if (bannerRef.current) bannerRef.current.value = '';
    }
  };

  const publicUrl = slug ? getBarberiaPublicUrl(slug) : '';
  const logoSrc = mediaUrl(logoPreview);
  const bannerSrc = mediaUrl(landing.banner);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error && !form.nombre) {
    return (
      <div className="card max-w-md text-center">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-indigo-300">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">Landing profesional</span>
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Configuración de tu página</h1>
          <p className="mt-2 max-w-xl text-slate-400">
            Personaliza marca, colores y contenido. Los cambios se reflejan en tu sitio público al guardar.
          </p>
        </div>
        {publicUrl && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0">
            <ExternalLink className="h-4 w-4" />
            Ver en vivo
          </a>
        )}
      </div>

      {publicUrl && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
          <Globe className="h-4 w-4 text-indigo-400" />
          <p className="break-all text-sm text-slate-300">{publicUrl}</p>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <div className="-mx-1 flex gap-2 overflow-x-auto border-b border-[var(--color-border)] px-1 pb-3 scrollbar-thin">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  tab === t.id
                    ? 'bg-indigo-500/20 text-indigo-200'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'marca' && (
            <section className="card space-y-4">
              <h3 className="font-semibold text-white">Datos de la barbería</h3>
              <Input label="Nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
                <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Dirección</label>
                <textarea rows={2} className="input-field resize-none" value={form.direccion} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-300">Logo</p>
                <div className="flex h-28 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[#0c0f14]">
                  {logoSrc ? <img src={logoSrc} alt="Logo" className="max-h-full max-w-full object-contain p-3" /> : <ImagePlus className="h-8 w-8 text-slate-600" />}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoChange(e.target.files?.[0])} />
                <button type="button" className="btn-ghost mt-2 w-full text-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? 'Subiendo...' : 'Cambiar logo'}
                </button>
              </div>
            </section>
          )}

          {tab === 'apariencia' && (
            <section className="card space-y-5">
              <h3 className="font-semibold text-white">Colores e imagen hero</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField id="cp" label="Color principal" value={landing.color_principal} onChange={(v) => setLanding((l) => ({ ...l, color_principal: v }))} />
                <ColorField id="cs" label="Color secundario" value={landing.color_secundario} fallback="#1e1b4b" onChange={(v) => setLanding((l) => ({ ...l, color_secundario: v }))} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-300">Banner del inicio</p>
                <div className="flex h-40 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[#0c0f14]">
                  {bannerSrc ? <img src={bannerSrc} alt="" className="h-full w-full object-cover" /> : <div className="flex flex-1 items-center justify-center text-slate-600"><ImagePlus className="h-10 w-10" /></div>}
                </div>
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleBannerChange(e.target.files?.[0])} />
                <button type="button" className="btn-ghost mt-2 w-full text-sm" disabled={uploadingBanner} onClick={() => bannerRef.current?.click()}>
                  {uploadingBanner ? 'Subiendo...' : 'Cambiar banner'}
                </button>
              </div>
            </section>
          )}

          {tab === 'contenido' && (
            <section className="card space-y-4">
              <h3 className="font-semibold text-white">Textos de la landing</h3>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Mensaje de bienvenida</label>
                <textarea rows={2} className="input-field resize-none" value={landing.mensaje_bienvenida} onChange={(e) => setLanding((l) => ({ ...l, mensaje_bienvenida: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Sobre nosotros</label>
                <textarea rows={4} className="input-field resize-none" value={landing.descripcion} onChange={(e) => setLanding((l) => ({ ...l, descripcion: e.target.value }))} />
              </div>
              <Input label="WhatsApp (573001234567)" value={landing.whatsapp} onChange={(e) => setLanding((l) => ({ ...l, whatsapp: e.target.value }))} />
              <Input label="Texto del footer" value={landing.footer_texto} onChange={(e) => setLanding((l) => ({ ...l, footer_texto: e.target.value }))} />
            </section>
          )}

          {tab === 'pagos' && (
            <section className="card space-y-4">
              <h3 className="font-semibold text-white">Pago antes de agendar</h3>
              <p className="text-sm text-slate-400">
                El cliente transfiere a tu Nequi/Daviplata y sube el comprobante. Tú validas el pago
                antes de confirmar la cita.
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Modo de reserva</label>
                <select
                  className="input-field w-full"
                  value={landing.pago_modo ?? 'sin_pago'}
                  onChange={(e) => setLanding((l) => ({ ...l, pago_modo: e.target.value as LandingConfig['pago_modo'] }))}
                >
                  <option value="sin_pago">Sin pago (solo confirmación del barbero)</option>
                  <option value="abono">Abono fijo antes de agendar</option>
                  <option value="pago_total">Pago total del servicio</option>
                </select>
              </div>
              {landing.pago_modo === 'abono' && (
                <Input
                  label="Monto del abono (COP)"
                  type="number"
                  min={0}
                  value={String(landing.pago_monto_abono ?? '')}
                  onChange={(e) => setLanding((l) => ({ ...l, pago_monto_abono: e.target.value }))}
                />
              )}
              <Input
                label="Nequi"
                value={landing.pago_nequi ?? ''}
                onChange={(e) => setLanding((l) => ({ ...l, pago_nequi: e.target.value }))}
                placeholder="300 123 4567"
              />
              <Input
                label="Daviplata"
                value={landing.pago_daviplata ?? ''}
                onChange={(e) => setLanding((l) => ({ ...l, pago_daviplata: e.target.value }))}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Cuenta bancaria (opcional)</label>
                <textarea
                  rows={3}
                  className="input-field resize-none"
                  value={landing.pago_cuenta_bancaria ?? ''}
                  onChange={(e) => setLanding((l) => ({ ...l, pago_cuenta_bancaria: e.target.value }))}
                  placeholder="Banco, tipo de cuenta, número, titular..."
                />
              </div>
              <Input
                label="Minutos para subir comprobante"
                type="number"
                min={5}
                max={60}
                value={String(landing.pago_hold_minutos ?? '15')}
                onChange={(e) => setLanding((l) => ({ ...l, pago_hold_minutos: e.target.value }))}
              />
            </section>
          )}

          {tab === 'galeria' && (
            <GaleriaConfigPanel
              onMessage={(msg, type) => {
                if (type === 'success') {
                  setMessage(msg);
                  setError('');
                } else {
                  setError(msg);
                  setMessage('');
                }
              }}
            />
          )}

          {tab === 'redes' && (
            <section className="card space-y-4">
              <h3 className="font-semibold text-white">Redes sociales</h3>
              <Input label="Facebook URL" value={landing.facebook} onChange={(e) => setLanding((l) => ({ ...l, facebook: e.target.value }))} />
              <Input label="Instagram URL" value={landing.instagram} onChange={(e) => setLanding((l) => ({ ...l, instagram: e.target.value }))} />
              <Input label="TikTok URL" value={landing.tiktok} onChange={(e) => setLanding((l) => ({ ...l, tiktok: e.target.value }))} />
            </section>
          )}

          {message && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar y publicar'}
          </button>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="mb-3 flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm font-medium text-slate-300 lg:hidden"
          >
            Vista previa
            {previewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <div className={`${previewOpen ? 'block' : 'hidden'} lg:block`}>
            <LandingPreview nombre={form.nombre} logo={logoPreview} landing={landing} />
            <p className="mt-3 text-center text-xs text-slate-500">Vista previa en tiempo real</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  fallback,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  fallback?: string;
  onChange: (v: string) => void;
}) {
  const hex = normalizeHex(value, fallback);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">{label}</label>
      <div className="flex gap-2">
        <input id={id} type="color" value={hex} onChange={(e) => onChange(e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--color-border)] bg-transparent" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input-field flex-1" />
      </div>
    </div>
  );
}
