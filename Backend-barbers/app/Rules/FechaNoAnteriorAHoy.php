<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Carbon;

class FechaNoAnteriorAHoy implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return;
        }

        $hoy = Carbon::today(config('app.timezone'))->format('Y-m-d');

        if ($value < $hoy) {
            $fail('La fecha no puede ser anterior a hoy.');
        }
    }
}
