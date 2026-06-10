<?php

namespace App\Repositories;

use App\Models\Configuracion;

class ConfiguracionRepository
{
    /**
     * @return array<string, string|null>
     */
    public function getMap(int $barberiaId): array
    {
        return Configuracion::query()
            ->where('barberia_id', $barberiaId)
            ->pluck('valor', 'clave')
            ->all();
    }

    public function set(int $barberiaId, string $clave, ?string $valor): void
    {
        Configuracion::query()->updateOrCreate(
            ['barberia_id' => $barberiaId, 'clave' => $clave],
            ['valor' => $valor],
        );
    }

    /**
     * @param  array<string, string|null>  $data
     */
    public function setMany(int $barberiaId, array $data): void
    {
        foreach ($data as $clave => $valor) {
            $this->set($barberiaId, $clave, $valor);
        }
    }
}
