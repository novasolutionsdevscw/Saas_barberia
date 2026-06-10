<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Turno;
use App\Services\TurnoCitaService;
use Illuminate\Http\JsonResponse;

class PublicCitaController extends Controller
{
    public function __construct(
        private readonly TurnoCitaService $citaService,
    ) {}

    public function show(string $uuid): JsonResponse
    {
        $turno = Turno::where('uuid', $uuid)->firstOrFail();

        return response()->json($this->citaService->formatoPublico($turno));
    }
}
