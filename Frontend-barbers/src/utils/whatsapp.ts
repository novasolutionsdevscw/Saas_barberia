/** Normaliza teléfono para wa.me (Colombia 57 + 10 dígitos, u otros formatos internacionales). */
export function normalizeTelefonoWhatsapp(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.startsWith('57') && digits.length >= 12) {
    return digits.slice(0, 12);
  }

  if (digits.length === 10 && digits[0] === '3') {
    return `57${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const cleaned = normalizeTelefonoWhatsapp(phone);
  if (!cleaned) return '#';

  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleaned}${text}`;
}

/** Abre WhatsApp (app o web) con un enlace wa.me ya construido. */
export function openWhatsAppUrl(url: string | null | undefined): void {
  if (!url || url === '#') return;

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Atajo: construye wa.me y abre WhatsApp. */
export function openWhatsApp(phone: string, message?: string): void {
  openWhatsAppUrl(buildWhatsAppUrl(phone, message));
}

export type ConfirmacionWhatsAppParams = {
  whatsappUrl?: string | null;
  whatsappMensaje?: string | null;
  clienteTelefono?: string | null;
  citaTarjetaUrl?: string | null;
};

async function descargarTarjetaCita(url: string): Promise<void> {
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cita-qr.png';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Abre wa.me con el mensaje y comparte/descarga la tarjeta QR para adjuntarla en WhatsApp.
 */
export async function enviarConfirmacionWhatsApp(
  params: ConfirmacionWhatsAppParams,
): Promise<'share' | 'wame' | 'none'> {
  const mensaje = params.whatsappMensaje ?? '';
  const tarjetaUrl = params.citaTarjetaUrl ?? null;

  if (tarjetaUrl && typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      const response = await fetch(tarjetaUrl);
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], 'cita-qr.png', { type: 'image/png' });
        const shareData: ShareData = { files: [file], text: mensaje };

        if (navigator.canShare?.(shareData)) {
          await navigator.share(shareData);
          return 'share';
        }
      }
    } catch {
      /* fallback wa.me */
    }
  }

  const opened = openWhatsAppConfirmacion(params.whatsappUrl, params.clienteTelefono, mensaje);

  if (opened && tarjetaUrl) {
    await descargarTarjetaCita(tarjetaUrl);
  }

  return opened ? 'wame' : 'none';
}

/**
 * Abre wa.me al teléfono del cliente (no al WhatsApp general de la barbería).
 */
export function openWhatsAppConfirmacion(
  whatsappUrl: string | null | undefined,
  clienteTelefono: string | null | undefined,
  mensaje?: string | null,
): boolean {
  if (whatsappUrl) {
    openWhatsAppUrl(whatsappUrl);
    return true;
  }

  if (clienteTelefono && mensaje) {
    const url = buildWhatsAppUrl(clienteTelefono, mensaje);
    if (url !== '#') {
      openWhatsAppUrl(url);
      return true;
    }
  }

  return false;
}
