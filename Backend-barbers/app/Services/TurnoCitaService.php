<?php

namespace App\Services;

use App\Models\Barbero;
use App\Models\Turno;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class TurnoCitaService
{
    public function __construct(
        private readonly WhatsAppService $whatsApp,
    ) {}

    public function confirmar(Turno $turno, User $actor): array
    {
        if ($turno->estado !== 'pendiente') {
            throw ValidationException::withMessages([
                'estado' => ['Solo se pueden confirmar citas pendientes.'],
            ]);
        }

        $turno->estado = 'confirmado';
        $turno->confirmado_at = now();
        $turno->save();

        $turno->load(['barbero', 'servicio', 'cliente', 'barberia']);
        $whatsapp = $this->whatsApp->prepararConfirmacionWaMe($turno);
        $mensaje = $this->whatsApp->mensajeConfirmacionTurno($turno);

        $mensajeRespuesta = ! empty($whatsapp['wa_me_url'])
            ? 'Cita confirmada. Se abrirá WhatsApp para enviar la tarjeta al cliente.'
            : 'Cita confirmada. El cliente no tiene un teléfono válido para WhatsApp.';

        return [
            'turno' => $turno,
            'whatsapp_url' => $whatsapp['wa_me_url'],
            'whatsapp_mensaje' => $mensaje,
            'cliente_telefono' => $turno->cliente?->telefono,
            'cita_url' => $this->whatsApp->urlCita($turno->uuid),
            'cita_tarjeta_url' => $whatsapp['tarjeta_url'],
            'qr_url' => $whatsapp['tarjeta_url'],
            'mensaje' => $mensajeRespuesta,
        ];
    }

    public function consultarPorCodigo(string $codigo, Barbero $barbero): array
    {
        $turno = $this->buscarTurnoPorCodigo($codigo, $barbero);
        $esMio = (int) $turno->barbero_id === (int) $barbero->id;

        return [
            'turno' => $this->formatoPublico($turno),
            'es_mio' => $esMio,
            'acciones' => $this->accionesDisponibles($turno, $esMio),
        ];
    }

    public function aplicarAccionPorCodigo(string $codigo, Barbero $barbero, string $accion, ?User $actor = null): array
    {
        $turno = $this->buscarTurnoPorCodigo($codigo, $barbero);

        if ((int) $turno->barbero_id !== (int) $barbero->id) {
            throw ValidationException::withMessages([
                'codigo' => ['Esta cita pertenece a otro barbero. Solo puedes gestionar tus propias citas.'],
            ]);
        }

        $acciones = $this->accionesDisponibles($turno, true);

        if (! in_array($accion, $acciones, true)) {
            throw ValidationException::withMessages([
                'accion' => ['No puedes aplicar esta acción con el estado actual de la cita.'],
            ]);
        }

        return match ($accion) {
            'confirmar' => $this->withAcciones($this->confirmarDesdeQr($turno, $actor)),
            'completar' => $this->withAcciones($this->completarDesdeQr($turno)),
            'cancelar' => $this->withAcciones($this->cancelarDesdeQr($turno)),
            default => throw ValidationException::withMessages([
                'accion' => ['Acción no válida.'],
            ]),
        };
    }

    public function validarPorCodigo(string $codigo, Barbero $barbero, ?User $actor = null): array
    {
        return $this->aplicarAccionPorCodigo($codigo, $barbero, 'completar', $actor);
    }

    /** @return array{turno: Turno, ya_validado: bool, auto_confirmado: bool} */
    private function completarDesdeQr(Turno $turno): array
    {
        if ($turno->estado === 'cancelado') {
            throw ValidationException::withMessages([
                'codigo' => ['Esta cita está cancelada y no puede validarse.'],
            ]);
        }

        $yaValidado = $turno->estado === 'completado' && $turno->validado_at;
        $autoConfirmado = $turno->estado === 'pendiente';

        if (! $yaValidado) {
            if ($turno->estado === 'pendiente') {
                $turno->confirmado_at = now();
            }

            $turno->estado = 'completado';
            $turno->validado_at = now();
            $turno->save();
        }

        return [
            'turno' => $turno->fresh(['servicio', 'cliente', 'barbero', 'barberia']),
            'ya_validado' => $yaValidado,
            'auto_confirmado' => $autoConfirmado && ! $yaValidado,
        ];
    }

    /** @return array{turno: Turno, ya_validado: bool, auto_confirmado: bool} */
    private function confirmarDesdeQr(Turno $turno, ?User $actor): array
    {
        if (! $actor) {
            throw ValidationException::withMessages([
                'accion' => ['No se pudo identificar al usuario que confirma la cita.'],
            ]);
        }

        $result = $this->confirmar($turno, $actor);

        return [
            'turno' => $result['turno'],
            'ya_validado' => false,
            'auto_confirmado' => false,
            'whatsapp_url' => $result['whatsapp_url'],
            'whatsapp_mensaje' => $result['whatsapp_mensaje'],
            'cliente_telefono' => $result['cliente_telefono'],
            'qr_url' => $result['qr_url'] ?? $result['cita_tarjeta_url'] ?? null,
            'cita_tarjeta_url' => $result['cita_tarjeta_url'] ?? $result['qr_url'] ?? null,
        ];
    }

    /** @return array{turno: Turno, ya_validado: bool, auto_confirmado: bool} */
    private function cancelarDesdeQr(Turno $turno): array
    {
        $turno->estado = 'cancelado';
        $turno->save();

        return [
            'turno' => $turno->fresh(['servicio', 'cliente', 'barbero', 'barberia']),
            'ya_validado' => false,
            'auto_confirmado' => false,
        ];
    }

    private function buscarTurnoPorCodigo(string $codigo, Barbero $barbero): Turno
    {
        $uuid = $this->extraerUuidDesdeCodigo($codigo);

        $turno = Turno::where('uuid', $uuid)
            ->where('barberia_id', $barbero->barberia_id)
            ->first();

        if (! $turno) {
            throw ValidationException::withMessages([
                'codigo' => ['No existe ninguna cita con este código QR.'],
            ]);
        }

        return $turno->load(['servicio', 'cliente', 'barbero', 'barberia']);
    }

    /** @return list<string> */
    private function accionesDisponibles(Turno $turno, bool $esMio): array
    {
        if (! $esMio || $turno->estado === 'cancelado' || $turno->estado === 'completado') {
            return [];
        }

        $acciones = [];

        if ($turno->estado === 'pendiente') {
            $acciones[] = 'confirmar';
            $acciones[] = 'cancelar';
        }

        if (in_array($turno->estado, ['pendiente', 'confirmado'], true)) {
            $acciones[] = 'completar';
        }

        return array_values(array_unique($acciones));
    }

    /** @param array{turno: Turno} $result */
    private function withAcciones(array $result): array
    {
        $result['acciones'] = $this->accionesDisponibles($result['turno'], true);

        return $result;
    }

    /** @deprecated Use validarPorCodigo() */
    public function validarPorUuid(string $uuid, Barbero $barbero): Turno
    {
        return $this->validarPorCodigo($uuid, $barbero)['turno'];
    }

    private function extraerUuidDesdeCodigo(string $codigo): string
    {
        $codigo = trim(urldecode($codigo));

        if (preg_match('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i', $codigo, $matches)) {
            return strtolower($matches[0]);
        }

        throw ValidationException::withMessages([
            'codigo' => ['El código QR no contiene un identificador de cita válido.'],
        ]);
    }

    public function formatoPublico(Turno $turno): array
    {
        $turno->load(['barbero', 'servicio', 'cliente', 'barberia']);

        return [
            'uuid' => $turno->uuid,
            'estado' => $turno->estado,
            'fecha' => $turno->fecha?->format('Y-m-d') ?? (string) $turno->fecha,
            'hora' => substr((string) $turno->hora, 0, 5),
            'precio' => (float) $turno->precio,
            'servicio' => $turno->servicio->nombre,
            'barbero' => $turno->barbero->nombre,
            'barberia' => $turno->barberia->nombre,
            'cliente' => $turno->cliente->nombre,
            'confirmado_at' => $turno->confirmado_at?->toIso8601String(),
            'validado_at' => $turno->validado_at?->toIso8601String(),
            'cita_url' => $this->whatsApp->urlCita($turno->uuid),
            'qr_payload' => $this->whatsApp->urlCita($turno->uuid),
        ];
    }
}
