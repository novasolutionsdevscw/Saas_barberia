<?php

namespace App\Services;

use App\Models\Turno;

class WhatsAppService
{
    public function __construct(
        private readonly CitaTarjetaService $tarjeta,
        private readonly FrontendUrlResolver $frontendUrl,
    ) {}

    public function urlCita(string $uuid, ?\Illuminate\Http\Request $request = null): string
    {
        return $this->frontendUrl->urlCita($uuid, $request);
    }

    public function urlCitaValidacionBarbero(string $uuid, ?\Illuminate\Http\Request $request = null): string
    {
        return $this->frontendUrl->urlCitaValidacionBarbero($uuid, $request);
    }

    public function urlTarjetaCita(Turno $turno): ?string
    {
        return $this->tarjeta->generarUrlPublica($turno);
    }

    public function mensajeConfirmacionTurno(Turno $turno): string
    {
        $turno->loadMissing(['cliente', 'servicio', 'barbero', 'barberia']);

        $citaUrl = $this->urlCita($turno->uuid);
        $fecha = $turno->fecha instanceof \Carbon\Carbon
            ? $turno->fecha->format('d/m/Y')
            : date('d/m/Y', strtotime((string) $turno->fecha));
        $hora = substr((string) $turno->hora, 0, 5);
        $barberiaNombre = $turno->barberia->nombre ?? 'la barbería';
        $nombreCliente = $turno->cliente->nombre ?? 'cliente';

        return implode("\n", [
            "¡Hola {$nombreCliente}!",
            "Tu cita en {$barberiaNombre} fue confirmada.",
            '',
            "Servicio: {$turno->servicio->nombre}",
            "Barbero: {$turno->barbero->nombre}",
            "Fecha: {$fecha} a las {$hora}",
            '',
            'Adjunto tu tarjeta con el código QR. Preséntala al llegar a la barbería.',
            $citaUrl,
        ]);
    }

    /**
     * Genera tarjeta QR y enlace wa.me para que el barbero envíe manualmente.
     *
     * @return array{wa_me_url: ?string, tarjeta_url: ?string}
     */
    public function prepararConfirmacionWaMe(Turno $turno): array
    {
        return [
            'wa_me_url' => $this->waMeConfirmacionTurno($turno),
            'tarjeta_url' => $this->urlTarjetaCita($turno),
        ];
    }

    /**
     * Enlace wa.me con mensaje prellenado para que el barbero envíe desde WhatsApp.
     */
    public function waMeConfirmacionTurno(Turno $turno): ?string
    {
        $turno->loadMissing(['cliente']);

        $telefono = $turno->cliente?->telefono;
        if (! $telefono) {
            return null;
        }

        return $this->waMeUrl($telefono, $this->mensajeConfirmacionTurno($turno));
    }

    public function waMeUrl(string $telefono, string $mensaje): ?string
    {
        $digits = $this->normalizarTelefono($telefono);

        if (! $digits) {
            return null;
        }

        return 'https://wa.me/'.$digits.'?text='.rawurlencode($mensaje);
    }

    public function normalizarTelefono(string $telefono): ?string
    {
        $digits = preg_replace('/\D/', '', trim($telefono));

        if (! $digits) {
            return null;
        }

        if (strlen($digits) === 11 && str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        if (str_starts_with($digits, '57') && strlen($digits) >= 12) {
            return substr($digits, 0, 12);
        }

        if (strlen($digits) === 10 && $digits[0] === '3') {
            return '57'.$digits;
        }

        if (strlen($digits) >= 10 && strlen($digits) <= 15) {
            return $digits;
        }

        return null;
    }
}
