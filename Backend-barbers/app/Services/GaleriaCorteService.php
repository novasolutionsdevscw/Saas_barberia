<?php

namespace App\Services;

use App\Helpers\AssetHelper;
use App\Models\GaleriaCorte;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class GaleriaCorteService
{
    public function listar(int $barberiaId)
    {
        return GaleriaCorte::where('barberia_id', $barberiaId)
            ->orderBy('orden')
            ->orderBy('id')
            ->get();
    }

    public function agregar(int $barberiaId, UploadedFile $file, ?string $titulo = null): GaleriaCorte
    {
        $total = GaleriaCorte::where('barberia_id', $barberiaId)->count();

        if ($total >= GaleriaCorte::MAX_POR_BARBERIA) {
            throw ValidationException::withMessages([
                'imagen' => ['La galería admite máximo '.GaleriaCorte::MAX_POR_BARBERIA.' cortes.'],
            ]);
        }

        $path = $file->store("uploads/{$barberiaId}/galeria", 'public');
        $orden = (int) GaleriaCorte::where('barberia_id', $barberiaId)->max('orden') + 1;

        return GaleriaCorte::create([
            'barberia_id' => $barberiaId,
            'titulo' => $titulo ? trim($titulo) : null,
            'imagen' => AssetHelper::toPublicPath($path),
            'orden' => $orden,
        ]);
    }

    public function eliminar(int $barberiaId, int $id): void
    {
        $item = GaleriaCorte::where('barberia_id', $barberiaId)->where('id', $id)->first();

        if (! $item) {
            throw new InvalidArgumentException('Imagen no encontrada.');
        }

        $this->deleteStoredFile($item->getAttributes()['imagen'] ?? null);
        $item->delete();
    }

    private function deleteStoredFile(?string $url): void
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
