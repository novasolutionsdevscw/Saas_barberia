<?php

namespace App\Repositories;

use App\Models\Barberia;
use App\Models\User;
use Illuminate\Support\Collection;

class BarberiaRepository
{
    public function create(array $data): Barberia
    {
        return Barberia::query()->create($data);
    }

    public function findById(int $id): ?Barberia
    {
        return Barberia::query()->find($id);
    }

    public function findBySlug(string $slug): ?Barberia
    {
        return Barberia::query()->where('slug', $slug)->first();
    }

    public function findByIdForTenant(int $id, int $barberiaId): ?Barberia
    {
        return Barberia::query()
            ->where('id', $id)
            ->where('id', $barberiaId)
            ->first();
    }

    /**
     * @return Collection<int, Barberia>
     */
    public function allWithAdmin(?string $estadoPago = null, ?string $estadoSistema = null): Collection
    {
        $query = Barberia::query()
            ->with(['adminPrincipal'])
            ->orderBy('nombre');

        if ($estadoPago && $estadoPago !== 'todos') {
            $query->where('estado_pago', $estadoPago);
        }

        if ($estadoSistema && $estadoSistema !== 'todos') {
            $query->where('estado_sistema', $estadoSistema);
        }

        return $query->get();
    }

    public function update(Barberia $barberia, array $data): Barberia
    {
        $barberia->update($data);

        return $barberia->fresh();
    }
}
