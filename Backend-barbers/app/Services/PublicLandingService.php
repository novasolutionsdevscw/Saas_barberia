<?php

namespace App\Services;

use App\Helpers\AssetHelper;
use App\Models\Barberia;
use App\Models\Barbero;
use App\Models\Configuracion;
use App\Models\GaleriaCorte;
use App\Models\Producto;
use App\Models\Servicio;
use App\Repositories\BarberiaRepository;
use App\Repositories\ConfiguracionRepository;
use InvalidArgumentException;

class PublicLandingService
{
    public function __construct(
        private readonly BarberiaRepository $barberiaRepository,
        private readonly ConfiguracionRepository $configuracionRepository,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function getBySlug(string $slug): array
    {
        $barberia = $this->barberiaRepository->findBySlug($slug);

        if (! $barberia) {
            throw new InvalidArgumentException('Barbería no encontrada.');
        }

        if (! $barberia->activa || $barberia->estado_sistema === Barberia::ESTADO_BLOQUEADO) {
            throw new InvalidArgumentException('Esta barbería no está disponible en este momento.');
        }

        $landing = $this->resolveLandingConfig($barberia->id);

        $barberos = Barbero::query()
            ->where('barberia_id', $barberia->id)
            ->where('estado', true)
            ->orderBy('nombre')
            ->get(['id', 'uuid', 'nombre', 'foto', 'especialidad', 'telefono']);

        $servicios = Servicio::query()
            ->where('barberia_id', $barberia->id)
            ->where('estado', true)
            ->orderBy('nombre')
            ->get(['uuid', 'nombre', 'precio', 'duracion']);

        $productos = Producto::query()
            ->where('barberia_id', $barberia->id)
            ->where('estado', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'descripcion', 'precio', 'imagen']);

        $galeria = GaleriaCorte::query()
            ->where('barberia_id', $barberia->id)
            ->orderBy('orden')
            ->orderBy('id')
            ->get(['id', 'titulo', 'imagen', 'orden']);

        return [
            'barberia' => [
                'id' => $barberia->id,
                'slug' => $barberia->slug,
                'nombre' => $barberia->nombre,
                'logo' => AssetHelper::normalize($barberia->logo),
                'telefono' => $barberia->telefono,
                'email' => $barberia->email,
                'direccion' => $barberia->direccion,
            ],
            'landing' => $this->normalizeLandingForPublic($landing),
            'barberos' => $barberos->map(fn (Barbero $b) => [
                'id' => $b->id,
                'uuid' => $b->uuid,
                'nombre' => $b->nombre,
                'foto' => AssetHelper::normalize($b->foto),
                'especialidad' => $b->especialidad,
                'telefono' => $b->telefono,
            ])->values()->all(),
            'servicios' => $servicios->map(fn (Servicio $s) => [
                'uuid' => $s->uuid,
                'nombre' => $s->nombre,
                'precio' => (float) $s->precio,
                'duracion' => (int) $s->duracion,
            ])->values()->all(),
            'productos' => $productos->map(fn (Producto $p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'descripcion' => $p->descripcion,
                'precio' => (float) $p->precio,
                'imagen' => AssetHelper::normalize($p->imagen),
            ])->values()->all(),
            'galeria' => $galeria->map(fn (GaleriaCorte $g) => [
                'id' => $g->id,
                'titulo' => $g->titulo,
                'imagen' => $g->imagen,
                'orden' => $g->orden,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<string, string|null>
     */
    public function resolveLandingConfig(int $barberiaId): array
    {
        $stored = $this->configuracionRepository->getMap($barberiaId);
        $landing = [];

        foreach (Configuracion::DEFAULTS as $clave => $default) {
            $valor = $stored[$clave] ?? null;
            $landing[$clave] = ($valor !== null && $valor !== '') ? $valor : $default;
        }

        return $landing;
    }

    /**
     * @param  array<string, string|null>  $landing
     * @return array<string, string|null>
     */
    private function normalizeLandingForPublic(array $landing): array
    {
        $banner = AssetHelper::normalize($landing[Configuracion::CLAVE_BANNER] ?? null);
        $landing[Configuracion::CLAVE_BANNER] = $banner ?? '';

        return $landing;
    }
}
