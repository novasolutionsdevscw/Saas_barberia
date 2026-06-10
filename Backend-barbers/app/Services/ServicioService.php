<?php

namespace App\Services;

use App\Models\Servicio;
use App\Models\User;

class ServicioService
{

    public function getAll(User $user)
    {
        return Servicio::where('barberia_id', $user->barberia_id)->get();
    }
    
    public function create(array $data, User $user): Servicio
    {
        return Servicio::create([
            'barberia_id' => $user->barberia_id,
            'nombre' => $data['nombre'],
            'precio' => $data['precio'],
            'duracion' => $data['duracion'],
        ]);
    }

    public function update(Servicio $servicio, array $data): Servicio
    {

        $servicio->update([
            'nombre'   => $data['nombre']   ?? $servicio->nombre,
            'precio'   => $data['precio']   ?? $servicio->precio,
            'duracion' => $data['duracion'] ?? $servicio->duracion,
            'estado'   => $data['estado']   ?? $servicio->estado,
        ]);

        return $servicio->fresh();
    }

    public function delete(Servicio $servicio): void
    {
        $servicio->delete();
    }
}
