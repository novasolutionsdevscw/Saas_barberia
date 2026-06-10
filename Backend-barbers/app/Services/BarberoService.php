<?php

namespace App\Services;

use App\Helpers\AssetHelper;
use App\Helpers\EncryptionHelper;
use App\Models\Barbero;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BarberoService
{
    public function create(array $data): Barbero
    {
        return DB::transaction(function () use ($data){
            $user = User::create([
                'name' => $data['nombre'],
                'email' => $data['email'],
                'password' => EncryptionHelper::hash($data['password']),
                'rol' => User::ROL_BARBERO,
                'barberia_id' => $data['barberia_id'],
            ]);

            return Barbero::create([
                'user_id' => $user->id,
                'barberia_id' => $data['barberia_id'],
                'nombre' => $data['nombre'],
                'telefono' => $data['telefono'] ?? null,
                'especialidad' => $data['especialidad'] ?? null,
                'estado' => true,
            ]);
        });
    }

    public function update(Barbero $barbero, array $data): Barbero
    {
        $barbero->update([
            'nombre' => $data['nombre'],
            'telefono' => $data['telefono'] ?? null,
            'especialidad' => $data['especialidad'] ?? null,
            'estado' => $data['estado'],
        ]);

        $barbero->user->update([
            'name' => $data['nombre'],
            'email' => $data['email'],
        ]);

        return $barbero->fresh();
    }

    public function uploadFoto(Barbero $barbero, UploadedFile $file): Barbero
    {
        $directory = "uploads/{$barbero->barberia_id}/barberos";

        if ($barbero->foto) {
            $path = parse_url($barbero->foto, PHP_URL_PATH) ?? $barbero->foto;
            $relative = ltrim(str_replace('/storage/', '', $path), '/');
            if ($relative && Storage::disk('public')->exists($relative)) {
                Storage::disk('public')->delete($relative);
            }
        }

        $stored = $file->store($directory, 'public');
        $barbero->update(['foto' => AssetHelper::toPublicPath($stored)]);

        return $barbero->fresh();
    }

     public function delete(Barbero $barbero): void
    {
        DB::transaction(function () use ($barbero) {

            $barbero->user()->delete();

            $barbero->delete();
        });
    }
}
