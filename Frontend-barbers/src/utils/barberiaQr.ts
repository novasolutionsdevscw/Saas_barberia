import QRCode from 'qrcode';

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  return (import.meta.env.VITE_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
}

export function getBarberiaPublicUrl(slugOrBarberia: string | { slug?: string; id: number }): string {
  const base = getAppBaseUrl();

  if (typeof slugOrBarberia === 'string') {
    return `${base}/b/${slugOrBarberia}`;
  }

  if (slugOrBarberia.slug) {
    return `${base}/b/${slugOrBarberia.slug}`;
  }

  return `${base}/barberia/${slugOrBarberia.id}`;
}

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 260,
    margin: 2,
    color: { dark: '#c4b5fd', light: '#0f1117' },
  });
}
