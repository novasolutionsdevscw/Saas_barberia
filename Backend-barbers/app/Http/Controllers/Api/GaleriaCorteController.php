<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GaleriaCorteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class GaleriaCorteController extends Controller
{
    public function __construct(
        private readonly GaleriaCorteService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $barberiaId = (int) $request->attributes->get('barberia_id');
        $this->authorizeAdmin($request);

        return response()->json([
            'galeria' => $this->service->listar($barberiaId),
            'max' => \App\Models\GaleriaCorte::MAX_POR_BARBERIA,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'imagen' => ['required', 'image', 'max:5120'],
            'titulo' => ['nullable', 'string', 'max:120'],
        ]);

        $barberiaId = (int) $request->attributes->get('barberia_id');
        $this->authorizeAdmin($request);

        $item = $this->service->agregar(
            $barberiaId,
            $request->file('imagen'),
            $validated['titulo'] ?? null,
        );

        return response()->json([
            'message' => 'Imagen agregada a la galería.',
            'data' => $item,
        ], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $barberiaId = (int) $request->attributes->get('barberia_id');
        $this->authorizeAdmin($request);

        try {
            $this->service->eliminar($barberiaId, $id);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json(['message' => 'Imagen eliminada de la galería.']);
    }

    private function authorizeAdmin(Request $request): void
    {
        $user = $request->attributes->get('user');

        if (! $user || ! $user->isAdminBarberia()) {
            abort(response()->json(['message' => 'No autorizado.'], 403));
        }
    }
}
