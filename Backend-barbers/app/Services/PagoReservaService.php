<?php

namespace App\Services;

use App\Helpers\AssetHelper;
use App\Models\Configuracion;
use App\Models\Turno;
use App\Models\User;
use App\Repositories\ConfiguracionRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PagoReservaService
{
    public const MODO_SIN_PAGO = 'sin_pago';

    public const MODO_ABONO = 'abono';

    public const MODO_PAGO_TOTAL = 'pago_total';

    public const MOTIVOS_RECHAZO = [
        'comprobante_ilegible' => 'Comprobante ilegible',
        'pago_no_encontrado' => 'Pago no encontrado',
        'valor_incorrecto' => 'Valor incorrecto',
        'horario_ocupado' => 'Horario ya no disponible',
    ];

    public function __construct(
        private readonly ConfiguracionRepository $configuracionRepository,
        private readonly TurnoService $turnoService,
        private readonly TurnoCitaService $citaService,
        private readonly WhatsAppService $whatsApp,
    ) {}

    /** @return array<string, string> */
    public function getConfig(int $barberiaId): array
    {
        $map = $this->configuracionRepository->getMap($barberiaId);

        return [
            'pago_modo' => $map[Configuracion::CLAVE_PAGO_MODO] ?? Configuracion::DEFAULTS[Configuracion::CLAVE_PAGO_MODO],
            'pago_nequi' => $map[Configuracion::CLAVE_PAGO_NEQUI] ?? '',
            'pago_daviplata' => $map[Configuracion::CLAVE_PAGO_DAVIPLATA] ?? '',
            'pago_cuenta_bancaria' => $map[Configuracion::CLAVE_PAGO_CUENTA] ?? '',
            'pago_monto_abono' => $map[Configuracion::CLAVE_PAGO_MONTO_ABONO] ?? Configuracion::DEFAULTS[Configuracion::CLAVE_PAGO_MONTO_ABONO],
            'pago_hold_minutos' => $map[Configuracion::CLAVE_PAGO_HOLD_MINUTOS] ?? Configuracion::DEFAULTS[Configuracion::CLAVE_PAGO_HOLD_MINUTOS],
        ];
    }

    public function requierePago(int $barberiaId): bool
    {
        $modo = $this->getConfig($barberiaId)['pago_modo'];

        return in_array($modo, [self::MODO_ABONO, self::MODO_PAGO_TOTAL], true);
    }

    public function calcularMonto(int $barberiaId, float $precioServicio): float
    {
        $config = $this->getConfig($barberiaId);

        return match ($config['pago_modo']) {
            self::MODO_ABONO => max(0, (float) $config['pago_monto_abono']),
            self::MODO_PAGO_TOTAL => max(0, $precioServicio),
            default => 0,
        };
    }

    public function crearPublicoConPago(array $data): Turno
    {
        $config = $this->getConfig($data['barberia_id']);

        if (! $this->requierePago($data['barberia_id'])) {
            return $this->turnoService->crearPublico($data);
        }

        $holdMinutos = max(5, min(60, (int) $config['pago_hold_minutos']));
        $precio = $this->turnoService->resolverPrecioPublico($data);
        $monto = $this->calcularMonto($data['barberia_id'], $precio);

        if ($monto <= 0) {
            return $this->turnoService->crearPublico($data);
        }

        $this->turnoService->validarCreacionPublica($data);

        $cliente = $this->turnoService->resolverClientePublico($data);

        return Turno::create([
            'uuid' => Str::uuid(),
            'barberia_id' => $data['barberia_id'],
            'barbero_id' => $data['barbero_id'],
            'servicio_id' => $data['servicio_id'],
            'cliente_id' => $cliente->id,
            'fecha' => $data['fecha'],
            'hora' => $data['hora'],
            'precio' => $precio,
            'pago_monto_esperado' => $monto,
            'estado' => 'esperando_pago',
            'hold_expires_at' => now()->addMinutes($holdMinutos),
        ]);
    }

    public function subirComprobante(Turno $turno, string $telefono, UploadedFile $file): Turno
    {
        $turno->loadMissing('cliente');

        if ($turno->cliente?->telefono !== $telefono) {
            throw ValidationException::withMessages([
                'telefono' => ['No autorizado para subir comprobante en esta cita.'],
            ]);
        }

        if (! in_array($turno->estado, ['esperando_pago', 'pendiente_validacion'], true)) {
            throw ValidationException::withMessages([
                'estado' => ['Esta cita no acepta comprobantes en este momento.'],
            ]);
        }

        if ($turno->estado === 'esperando_pago' && $turno->hold_expires_at && $turno->hold_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'hold' => ['El tiempo para subir el comprobante expiró. Intenta reservar de nuevo.'],
            ]);
        }

        $this->deleteComprobante($turno->comprobante_url);

        $path = $file->store("uploads/{$turno->barberia_id}/comprobantes", 'public');

        $turno->comprobante_url = AssetHelper::toPublicPath($path);
        $turno->comprobante_subido_at = now();
        $turno->pago_motivo_rechazo = null;
        $turno->estado = 'pendiente_validacion';
        $turno->hold_expires_at = null;
        $turno->save();

        return $turno->fresh(['barbero', 'servicio', 'cliente', 'barberia']);
    }

    public function aprobarPago(Turno $turno, User $actor): array
    {
        if ($turno->estado !== 'pendiente_validacion') {
            throw ValidationException::withMessages([
                'estado' => ['Solo se pueden aprobar citas con pago pendiente de validación.'],
            ]);
        }

        $turno->pago_validado_at = now();
        $turno->estado = 'pendiente';
        $turno->save();

        return $this->citaService->confirmar($turno->fresh(), $actor);
    }

    public function rechazarPago(Turno $turno, string $motivo, User $actor): Turno
    {
        if ($turno->estado !== 'pendiente_validacion') {
            throw ValidationException::withMessages([
                'estado' => ['Solo se pueden rechazar citas con pago pendiente de validación.'],
            ]);
        }

        if (! array_key_exists($motivo, self::MOTIVOS_RECHAZO)) {
            throw ValidationException::withMessages([
                'motivo' => ['Motivo de rechazo no válido.'],
            ]);
        }

        $config = $this->getConfig($turno->barberia_id);
        $holdMinutos = max(5, min(60, (int) $config['pago_hold_minutos']));

        $turno->pago_motivo_rechazo = self::MOTIVOS_RECHAZO[$motivo];
        $turno->estado = 'esperando_pago';
        $turno->hold_expires_at = now()->addMinutes($holdMinutos);
        $turno->save();

        return $turno->fresh(['barbero', 'servicio', 'cliente', 'barberia']);
    }

    public function liberarHoldsExpirados(): int
    {
        return Turno::where('estado', 'esperando_pago')
            ->whereNotNull('hold_expires_at')
            ->where('hold_expires_at', '<', now())
            ->update(['estado' => 'cancelado']);
    }

    /** @return array<string, mixed> */
    public function datosPagoParaCliente(int $barberiaId): array
    {
        $config = $this->getConfig($barberiaId);

        return [
            'pago_modo' => $config['pago_modo'],
            'pago_nequi' => $config['pago_nequi'],
            'pago_daviplata' => $config['pago_daviplata'],
            'pago_cuenta_bancaria' => $config['pago_cuenta_bancaria'],
            'pago_monto_abono' => (float) $config['pago_monto_abono'],
            'pago_hold_minutos' => (int) $config['pago_hold_minutos'],
            'requiere_pago' => $this->requierePago($barberiaId),
        ];
    }

    public function notificarBarberoPago(Turno $turno): ?string
    {
        $turno->loadMissing(['cliente', 'servicio', 'barbero', 'barberia']);
        $config = $this->configuracionRepository->getMap($turno->barberia_id);
        $whatsappBarberia = $config[Configuracion::CLAVE_WHATSAPP] ?? $turno->barberia?->telefono;

        if (! $whatsappBarberia) {
            return null;
        }

        $fecha = $turno->fecha instanceof \Carbon\Carbon
            ? $turno->fecha->format('d/m/Y')
            : date('d/m/Y', strtotime((string) $turno->fecha));
        $hora = substr((string) $turno->hora, 0, 5);
        $cliente = $turno->cliente?->nombre ?? 'Cliente';
        $validarUrl = $this->whatsApp->urlCitaValidacionBarbero($turno->uuid);

        $mensaje = implode("\n", [
            'Nuevo comprobante de pago',
            '',
            "Cliente: {$cliente}",
            "Servicio: {$turno->servicio->nombre}",
            "Barbero: {$turno->barbero->nombre}",
            "Fecha: {$fecha} a las {$hora}",
            'Monto esperado: $'.number_format((float) $turno->pago_monto_esperado, 0, ',', '.'),
            '',
            'Valida el comprobante en el panel:',
            $validarUrl,
        ]);

        return $this->whatsApp->waMeUrl($whatsappBarberia, $mensaje);
    }

    /** @return array<string, mixed> */
    public function formatoPagoTurno(Turno $turno): array
    {
        return [
            'pago_monto_esperado' => $turno->pago_monto_esperado !== null ? (float) $turno->pago_monto_esperado : null,
            'comprobante_url' => AssetHelper::normalize($turno->comprobante_url),
            'comprobante_subido_at' => $turno->comprobante_subido_at?->toIso8601String(),
            'pago_motivo_rechazo' => $turno->pago_motivo_rechazo,
            'hold_expires_at' => $turno->hold_expires_at?->toIso8601String(),
            'pago_validado_at' => $turno->pago_validado_at?->toIso8601String(),
            'requiere_comprobante' => in_array($turno->estado, ['esperando_pago'], true),
            'pendiente_validacion' => $turno->estado === 'pendiente_validacion',
        ];
    }

    private function deleteComprobante(?string $url): void
    {
        if (! $url) {
            return;
        }

        $path = parse_url($url, PHP_URL_PATH) ?? $url;
        $relative = ltrim(str_replace('/storage/', '', $path), '/');

        if ($relative && Storage::disk('public')->exists($relative)) {
            Storage::disk('public')->delete($relative);
        }
    }
}
