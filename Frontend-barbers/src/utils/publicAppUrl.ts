const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];

function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.includes(hostname);
}

function isPrivateIp(hostname: string): boolean {
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname);
}

function configuredAppOrigin(): string | null {
  const raw = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin.replace(/\/$/, '');
  } catch {
    return raw.replace(/\/$/, '');
  }
}

function isDevOnlyOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return isLocalHost(host) || isPrivateIp(host);
  } catch {
    return true;
  }
}

/**
 * Origen para QR y enlaces compartidos.
 * - Producción: siempre el dominio real del navegador (no depende de .env de dev).
 * - Desarrollo en localhost: usa VITE_APP_URL (IP LAN) para que el QR abra en el celular.
 */
export function resolveAppOrigin(): string {
  if (typeof window === 'undefined') {
    return configuredAppOrigin() ?? '';
  }

  const current = window.location.origin.replace(/\/$/, '');

  if (import.meta.env.PROD && !isLocalHost(window.location.hostname) && !isPrivateIp(window.location.hostname)) {
    return current;
  }

  const configured = configuredAppOrigin();

  if (isLocalHost(window.location.hostname) && configured && !isDevOnlyOrigin(configured)) {
    return configured;
  }

  if (configured && !isDevOnlyOrigin(configured) && isDevOnlyOrigin(current)) {
    return configured;
  }

  return current;
}

export function withCurrentOrigin(url: string): string {
  if (!url) return url;

  const origin = resolveAppOrigin();
  if (!origin) return url;

  try {
    const parsed = new URL(url, origin);
    const originHost = new URL(origin).hostname;

    if ((isLocalHost(parsed.hostname) || isPrivateIp(parsed.hostname)) && !isDevOnlyOrigin(origin)) {
      return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    if (import.meta.env.PROD && isDevOnlyOrigin(parsed.href) && !isDevOnlyOrigin(origin)) {
      return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.href;
  } catch {
    if (url.startsWith('/')) return `${origin}${url}`;
    return url;
  }
}

export function buildCitaPublicUrl(uuid: string): string {
  const origin = resolveAppOrigin();
  if (!origin) return `/cita/${uuid}`;
  return `${origin}/cita/${uuid}`;
}
