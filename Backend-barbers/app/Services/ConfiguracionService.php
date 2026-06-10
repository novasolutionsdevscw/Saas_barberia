<?php

namespace App\Services;

use App\Helpers\AssetHelper;
use App\Helpers\SlugHelper;
use App\Models\Barberia;
use App\Models\Configuracion;
use App\Repositories\BarberiaRepository;
use App\Repositories\ConfiguracionRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class ConfiguracionService
{
    public function __construct(
        private readonly BarberiaRepository $barberiaRepository,
        private readonly ConfiguracionRepository $configuracionRepository,
        private readonly PublicLandingService $publicLandingService,
    ) {}

    public function obtener(int $barberiaId): Barberia
    {
        $barberia = $this->barberiaRepository->findByIdForTenant($barberiaId, $barberiaId);

        if (! $barberia) {
            throw new InvalidArgumentException('Barbería no encontrada.');
        }

        return $barberia;
    }

    /**
     * @return array{barberia: Barberia, landing: array<string, string|null>}
     */
    public function obtenerCompleta(int $barberiaId): array
    {
        $barberia = $this->obtener($barberiaId);
        $barberia->logo = AssetHelper::normalize($barberia->logo);

        return [
            'barberia' => $barberia,
            'landing' => $this->normalizeLandingAssets(
                $this->publicLandingService->resolveLandingConfig($barberiaId),
            ),
        ];
    }

    public function actualizar(int $barberiaId, array $data): Barberia
    {
        $barberia = $this->obtener($barberiaId);

        $allowed = ['nombre', 'telefono', 'email', 'direccion'];
        $payload = array_intersect_key($data, array_flip($allowed));

        if (isset($payload['nombre']) && $payload['nombre'] !== $barberia->nombre) {
            $payload['slug'] = SlugHelper::generateUnique($payload['nombre'], $barberia->id);
        }

        return $this->barberiaRepository->update($barberia, $payload);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, string|null>
     */
    public function actualizarLanding(int $barberiaId, array $data): array
    {
        $this->obtener($barberiaId);

        $allowed = array_keys(Configuracion::DEFAULTS);
        $payload = array_intersect_key($data, array_flip($allowed));

        $normalized = [];
        foreach ($payload as $clave => $valor) {
            $normalized[$clave] = is_string($valor) ? trim($valor) : null;
        }

        $this->configuracionRepository->setMany($barberiaId, $normalized);

        return $this->normalizeLandingAssets(
            $this->publicLandingService->resolveLandingConfig($barberiaId),
        );
    }

    public function subirLogo(int $barberiaId, UploadedFile $file): Barberia
    {
        $barberia = $this->obtener($barberiaId);
        $directory = "uploads/{$barberiaId}";

        if ($barberia->logo) {
            $this->deleteStoredFile($barberia->logo);
        }

        $path = $file->store($directory, 'public');
        $url = AssetHelper::toPublicPath($path);

        return $this->barberiaRepository->update($barberia, ['logo' => $url]);
    }

    public function subirBanner(int $barberiaId, UploadedFile $file): array
    {
        $this->obtener($barberiaId);
        $directory = "uploads/{$barberiaId}";

        $existing = $this->configuracionRepository->getMap($barberiaId)[Configuracion::CLAVE_BANNER] ?? null;
        if ($existing) {
            $this->deleteStoredFile($existing);
        }

        $path = $file->store($directory, 'public');
        $url = AssetHelper::toPublicPath($path);

        $this->configuracionRepository->set($barberiaId, Configuracion::CLAVE_BANNER, $url);

        return $this->normalizeLandingAssets(
            $this->publicLandingService->resolveLandingConfig($barberiaId),
        );
    }

    /**
     * @param  array<string, string|null>  $landing
     * @return array<string, string|null>
     */
    private function normalizeLandingAssets(array $landing): array
    {
        if (isset($landing[Configuracion::CLAVE_BANNER])) {
            $landing[Configuracion::CLAVE_BANNER] = AssetHelper::normalize(
                $landing[Configuracion::CLAVE_BANNER],
            ) ?? '';
        }

        return $landing;
    }

    private function deleteStoredFile(string $url): void
    {
        $path = parse_url($url, PHP_URL_PATH) ?? $url;
        $relative = ltrim(str_replace('/storage/', '', $path), '/');
        if ($relative && Storage::disk('public')->exists($relative)) {
            Storage::disk('public')->delete($relative);
        }
    }
}
