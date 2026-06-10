<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use App\Services\ProductoService;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function __construct(
        private readonly ProductoService $service
    ) {}

    public function index(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        return response()->json(
            Producto::where('barberia_id', $user->barberia_id)
                ->where('estado', true)
                ->orderBy('nombre')
                ->get()
        );
    }

    public function show(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $producto = Producto::where('barberia_id', $user->barberia_id)->findOrFail($id);

        return response()->json($producto);
    }

    public function store(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'descripcion' => 'nullable|string',
            'stock' => 'nullable|integer|min:0',
            'precio' => 'required|numeric|min:0',
        ]);

        $producto = $this->service->create($validated, $user);

        return response()->json([
            'message' => 'Producto creado correctamente',
            'data' => $producto,
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $producto = Producto::where('barberia_id', $user->barberia_id)->findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:150',
            'descripcion' => 'nullable|string',
            'stock' => 'sometimes|integer|min:0',
            'precio' => 'sometimes|numeric|min:0',
            'estado' => 'sometimes|boolean',
        ]);

        $updated = $this->service->update($producto, $validated);

        return response()->json([
            'message' => 'Producto actualizado.',
            'data' => $updated,
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $producto = Producto::where('barberia_id', $user->barberia_id)->findOrFail($id);
        $producto->estado = false;
        $producto->save();

        return response()->json(['message' => 'Producto desactivado.']);
    }

    public function uploadImagen(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $request->validate([
            'imagen' => 'required|image|max:5120',
        ]);

        $producto = Producto::where('barberia_id', $user->barberia_id)->findOrFail($id);
        $updated = $this->service->uploadImagen($producto, $request->file('imagen'), $user->barberia_id);

        return response()->json([
            'message' => 'Imagen actualizada.',
            'data' => $updated,
        ]);
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
