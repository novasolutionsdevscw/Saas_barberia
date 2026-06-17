<?php

namespace App\Services;

use App\Models\Turno;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CitaTarjetaService
{
    public function __construct(
        private readonly FrontendUrlResolver $frontendUrl,
    ) {}

    private const ANCHO = 440;

    private const PADDING = 24;

    /** Genera PNG tipo tarjeta de cita y devuelve URL pública temporal. */
    public function generarUrlPublica(Turno $turno): ?string
    {
        try {
            $turno->loadMissing(['cliente', 'servicio', 'barbero', 'barberia']);
            $relative = 'citas-temp/'.$turno->uuid.'.png';

            $png = $this->renderPng($turno);
            Storage::disk('public')->put($relative, $png);

            $this->limpiarAntiguas();

            return $this->urlAbsoluta($relative);
        } catch (\Throwable $e) {
            Log::error('CitaTarjetaService: no se pudo generar tarjeta', [
                'uuid' => $turno->uuid,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function renderPng(Turno $turno): string
    {
        if (! extension_loaded('gd')) {
            throw new \RuntimeException('La extensión GD de PHP es necesaria para generar la tarjeta.');
        }

        $citaUrl = $this->frontendUrl->urlCita($turno->uuid);
        $fecha = $turno->fecha instanceof \Carbon\Carbon
            ? $turno->fecha->format('d/m/Y')
            : date('d/m/Y', strtotime((string) $turno->fecha));
        $hora = substr((string) $turno->hora, 0, 5);

        $alto = 820;
        $img = imagecreatetruecolor(self::ANCHO, $alto);
        imagealphablending($img, true);

        $this->pintarFondo($img, $alto);

        $y = self::PADDING + 8;
        $y = $this->textoCentrado($img, $turno->barberia->nombre ?? 'Barbería', $y, 22, true);
        $y = $this->textoCentrado($img, 'Tu cita agendada', $y + 10, 13, false, $this->color($img, '#94a3b8'));

        $cardX = self::PADDING;
        $cardY = $y + 20;
        $cardW = self::ANCHO - (self::PADDING * 2);
        $cardH = 520;
        $this->rectanguloRedondeado($img, $cardX, $cardY, $cardW, $cardH, 16, $this->color($img, '#141b2d'), $this->color($img, '#ffffff22'));

        $innerX = $cardX + 20;
        $innerW = $cardW - 40;
        $rowY = $cardY + 24;

        $rowY = $this->filaEstado($img, $innerX, $innerW, $rowY, $turno->estado);
        $rowY = $this->filaDetalle($img, $innerX, $innerW, $rowY + 14, 'Servicio', $turno->servicio->nombre ?? '—');
        $rowY = $this->filaDetalle($img, $innerX, $innerW, $rowY + 10, 'Barbero', $turno->barbero->nombre ?? '—');
        $rowY = $this->filaDetalle($img, $innerX, $innerW, $rowY + 10, 'Cliente', $turno->cliente->nombre ?? '—');
        $rowY = $this->filaDetalle($img, $innerX, $innerW, $rowY + 10, 'Fecha y hora', "{$fecha} · {$hora}");
        $rowY = $this->filaDetalle($img, $innerX, $innerW, $rowY + 10, 'Precio', $this->formatPrecio((float) $turno->precio), $this->color($img, '#a5b4fc'));

        $sepY = $cardY + $cardH - 250;
        imageline($img, $innerX, $sepY, $innerX + $innerW, $sepY, $this->color($img, '#ffffff18'));

        $this->textoCentrado($img, 'Presenta este código QR en la barbería', $sepY + 18, 12, false, $this->color($img, '#94a3b8'));

        $qrSize = 200;
        $qrX = (int) ((self::ANCHO - $qrSize) / 2);
        $qrY = $sepY + 48;
        $this->pegarQr($img, $citaUrl, $qrX, $qrY, $qrSize);

        $this->textoCentrado($img, 'Barber Nova', $cardY + $cardH + 28, 11, false, $this->color($img, '#64748b'));

        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);

        if ($png === false) {
            throw new \RuntimeException('No se pudo serializar la imagen PNG.');
        }

        return $png;
    }

    private function pegarQr(\GdImage $img, string $data, int $x, int $y, int $size): void
    {
        $writer = new PngWriter;
        $qrCode = new QrCode(data: $data, size: $size, margin: 8);
        $result = $writer->write($qrCode);
        $qrImg = imagecreatefromstring($result->getString());

        if (! $qrImg) {
            throw new \RuntimeException('No se pudo generar el código QR.');
        }

        $bg = imagecolorallocate($qrImg, 255, 255, 255);
        $pad = 12;
        $total = $size + ($pad * 2);
        $framed = imagecreatetruecolor($total, $total);
        imagefilledrectangle($framed, 0, 0, $total, $total, $bg);
        imagecopy($framed, $qrImg, $pad, $pad, 0, 0, $size, $size);
        imagecopy($img, $framed, $x - $pad, $y - $pad, 0, 0, $total, $total);

        imagedestroy($qrImg);
        imagedestroy($framed);
    }

    private function filaEstado(\GdImage $img, int $x, int $w, int $y, string $estado): int
    {
        $this->texto($img, 'Estado', $x, $y, 12, false, $this->color($img, '#64748b'));

        $label = match ($estado) {
            'confirmado' => 'Confirmado',
            'pendiente' => 'Pendiente',
            'pendiente_validacion' => 'Validar pago',
            'esperando_pago' => 'Esperando pago',
            'cancelado' => 'Cancelado',
            'completado' => 'Completado',
            default => ucfirst(str_replace('_', ' ', $estado)),
        };

        $badgeColor = match ($estado) {
            'confirmado', 'completado' => $this->color($img, '#6366f1'),
            'pendiente', 'pendiente_validacion', 'esperando_pago' => $this->color($img, '#d97706'),
            'cancelado' => $this->color($img, '#dc2626'),
            default => $this->color($img, '#6366f1'),
        };

        $font = $this->fontRegular();
        $fontSize = 11;
        $box = imagettfbbox($fontSize, 0, $font, $label);
        $textW = abs($box[2] - $box[0]);
        $badgeW = $textW + 24;
        $badgeH = 24;
        $badgeX = $x + $w - $badgeW;

        $this->rectanguloRedondeado($img, $badgeX, $y - 4, $badgeW, $badgeH, 12, $badgeColor, $badgeColor);
        $this->texto($img, $label, $badgeX + 12, $y + 12, $fontSize, false, $this->color($img, '#ffffff'), $font);

        return $y + 22;
    }

    private function filaDetalle(\GdImage $img, int $x, int $w, int $y, string $label, string $value, ?int $valueColor = null): int
    {
        $valueColor ??= $this->color($img, '#e2e8f0');
        $this->texto($img, $label, $x, $y, 12, false, $this->color($img, '#64748b'));

        $value = $this->truncar($value, 28);
        $font = $this->fontRegular();
        $fontSize = 12;
        $box = imagettfbbox($fontSize, 0, $font, $value);
        $textW = abs($box[2] - $box[0]);
        $this->texto($img, $value, $x + $w - $textW, $y, $fontSize, false, $valueColor, $font);

        return $y + 18;
    }

    private function pintarFondo(\GdImage $img, int $alto): void
    {
        for ($y = 0; $y < $alto; $y++) {
            $ratio = $y / max(1, $alto - 1);
            $r = (int) (15 + (10 - 15) * $ratio);
            $g = (int) (23 + (12 - 23) * $ratio);
            $b = (int) (42 + (16 - 42) * $ratio);
            $color = imagecolorallocate($img, $r, $g, $b);
            imageline($img, 0, $y, self::ANCHO, $y, $color);
        }
    }

    private function rectanguloRedondeado(\GdImage $img, int $x, int $y, int $w, int $h, int $r, int $fill, int $border): void
    {
        imagefilledrectangle($img, $x + $r, $y, $x + $w - $r, $y + $h, $fill);
        imagefilledrectangle($img, $x, $y + $r, $x + $w, $y + $h - $r, $fill);
        imagefilledellipse($img, $x + $r, $y + $r, $r * 2, $r * 2, $fill);
        imagefilledellipse($img, $x + $w - $r, $y + $r, $r * 2, $r * 2, $fill);
        imagefilledellipse($img, $x + $r, $y + $h - $r, $r * 2, $r * 2, $fill);
        imagefilledellipse($img, $x + $w - $r, $y + $h - $r, $r * 2, $r * 2, $fill);

        imagerectangle($img, $x, $y, $x + $w, $y + $h, $border);
    }

    private function textoCentrado(\GdImage $img, string $text, int $y, int $size, bool $bold, ?int $color = null): int
    {
        $color ??= $this->color($img, '#ffffff');
        $font = $bold ? $this->fontBold() : $this->fontRegular();
        $box = imagettfbbox($size, 0, $font, $text);
        $textW = abs($box[2] - $box[0]);
        $x = (int) ((self::ANCHO - $textW) / 2);
        imagettftext($img, $size, 0, $x, $y + $size, $color, $font, $text);

        return $y + $size + 6;
    }

    private function texto(\GdImage $img, string $text, int $x, int $y, int $size, bool $bold, int $color, ?string $font = null): void
    {
        $font ??= $bold ? $this->fontBold() : $this->fontRegular();
        imagettftext($img, $size, 0, $x, $y + $size, $color, $font, $text);
    }

    private function fontRegular(): string
    {
        return $this->resolverFuente('DejaVuSans.ttf', 'arial.ttf');
    }

    private function fontBold(): string
    {
        return $this->resolverFuente('DejaVuSans-Bold.ttf', 'arialbd.ttf');
    }

    private function resolverFuente(string $nombreProyecto, string $nombreWindows): string
    {
        $proyecto = resource_path('fonts/'.$nombreProyecto);
        if (is_readable($proyecto)) {
            return $proyecto;
        }

        $windows = 'C:\\Windows\\Fonts\\'.$nombreWindows;
        if (is_readable($windows)) {
            return $windows;
        }

        throw new \RuntimeException("No se encontró fuente para generar la tarjeta ({$nombreProyecto}).");
    }

    private function color(\GdImage $img, string $hex): int
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 8) {
            $r = hexdec(substr($hex, 0, 2));
            $g = hexdec(substr($hex, 2, 2));
            $b = hexdec(substr($hex, 4, 2));

            return imagecolorallocate($img, $r, $g, $b);
        }

        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        return imagecolorallocate($img, $r, $g, $b);
    }

    private function formatPrecio(float $precio): string
    {
        return '$ '.number_format($precio, 0, ',', '.');
    }

    private function truncar(string $texto, int $max): string
    {
        if (mb_strlen($texto) <= $max) {
            return $texto;
        }

        return mb_substr($texto, 0, $max - 1).'…';
    }

    private function limpiarAntiguas(): void
    {
        $horas = (int) config('barbernova.cita_tarjeta_ttl_horas', 72);
        $limite = now()->subHours($horas)->getTimestamp();

        foreach (Storage::disk('public')->files('citas-temp') as $file) {
            $full = Storage::disk('public')->path($file);
            if (is_file($full) && filemtime($full) < $limite) {
                Storage::disk('public')->delete($file);
            }
        }
    }

    private function urlCitaValidacionBarbero(string $uuid): string
    {
        return $this->frontendUrl->urlCitaValidacionBarbero($uuid);
    }

    private function urlAbsoluta(string $relative): string
    {
        $path = Storage::disk('public')->url($relative);

        return str_starts_with($path, 'http') ? $path : rtrim(config('app.url'), '/').$path;
    }
}
