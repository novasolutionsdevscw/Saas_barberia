<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MatrizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class MatrizController extends Controller
{
    public function __construct(
        private readonly MatrizService $matrizService,
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $estadoPago = $request->query('estado_pago');
        $estadoSistema = $request->query('estado_sistema');

        return response()->json([
            'stats' => $this->matrizService->dashboardStats(),
            'barberias' => $this->matrizService->listBarberias($estadoPago, $estadoSistema),
        ]);
    }

    public function storeBarberia(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180'],
            'password' => ['required', 'string', 'min:8', 'max:120'],
            'nombre_barberia' => ['nullable', 'string', 'max:180'],
        ]);

        try {
            $barberia = $this->matrizService->registrarBarberia(
                $validated['name'],
                $validated['email'],
                $validated['password'],
                $validated['nombre_barberia'] ?? null,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Barbería registrada correctamente.',
            'barberia' => $barberia,
        ], 201);
    }

    public function pagos(Request $request): JsonResponse
    {
        $barberiaId = $request->query('barberia_id');

        return response()->json([
            'pagos' => $this->matrizService->listPagos(
                $barberiaId ? (int) $barberiaId : null,
            ),
            'total' => (float) \App\Models\PagoBarberia::query()->sum('monto'),
        ]);
    }

    public function estados(): JsonResponse
    {
        return response()->json($this->matrizService->resumenEstados());
    }

    public function reportes(): JsonResponse
    {
        return response()->json($this->matrizService->reportes());
    }

    public function registrarPago(Request $request, int $barberia): JsonResponse
    {
        $registradoPor = $request->attributes->get('auth_user')?->name;

        try {
            $item = $this->matrizService->registrarPago($barberia, $registradoPor);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json([
            'message' => 'Pago registrado. Suscripción extendida 30 días.',
            'barberia' => $item,
        ]);
    }

    public function bloquear(int $barberia): JsonResponse
    {
        try {
            $item = $this->matrizService->bloquear($barberia);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json([
            'message' => 'Barbería bloqueada correctamente.',
            'barberia' => $item,
        ]);
    }

    public function activar(int $barberia): JsonResponse
    {
        try {
            $item = $this->matrizService->activar($barberia);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json([
            'message' => 'Barbería activada correctamente.',
            'barberia' => $item,
        ]);
    }
}
