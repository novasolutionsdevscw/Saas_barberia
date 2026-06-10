<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ConfiguracionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ConfiguracionController extends Controller
{
    public function __construct(
        private readonly ConfiguracionService $configuracionService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $barberiaId = (int) $request->attributes->get('barberia_id');

        try {
            $data = $this->configuracionService->obtenerCompleta($barberiaId);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json($data);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:150'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:180'],
            'direccion' => ['nullable', 'string', 'max:255'],
        ]);

        $barberiaId = (int) $request->attributes->get('barberia_id');

        try {
            $barberia = $this->configuracionService->actualizar($barberiaId, $validated);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json([
            'message' => 'Configuración actualizada.',
            'barberia' => $barberia,
        ]);
    }

    public function updateLanding(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'color_principal' => ['nullable', 'string', 'max:20'],
            'color_secundario' => ['nullable', 'string', 'max:20'],
            'mensaje_bienvenida' => ['nullable', 'string', 'max:500'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'whatsapp' => ['nullable', 'string', 'max:30'],
            'facebook' => ['nullable', 'string', 'max:255'],
            'instagram' => ['nullable', 'string', 'max:255'],
            'tiktok' => ['nullable', 'string', 'max:255'],
            'footer_texto' => ['nullable', 'string', 'max:500'],
        ]);

        $barberiaId = (int) $request->attributes->get('barberia_id');

        try {
            $landing = $this->configuracionService->actualizarLanding($barberiaId, $validated);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json([
            'message' => 'Landing page actualizada.',
            'landing' => $landing,
        ]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'max:2048'],
        ]);

        $barberiaId = (int) $request->attributes->get('barberia_id');

        try {
            $barberia = $this->configuracionService->subirLogo($barberiaId, $request->file('logo'));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json([
            'message' => 'Logo actualizado.',
            'barberia' => $barberia,
        ]);
    }

    public function uploadBanner(Request $request): JsonResponse
    {
        $request->validate([
            'banner' => ['required', 'image', 'max:4096'],
        ]);

        $barberiaId = (int) $request->attributes->get('barberia_id');

        try {
            $landing = $this->configuracionService->subirBanner($barberiaId, $request->file('banner'));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json([
            'message' => 'Banner actualizado.',
            'landing' => $landing,
        ]);
    }
}
