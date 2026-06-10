<?php

namespace App\Services;

use App\Helpers\AssetHelper;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProductoService
{
    public function create(array $data, User $user): Producto
    {
        return Producto::create([
            'barberia_id' => $user->barberia_id,
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'stock' => $data['stock'] ?? 0,
            'precio' => $data['precio'],
            'estado' => true,
        ]);
    }

    public function update(Producto $producto, array $data): Producto
    {
        $producto->update([
            'nombre' => $data['nombre'] ?? $producto->nombre,
            'descripcion' => array_key_exists('descripcion', $data) ? $data['descripcion'] : $producto->descripcion,
            'stock' => $data['stock'] ?? $producto->stock,
            'precio' => $data['precio'] ?? $producto->precio,
            'estado' => $data['estado'] ?? $producto->estado,
        ]);

        return $producto->fresh();
    }

    public function uploadImagen(Producto $producto, UploadedFile $file, int $barberiaId): Producto
    {
        $directory = "uploads/{$barberiaId}/productos";

        if ($producto->imagen) {
            $this->deleteStoredFile($producto->imagen);
        }

        $path = $file->store($directory, 'public');
        $url = AssetHelper::toPublicPath($path);

        $producto->update(['imagen' => $url]);

        return $producto->fresh();
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
