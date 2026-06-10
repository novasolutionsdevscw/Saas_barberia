/** Descarga o comparte una imagen PNG (en móvil permite guardar en galería vía menú compartir). */
export async function saveQrImageBlob(blob: Blob, filename: string): Promise<'shared' | 'downloaded'> {
  const safeName = filename.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ]+/g, '-').replace(/^-+|-+$/g, '') || 'cita-qr';
  const file = new File([blob], `${safeName}.png`, { type: 'image/png' });

  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'QR de tu cita',
        text: 'Presenta este código QR en la barbería',
      });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'shared';
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeName}.png`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return 'downloaded';
}

export async function saveQrFromCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<'shared' | 'downloaded'> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png', 1);
  });

  if (!blob) {
    throw new Error('No se pudo generar la imagen del QR');
  }

  return saveQrImageBlob(blob, filename);
}
