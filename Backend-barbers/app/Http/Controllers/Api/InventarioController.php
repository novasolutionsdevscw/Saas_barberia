<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InventarioService;
use Illuminate\Http\Request;

class InventarioController extends Controller
{
    public function __construct(
        private readonly InventarioService $service
    ) {}

    public function index(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        $filtros = $request->validate([
            'tipo'        => 'nullable|in:entrada,salida',
            'producto_id' => 'nullable|integer',
            'desde'       => 'nullable|date',
            'hasta'       => 'nullable|date',
        ]);

        return response()->json($this->service->listarMovimientos($user->barberia_id, $filtros));
    }

    public function resumen(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        return response()->json($this->service->resumen($user->barberia_id));
    }

    public function store(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        $validated = $request->validate([
            'producto_id' => 'required|integer|exists:productos,id',
            'tipo' => 'required|in:entrada,salida',
            'cantidad' => 'required|integer|min:1',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $movimiento = $this->service->registrar($user->barberia_id, $validated);

        return response()->json([
            'message' => 'Movimiento registrado.',
            'data' => $movimiento,
        ], 201);
    }

    private function authorizeAdmin(Request $request)
    {
        $user = $request->attributes->get('user');

        if (! $user || ! $user->isAdminBarberia()) {
            abort(response()->json(['message' => 'No autorizado.'], 403));
        }

        return $user;
    }
}
