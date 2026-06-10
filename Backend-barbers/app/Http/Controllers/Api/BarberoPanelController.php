<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barbero;
use App\Models\Turno;
use App\Models\User;
use App\Services\FrontendUrlResolver;
use App\Services\TurnoCitaService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BarberoPanelController extends Controller
{
    public function __construct(
        private readonly TurnoCitaService $citaService,
        private readonly WhatsAppService $whatsApp,
        private readonly FrontendUrlResolver $frontendUrl,
    ) {}

    public function perfil(Request $request)
    {
        $barbero = $this->resolveBarbero($request);

        return response()->json([
            'barbero' => $barbero->load('user:id,name,email'),
            'barberia' => $barbero->barberia()->select('id', 'nombre', 'logo', 'telefono')->first(),
        ]);
    }

    public function updatePerfil(Request $request)
    {
        $barbero = $this->resolveBarbero($request);

        $validated = $request->validate([
            'telefono' => 'nullable|string|max:50',
            'especialidad' => 'nullable|string|max:150',
        ]);

        $barbero->update($validated);

        return response()->json([
            'message' => 'Perfil actualizado.',
            'barbero' => $barbero->fresh(),
        ]);
    }

    public function misTurnos(Request $request)
    {
        $barbero = $this->resolveBarbero($request);

        $turnos = Turno::where('barbero_id', $barbero->id)
            ->with([
                'servicio:id,nombre,precio',
                'cliente:id,nombre,telefono',
                'barbero:id,nombre',
                'barberia:id,nombre',
            ])
            ->orderByDesc('fecha')
            ->orderByDesc('hora')
            ->get()
            ->map(fn (Turno $t) => [
                'id' => $t->id,
                'uuid' => $t->uuid,
                'fecha' => $t->fecha?->format('Y-m-d') ?? (string) $t->fecha,
                'hora' => substr((string) $t->hora, 0, 5),
                'estado' => $t->estado,
                'precio' => (float) $t->precio,
                'servicio' => $t->servicio?->nombre,
                'cliente' => $t->cliente?->nombre,
                'telefono' => $t->cliente?->telefono,
                'confirmado_at' => $t->confirmado_at?->toIso8601String(),
                'validado_at' => $t->validado_at?->toIso8601String(),
                'cita_url' => $this->frontendUrl->urlCita($t->uuid, $request),
                'whatsapp_url' => $t->estado === 'confirmado'
                    ? $this->whatsApp->waMeConfirmacionTurno($t)
                    : null,
            ]);

        return response()->json(['turnos' => $turnos]);
    }

    public function confirmarTurno(Request $request, int $id)
    {
        $user = $request->attributes->get('user');
        $barbero = $this->resolveBarbero($request);

        $turno = Turno::where('barberia_id', $barbero->barberia_id)
            ->where('barbero_id', $barbero->id)
            ->findOrFail($id);

        $result = $this->citaService->confirmar($turno, $user);

        return response()->json([
            'message' => $result['mensaje'],
            'whatsapp_url' => $result['whatsapp_url'],
            'whatsapp_mensaje' => $result['whatsapp_mensaje'],
            'cliente_telefono' => $result['cliente_telefono'],
            'cita_url' => $result['cita_url'],
            'qr_url' => $result['qr_url'] ?? null,
            'cita_tarjeta_url' => $result['cita_tarjeta_url'] ?? $result['qr_url'] ?? null,
            'data' => $this->citaService->formatoPublico($result['turno']),
        ]);
    }

    public function consultarQr(Request $request)
    {
        $barbero = $this->resolveBarbero($request);
        $codigo = $this->codigoDesdeRequest($request);

        $result = $this->citaService->consultarPorCodigo($codigo, $barbero);

        $message = $result['es_mio']
            ? 'Cita encontrada. Revisa los datos y confirma la acción.'
            : 'Cita encontrada, pero está asignada a otro barbero.';

        return response()->json([
            'message' => $message,
            'data' => $result['turno'],
            'es_mio' => $result['es_mio'],
            'acciones' => $result['acciones'],
        ]);
    }

    public function validarQr(Request $request)
    {
        $user = $request->attributes->get('user');
        $barbero = $this->resolveBarbero($request);

        $validated = $request->validate([
            'uuid' => 'nullable|string',
            'codigo' => 'nullable|string',
            'accion' => 'nullable|in:confirmar,completar,cancelar',
        ]);

        $codigo = trim($validated['codigo'] ?? $validated['uuid'] ?? '');

        if ($codigo === '') {
            throw ValidationException::withMessages([
                'codigo' => ['Debes enviar el código QR o el UUID de la cita.'],
            ]);
        }

        $accion = $validated['accion'] ?? 'completar';
        $result = $this->citaService->aplicarAccionPorCodigo($codigo, $barbero, $accion, $user);

        $message = match ($accion) {
            'confirmar' => ! empty($result['whatsapp_url'])
                ? 'Cita confirmada. Abre WhatsApp para enviar la tarjeta al cliente.'
                : 'Cita confirmada correctamente.',
            'cancelar' => 'Cita marcada como no válida y cancelada.',
            default => $result['ya_validado']
                ? 'Esta cita ya estaba marcada como completada.'
                : ($result['auto_confirmado']
                    ? 'Cita confirmada y servicio completado correctamente.'
                    : 'Servicio validado. La cita quedó en estado completado.'),
        };

        $payload = [
            'message' => $message,
            'data' => $this->citaService->formatoPublico($result['turno']),
            'acciones' => $result['acciones'] ?? [],
        ];

        if ($accion === 'confirmar') {
            $payload['whatsapp_url'] = $result['whatsapp_url'] ?? null;
            $payload['whatsapp_mensaje'] = $result['whatsapp_mensaje'] ?? null;
            $payload['cliente_telefono'] = $result['cliente_telefono'] ?? null;
            $payload['qr_url'] = $result['qr_url'] ?? null;
            $payload['cita_tarjeta_url'] = $result['cita_tarjeta_url'] ?? $result['qr_url'] ?? null;
        }

        return response()->json($payload);
    }

    private function codigoDesdeRequest(Request $request): string
    {
        $validated = $request->validate([
            'uuid' => 'nullable|string',
            'codigo' => 'nullable|string',
        ]);

        $codigo = trim($validated['codigo'] ?? $validated['uuid'] ?? '');

        if ($codigo === '') {
            throw ValidationException::withMessages([
                'codigo' => ['Debes enviar el código QR o el UUID de la cita.'],
            ]);
        }

        return $codigo;
    }

    private function resolveBarbero(Request $request): Barbero
    {
        /** @var User $user */
        $user = $request->attributes->get('user');

        if (! $user->isBarbero()) {
            abort(response()->json(['message' => 'Solo para usuarios barbero.'], 403));
        }

        $barbero = Barbero::where('user_id', $user->id)
            ->where('barberia_id', $user->barberia_id)
            ->first();

        if (! $barbero) {
            abort(response()->json(['message' => 'Perfil de barbero no encontrado.'], 404));
        }

        return $barbero;
    }
}
