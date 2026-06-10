<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Barbero;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

trait ResolvesBarbero
{
    protected function resolveBarbero(Request $request, string $key, bool $requireAdmin = true): Barbero
    {
        $user = $requireAdmin ? $this->authorizeAdmin($request) : $request->attributes->get('user');

        $query = Barbero::query();

        if ($requireAdmin && $user) {
            $query->where('barberia_id', $user->barberia_id);
        }

        if (Str::isUuid($key)) {
            return $query->where('uuid', $key)->firstOrFail();
        }

        if (ctype_digit($key)) {
            return $query->where('id', (int) $key)->firstOrFail();
        }

        abort(response()->json(['message' => 'Barbero no encontrado.'], 404));
    }
}
