<?php

namespace App\Helpers;

use App\Models\Barberia;
use Illuminate\Support\Str;

class SlugHelper
{
    public static function generateUnique(string $nombre, ?int $exceptId = null): string
    {
        $base = Str::slug($nombre) ?: 'barberia';
        $slug = $base;
        $i = 1;

        while (
            Barberia::query()
                ->where('slug', $slug)
                ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
                ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
