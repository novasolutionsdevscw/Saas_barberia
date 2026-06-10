<?php

namespace App\Services;

use App\Models\BloqueoBarbero;
use App\Models\Cliente;
use App\Models\HorarioBarbero;
use App\Models\Servicio;
use App\Models\Turno;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TurnoService
{
    /**
     * Crea un turno desde el portal público (cliente con o sin cuenta).
     */
    public function crearPublico(array $data): Turno
    {
        $this->validarHorarioBarbero($data['barbero_id'], $data['fecha'], $data['hora']);

        $this->validarDisponibilidad(
            barberoId:  $data['barbero_id'],
            barberiaId: $data['barberia_id'],
            fecha:      $data['fecha'],
            hora:       $data['hora'],
        );

        $cliente = $this->resolverCliente($data);

        return Turno::create([
            'uuid'        => Str::uuid(),
            'barberia_id' => $data['barberia_id'],
            'barbero_id'  => $data['barbero_id'],
            'servicio_id' => $data['servicio_id'],
            'cliente_id'  => $cliente->id,
            'fecha'       => $data['fecha'],
            'hora'        => $data['hora'],
            'precio'      => $this->resolverPrecio($data),
            'estado'      => 'pendiente',
        ]);
    }

    /**
     * Crea un turno desde el panel admin.
     */
    public function crearAdmin(array $data): Turno
    {
        $this->validarDisponibilidad(
            barberoId:  $data['barbero_id'],
            barberiaId: $data['barberia_id'],
            fecha:      $data['fecha'],
            hora:       $data['hora'],
        );

        return Turno::create([
            'uuid'        => Str::uuid(),
            'barberia_id' => $data['barberia_id'],
            'barbero_id'  => $data['barbero_id'],
            'servicio_id' => $data['servicio_id'],
            'cliente_id'  => $data['cliente_id'],
            'fecha'       => $data['fecha'],
            'hora'        => $data['hora'],
            'precio'      => $this->resolverPrecio($data),
            'estado'      => 'pendiente',
        ]);
    }

    /**
     * Actualiza un turno. Solo re-valida si cambia barbero/fecha/hora.
     */
    public function actualizar(Turno $turno, array $data): Turno
    {
        $barberoId = $data['barbero_id'] ?? $turno->barbero_id;
        $fecha     = $data['fecha']      ?? $turno->fecha;
        $hora      = $data['hora']       ?? $turno->hora;

        $cambiaCita = $barberoId !== $turno->barbero_id
                   || $fecha     !== $turno->fecha
                   || $hora      !== $turno->hora;

        if ($cambiaCita) {
            $this->validarDisponibilidad(
                barberoId:  $barberoId,
                barberiaId: $turno->barberia_id,
                fecha:      $fecha,
                hora:       $hora,
                exceptoId:  $turno->id,
            );
        }

        $turno->fill($data);
        $turno->save();

        return $turno->fresh(['barbero', 'servicio', 'cliente']);
    }

    // ─────────────────────────────────────────
    // Helpers privados
    // ─────────────────────────────────────────

    /**
     * Valida que el barbero trabaje en esa fecha y hora:
     * 1. No esté bloqueado ese día
     * 2. Tenga horario activo ese día de la semana
     * 3. La hora esté dentro del rango hora_inicio / hora_fin
     *
     * @throws ValidationException
     */
    private function validarHorarioBarbero(int $barberoId, string $fecha, string $hora): void
    {
        // 1. Bloqueos
        $bloqueado = BloqueoBarbero::where('barbero_id', $barberoId)
            ->where('fecha', $fecha)
            ->exists();

        if ($bloqueado) {
            throw ValidationException::withMessages([
                'fecha' => ['El barbero no trabaja ese día.'],
            ]);
        }

        // 2. Horario del día de la semana
        $diaSemana = (int) date('w', strtotime($fecha));

        $horario = HorarioBarbero::where('barbero_id', $barberoId)
            ->where('dia_semana', $diaSemana)
            ->where('activo', true)
            ->first();

        if (! $horario) {
            throw ValidationException::withMessages([
                'fecha' => ['El barbero no trabaja ese día de la semana.'],
            ]);
        }

        // 3. Hora dentro del rango
        $horaInicio = substr($horario->hora_inicio, 0, 5);
        $horaFin    = substr($horario->hora_fin, 0, 5);
        $horaSolicitada = substr($hora, 0, 5);

        if ($horaSolicitada < $horaInicio || $horaSolicitada >= $horaFin) {
            throw ValidationException::withMessages([
                'hora' => ["El barbero solo atiende entre {$horaInicio} y {$horaFin}."],
            ]);
        }
    }

    /**
     * Busca el cliente por teléfono.
     * - No existe → lo crea
     * - Existe    → lo usa directamente (teléfono es la llave)
     */
    private function resolverCliente(array $data): Cliente
    {
        $registrarme = ! empty($data['registrarme']);
        $barberiaId = $data['barberia_id'];

        $cliente = Cliente::firstOrCreate(
            [
                'telefono'    => $data['telefono'],
                'barberia_id' => $barberiaId,
            ],
            [
                'nombre'     => $data['nombre'],
                'email'      => $data['email'] ?? null,
                'registrado' => $registrarme,
            ]
        );

        if ($registrarme) {
            $cliente->fill([
                'nombre'     => $data['nombre'],
                'email'      => $data['email'] ?? $cliente->email,
                'registrado' => true,
            ]);
            $cliente->save();
        }

        return $cliente;
    }

    /**
     * Si no se pasa precio, lo toma del servicio.
     */
    private function resolverPrecio(array $data): float
    {
        if (! empty($data['precio'])) {
            return $data['precio'];
        }

        return Servicio::find($data['servicio_id'])?->precio ?? 0;
    }

    /**
     * Valida que el barbero no tenga un turno activo en la misma fecha y hora.
     *
     * @throws ValidationException
     */
    private function validarDisponibilidad(
        int $barberoId,
        int $barberiaId,
        string $fecha,
        string $hora,
        ?int $exceptoId = null
    ): void {
        $query = Turno::where('barberia_id', $barberiaId)
            ->where('barbero_id', $barberoId)
            ->where('fecha', $fecha)
            ->where('hora', $hora)
            ->whereIn('estado', ['pendiente', 'confirmado']);

        if ($exceptoId) {
            $query->where('id', '!=', $exceptoId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'hora' => ['El barbero ya tiene un turno reservado en esa fecha y hora.'],
            ]);
        }
    }
}