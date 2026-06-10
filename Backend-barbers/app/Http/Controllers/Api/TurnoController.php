<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barbero;
use App\Models\Servicio;
use App\Models\Turno;
use App\Services\TurnoService;
use App\Services\TurnoCitaService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class TurnoController extends Controller
{
    public function __construct(
        private readonly TurnoService $service,
        private readonly TurnoCitaService $citaService,
        private readonly WhatsAppService $whatsApp,
    ) {}

    // ─────────────────────────────────────────
    // ADMIN: listar turnos de su barbería
    // ─────────────────────────────────────────
    public function index(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        $turnos = Turno::where('barberia_id', $user->barberia_id)
            ->with(['barbero', 'servicio', 'cliente'])
            ->orderBy('fecha')
            ->orderBy('hora')
            ->get()
            ->map(function (Turno $turno) {
                $data = $turno->toArray();

                if (in_array($turno->estado, ['confirmado', 'completado'], true) && $turno->cliente) {
                    $data['whatsapp_url'] = $this->whatsApp->waMeConfirmacionTurno($turno);
                }

                return $data;
            });

        return response()->json($turnos);
    }

    // ─────────────────────────────────────────
    // ADMIN: ver un turno específico
    // ─────────────────────────────────────────
    public function show(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $turno = Turno::with(['barbero', 'servicio', 'cliente'])
            ->where('barberia_id', $user->barberia_id)
            ->findOrFail($id);

        return response()->json($turno);
    }

    // ─────────────────────────────────────────
    // ADMIN: crear turno manualmente (usa ids internos)
    // ─────────────────────────────────────────
    public function store(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        $validated = $request->validate([
            'cliente_id'  => 'required|integer|exists:clientes,id',
            'barbero_id'  => 'required|integer|exists:barberos,id',
            'servicio_id' => 'required|integer|exists:servicios,id',
            'fecha'       => 'required|date',
            'hora'        => 'required|date_format:H:i',
            'precio'      => 'nullable|numeric|min:0',
        ]);

        $validated['barberia_id'] = $user->barberia_id;

        $turno = $this->service->crearAdmin($validated);

        return response()->json([
            'message' => 'Turno creado correctamente.',
            'data'    => $turno->load(['barbero', 'servicio', 'cliente']),
        ], 201);
    }

    // ─────────────────────────────────────────
    // ADMIN: actualizar turno
    // ─────────────────────────────────────────
    public function update(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $turno = Turno::where('barberia_id', $user->barberia_id)->findOrFail($id);

        $validated = $request->validate([
            'barbero_id'  => 'sometimes|integer|exists:barberos,id',
            'servicio_id' => 'sometimes|integer|exists:servicios,id',
            'cliente_id'  => 'sometimes|integer|exists:clientes,id',
            'fecha'       => 'sometimes|date',
            'hora'        => 'sometimes|date_format:H:i',
            'estado'      => 'sometimes|in:pendiente,confirmado,cancelado,completado',
            'precio'      => 'sometimes|numeric|min:0',
        ]);

        $turno = $this->service->actualizar($turno, $validated);

        return response()->json([
            'message' => 'Turno actualizado.',
            'data'    => $turno,
        ]);
    }

    // ─────────────────────────────────────────
    // ADMIN: cancelar turno
    // ─────────────────────────────────────────
    public function destroy(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $turno = Turno::where('barberia_id', $user->barberia_id)->findOrFail($id);

        $turno->estado = 'cancelado';
        $turno->save();

        return response()->json([
            'message' => 'Turno cancelado.',
        ]);
    }

    // ─────────────────────────────────────────
    // ADMIN: confirmar cita + WhatsApp al cliente
    // ─────────────────────────────────────────
    public function confirmar(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $turno = Turno::where('barberia_id', $user->barberia_id)->findOrFail($id);
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

    // ─────────────────────────────────────────
    // ADMIN: cambiar solo el estado
    // ─────────────────────────────────────────
    public function cambiarEstado(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $turno = Turno::where('barberia_id', $user->barberia_id)->findOrFail($id);

        $validated = $request->validate([
            'estado' => 'required|in:pendiente,confirmado,cancelado,completado',
        ]);

        $turno->estado = $validated['estado'];
        $turno->save();

        return response()->json([
            'message' => 'Estado actualizado.',
            'data'    => $turno,
        ]);
    }

    // ─────────────────────────────────────────
    // PÚBLICO: cliente reserva turno (uuid para barbero y servicio)
    // ─────────────────────────────────────────
    public function storePublico(Request $request)
    {
        $barberia = $request->attributes->get('barberia');

        $validated = $request->validate([
            'barbero_uuid'  => 'required|string|exists:barberos,uuid',
            'servicio_uuid' => 'required|string|exists:servicios,uuid',
            'fecha'         => 'required|date',
            'hora'          => 'required|date_format:H:i',
            // Con cuenta
            'cliente_id'    => 'nullable|integer|exists:clientes,id',
            // Sin cuenta
            'nombre'        => 'required_without:cliente_id|string|max:100',
            'telefono'      => 'required_without:cliente_id|string|max:50',
            'email'         => 'nullable|email|max:100',
            'registrarme'   => 'nullable|boolean',
        ]);

        $validated['barberia_id'] = $barberia->id;
        $validated['barbero_id']  = $this->resolverIdDesdeUuid(Barbero::class, $validated['barbero_uuid']);
        $validated['servicio_id'] = $this->resolverIdDesdeUuid(Servicio::class, $validated['servicio_uuid']);

        $turno = $this->service->crearPublico($validated);

        return response()->json([
            'message' => 'Turno reservado correctamente.',
            'data'    => [
                'uuid'     => $turno->uuid,
                'barbero'  => $turno->barbero->nombre,
                'servicio' => $turno->servicio->nombre,
                'fecha'    => $turno->fecha,
                'hora'     => substr($turno->hora, 0, 5),
                'estado'   => $turno->estado,
                'precio'   => $turno->precio,
            ],
        ], 201);
    }

    // ─────────────────────────────────────────
    // PÚBLICO: horas ocupadas de un barbero en una fecha
    // ─────────────────────────────────────────
    public function disponibilidad(Request $request)
    {
        $barberia = $request->attributes->get('barberia');

        $validated = $request->validate([
            'barbero_uuid' => 'required|string|exists:barberos,uuid',
            'fecha'        => 'required|date',
        ]);

        $barberoId = $this->resolverIdDesdeUuid(Barbero::class, $validated['barbero_uuid']);

        $ocupados = Turno::where('barberia_id', $barberia->id)
            ->where('barbero_id', $barberoId)
            ->where('fecha', $validated['fecha'])
            ->whereIn('estado', ['pendiente', 'confirmado'])
            ->pluck('hora')
            ->map(fn($h) => substr($h, 0, 5))
            ->toArray();

        return response()->json([
            'fecha'          => $validated['fecha'],
            'horas_ocupadas' => $ocupados,
        ]);
    }

    // ─────────────────────────────────────────
    // PÚBLICO: cliente consulta sus turnos por teléfono
    // ─────────────────────────────────────────
    public function misTurnos(Request $request)
    {
        $barberia = $request->attributes->get('barberia');

        $validated = $request->validate([
            'telefono' => 'required|string|max:50',
        ]);

        $turnos = Turno::where('barberia_id', $barberia->id)
            ->whereHas('cliente', fn($q) => $q->where('telefono', $validated['telefono']))
            ->with(['barbero', 'servicio'])
            ->orderByDesc('fecha')
            ->orderByDesc('hora')
            ->get()
            ->map(fn($t) => [
                'uuid'     => $t->uuid,
                'fecha'    => $t->fecha,
                'hora'     => substr($t->hora, 0, 5),
                'estado'   => $t->estado,
                'servicio' => $t->servicio->nombre,
                'barbero'  => $t->barbero->nombre,
                'precio'   => $t->precio,
            ]);

        return response()->json(['turnos' => $turnos]);
    }

    // ─────────────────────────────────────────
    // PÚBLICO: cliente cancela su turno por uuid + teléfono
    // ─────────────────────────────────────────
    public function cancelarPublico(Request $request, string $uuid)
    {
        $barberia = $request->attributes->get('barberia');

        $validated = $request->validate([
            'telefono' => 'required|string|max:50',
        ]);

        $turno = Turno::where('barberia_id', $barberia->id)
            ->where('uuid', $uuid)
            ->whereIn('estado', ['pendiente', 'confirmado'])
            ->firstOrFail();

        if ($turno->cliente->telefono !== $validated['telefono']) {
            return response()->json([
                'message' => 'No autorizado para cancelar este turno.',
            ], 403);
        }

        $turno->estado = 'cancelado';
        $turno->save();

        return response()->json([
            'message' => 'Turno cancelado correctamente.',
        ]);
    }

    // ─────────────────────────────────────────
    // Helpers privados
    // ─────────────────────────────────────────

    /**
     * Resuelve el id interno a partir del uuid público.
     */
    private function resolverIdDesdeUuid(string $model, string $uuid): int
    {
        return $model::where('uuid', $uuid)->value('id')
            ?? abort(response()->json(['message' => 'Recurso no encontrado.'], 404));
    }

    private function authorizeAdmin(Request $request)
    {
        $user = $request->attributes->get('user');

        if (! $user || ! $user->isAdminBarberia()) {
            abort(response()->json([
                'message' => 'No autorizado.'
            ], 403));
        }

        return $user;
    }
}