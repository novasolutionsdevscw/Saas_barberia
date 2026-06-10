import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

type WhatsAppFloatProps = {
  phone: string;
  barberiaNombre: string;
};

export function WhatsAppFloat({ phone, barberiaNombre }: WhatsAppFloatProps) {
  if (!phone) return null;

  return (
    <a
      href={buildWhatsAppUrl(phone, `Hola, quiero reservar en ${barberiaNombre}`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition hover:scale-110 hover:bg-emerald-400 active:scale-95 sm:right-6"
      style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
