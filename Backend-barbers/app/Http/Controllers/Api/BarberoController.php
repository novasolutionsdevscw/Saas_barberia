<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barbero;
use App\Services\BarberoService;
use Illuminate\Http\Request;

class BarberoController extends Controller
{
    public function __construct(
        private readonly BarberoService $service
    ) {}

    public function index(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        return response()->json(
            Barbero::with('user')
                ->where('barberia_id', $user->barberia_id)
                ->where('estado', true)
                ->orderBy('nombre')
                ->get()
        );
    }

    public function indexPublico(Request $request)
    {
        $barberia = $request->attributes->get('barberia');

        $barberos = Barbero::where('barberia_id', $barberia->id)
            ->where('estado', true)
            ->with('user:id,name')  // solo campos públicos del usuario
            ->get(['uuid', 'id', 'user_id', 'especialidad', 'telefono'])
            ->map(fn($b) => [
                'uuid' => $b->uuid,
                'nombre' => $b->user->name,
                'especialidad' => $b->especialidad,
                'telefono' => $b->telefono,
            ]);

        return response()->json([
            'barberia' => $barberia->nombre,
            'barberos' => $barberos,
        ]);
    }

    public function show(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        return response()->json(
            Barbero::with('user')->findOrFail($id)
        );
    }

    public function store(Request $request)
    {

        $user = $this->authorizeAdmin($request);

        $validated = $request->validate([
            'nombre' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'telefono' => 'nullable|string',
            'especialidad' => 'nullable|string',
        ]);

        $validated['barberia_id'] = $user->barberia_id;

        $barbero = $this->service->create($validated);

        return response()->json([
            'message' => 'Barbero creado correctamente.',
            'data' => $barbero->load('user'),
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $barbero = Barbero::with('user')->findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'required|string',
            'email' => 'required|email',
            'telefono' => 'nullable|string',
            'especialidad' => 'nullable|string',
            'estado' => 'required|boolean',
        ]);

        $updated = $this->service->update($barbero, $validated);

        return response()->json([
            'message' => 'Barbero actualizado.',
            'data' => $updated,
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authorizeAdmin($request);

        $barbero = Barbero::findOrFail($id);

        $barbero->estado = false;
        $barbero->save();

        return response()->json([
            'message' => 'Barbero desactivado.',
        ]);
    }

    public function uploadFoto(Request $request, int $barbero)
    {
        $user = $this->authorizeAdmin($request);

        $request->validate([
            'foto' => 'required|image|max:5120',
        ]);

        $record = Barbero::where('barberia_id', $user->barberia_id)->findOrFail($barbero);
        $updated = $this->service->uploadFoto($record, $request->file('foto'));

        return response()->json([
            'message' => 'Foto actualizada.',
            'data' => $updated->load('user'),
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
