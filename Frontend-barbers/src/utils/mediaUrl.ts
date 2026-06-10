/**
 * Convierte rutas de archivos del backend a URLs que cargan en el navegador.
 * En desarrollo, Vite hace proxy de /storage → Laravel.
 */
const STORAGE_ORIGIN = (import.meta.env.VITE_STORAGE_ORIGIN as string | undefined)?.replace(
  /\/$/,
  '',
);

function resolveStoragePath(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/storage/')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith('/storage/')) {
        return parsed.pathname;
      }
    } catch {
      return null;
    }
    return null;
  }

  const withoutLeading = trimmed.replace(/^\/+/, '');
  if (withoutLeading.startsWith('storage/')) {
    return `/${withoutLeading}`;
  }
  if (withoutLeading.startsWith('uploads/')) {
    return `/storage/${withoutLeading}`;
  }

  return null;
}

export function mediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  const path = resolveStoragePath(url);
  if (!path) return undefined;

  if (STORAGE_ORIGIN) {
    return `${STORAGE_ORIGIN}${path}`;
  }

  return path;
}

export function normalizeHex(value?: string | null, fallback = '#6366f1'): string {
  const trimmed = (value ?? '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`;
  return fallback;
}
