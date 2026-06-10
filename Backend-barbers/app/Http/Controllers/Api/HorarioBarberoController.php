<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesBarbero;
use App\Rules\FechaNoAnteriorAHoy;
use App\Http\Controllers\Controller;
use App\Models\Barbero;
use App\Models\BloqueoBarbero;
use App\Models\HorarioBarbero;
use App\Models\Turno;
use Illuminate\Http\Request;

class HorarioBarberoController extends Controller
{
    use ResolvesBarbero;

    // ── HORARIOS ──────────────────────────────────────────

    public function indexHorarios(Request $request, string $uuid)
    {
        $barbero = $this->resolveBarbero($request, $uuid);

        return response()->json($barbero->horarios()->orderBy('dia_semana')->get());
    }

    public function syncHorarios(Request $request, string $uuid)
    {
        $barbero = $this->resolveBarbero($request, $uuid);

        $validated = $request->validate([
            '*.dia_semana'  => 'required|integer|between:0,6',
            '*.hora_inicio' => 'required|date_format:H:i',
            '*.hora_fin'    => 'required|date_format:H:i',
            '*.activo'      => 'boolean',
        ]);

        foreach ($validated as $horario) {
            HorarioBarbero::updateOrCreate(
                [
                    'barbero_id' => $barbero->id,
                    'dia_semana' => $horario['dia_semana'],
                ],
                [
                    'hora_inicio' => $horario['hora_inicio'],
                    'hora_fin'    => $horario['hora_fin'],
                    'activo'      => $horario['activo'] ?? true,
                ]
            );
        }

        return response()->json([
            'message'  => 'Horarios actualizados.',
            'horarios' => $barbero->horarios()->orderBy('dia_semana')->get(),
        ]);
    }

    public function destroyHorario(Request $request, string $uuid, int $dia)
    {
        $user = $this->authorizeAdmin($request);

        $barbero = Barbero::where('uuid', $uuid)
            ->where('barberia_id', $user->barberia_id)
            ->firstOrFail();

        HorarioBarbero::where('barbero_id', $barbero->id)
            ->where('dia_semana', $dia)
            ->delete();

        return response()->json(['message' => 'Horario eliminado.']);
    }

    // ── BLOQUEOS ──────────────────────────────────────────

    public function indexBloqueos(Request $request, string $uuid)
    {
        $this->authorizeAdmin($request);

        $barbero = Barbero::where('uuid', $uuid)->firstOrFail();

        return response()->json($barbero->bloqueos()->orderBy('fecha')->get());
    }

    public function storeBloqueo(Request $request, string $uuid)
    {
        $user = $this->authorizeAdmin($request);

        $barbero = Barbero::where('uuid', $uuid)
            ->where('barberia_id', $user->barberia_id)
            ->firstOrFail();

        $validated = $request->validate([
            'fecha'  => ['required', 'date_format:Y-m-d', new FechaNoAnteriorAHoy],
            'motivo' => 'nullable|string',
        ]);

        $bloqueo = BloqueoBarbero::firstOrCreate(
            [
                'barbero_id' => $barbero->id,
                'fecha'      => $validated['fecha'],
            ],
            ['motivo' => $validated['motivo'] ?? null]
        );

        return response()->json([
            'message'  => 'Bloqueo registrado.',
            'bloqueo'  => $bloqueo,
        ], 201);
    }

    public function destroyBloqueo(Request $request, string $uuid, string $fecha)
    {
        $barbero = $this->resolveBarbero($request, $uuid);

        BloqueoBarbero::where('barbero_id', $barbero->id)
            ->where('fecha', $fecha)
            ->delete();

        return response()->json(['message' => 'Bloqueo eliminado.']);
    }

    // ── DISPONIBILIDAD PÚBLICA ────────────────────────────

    public function disponibilidad(Request $request, string $uuid)
    {
        $request->validate([
            'fecha' => ['required', 'date_format:Y-m-d', new FechaNoAnteriorAHoy],
        ]);

        $fecha   = $request->query('fecha');
        $barbero = Barbero::where('uuid', $uuid)->where('estado', true)->firstOrFail();

        // 1. Verificar si está bloqueado ese día
        $bloqueado = BloqueoBarbero::where('barbero_id', $barbero->id)
            ->where('fecha', $fecha)
            ->exists();

        if ($bloqueado) {
            return response()->json([
                'disponible' => false,
                'motivo'     => 'El barbero no trabaja este día.',
            ]);
        }

        // 2. Verificar horario del día de la semana
        $diaSemana = (int) date('w', strtotime($fecha));
        $horario   = HorarioBarbero::where('barbero_id', $barbero->id)
            ->where('dia_semana', $diaSemana)
            ->where('activo', true)
            ->first();

        if (! $horario) {
            return response()->json([
                'disponible' => false,
                'motivo'     => 'El barbero no trabaja este día de la semana.',
            ]);
        }

        // 3. Obtener horas ya ocupadas en esa fecha
        $horasOcupadas = Turno::where('barbero_id', $barbero->id)
            ->where('fecha', $fecha)
            ->whereIn('estado', ['pendiente', 'confirmado'])
            ->pluck('hora')
            ->map(fn($h) => substr($h, 0, 5))
            ->toArray();

        // 4. Retornar rango horario + horas ocupadas
        return response()->json([
            'disponible'    => true,
            'hora_inicio'   => substr($horario->hora_inicio, 0, 5),
            'hora_fin'      => substr($horario->hora_fin, 0, 5),
            'horas_ocupadas' => $horasOcupadas,
        ]);
    }


    // ── PRIVADO ───────────────────────────────────────────

    private function authorizeAdmin(Request $request)
    {
        $user = $request->attributes->get('user');

        if (! $user || ! $user->isAdminBarberia()) {
            abort(response()->json(['message' => 'No autorizado.'], 403));
        }

        return $user;
    }
}
