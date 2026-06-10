const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Limpia el texto leído por cualquier escáner QR (URL, UUID, enlace wa.me, etc.).
 */
export function normalizarCodigoQr(texto: string): string {
  let value = texto.trim();

  try {
    value = decodeURIComponent(value);
  } catch {
    /* mantener original */
  }

  return value.replace(/\s+/g, '');
}

/**
 * Extrae el UUID de un turno desde URL de cita, enlace de validación, UUID suelto, etc.
 */
export function extraerUuidTurno(texto: string): string | null {
  const normalized = normalizarCodigoQr(texto);
  if (!normalized) return null;

  const match = normalized.match(UUID_REGEX);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Prepara el código para enviar al backend (conserva URL completa o UUID).
 */
export function prepararCodigoParaApi(texto: string): string {
  const normalized = normalizarCodigoQr(texto);
  const uuid = extraerUuidTurno(normalized);
  return uuid ?? normalized;
}
