<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use App\Services\ServicioService;
use Illuminate\Http\Request;

class ServicioController extends Controller
{
    public function __construct(
        private ServicioService $service
    ) {}

    public function indexPublico(Request $request)
{
    $barberia = $request->attributes->get('barberia'); // viene del middleware

    $servicios = Servicio::where('barberia_id', $barberia->id)
        ->where('estado', true)
        ->get(['uuid', 'nombre', 'precio', 'duracion']); // solo campos públicos

    return response()->json([
        'barberia'  => $barberia->nombre,
        'servicios' => $servicios,
    ]);
}

    public function index(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        return response()->json(
            Servicio::where('barberia_id', $user->barberia_id)
                ->where('estado', true)
                ->get()
        );
    }

    public function show(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $servicio = Servicio::where('barberia_id', $user->barberia_id)
            ->findOrFail($id);

        return response()->json($servicio);
    }

    public function store(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        $validated = $request->validate([
            'nombre' => 'required|string',
            'precio' => 'required|numeric',
            'duracion' => 'required|integer',
        ]);

        $servicio = $this->service->create($validated, $user);

        return response()->json([
            'message' => 'Servicio creado correctamente',
            'data' => $servicio,
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $servicio = Servicio::where('barberia_id', $user->barberia_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'nombre'   => 'sometimes|string',
            'precio'   => 'sometimes|numeric',
            'duracion' => 'sometimes|integer',
            'estado'   => 'sometimes|boolean',
        ]);

        $updated = $this->service->update($servicio, $validated);

        return response()->json([
            'message' => 'Servicio actualizado.',
            'data'    => $updated,
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $servicio = Servicio::where('barberia_id', $user->barberia_id)
            ->findOrFail($id);

        $servicio->estado = false;
        $servicio->save();

        return response()->json([
            'message' => 'Servicio desactivado.',
        ]);
    }

    private function authorizeAdmin(Request $request)
    {
        $user = $request->attributes->get('user');

        if (! $user || ! $user->isAdminBarberia()) {
            abort(response()->json([
                'message' => 'No autorizado.'
            ], 403));
        }

        return $user;
    }
}
