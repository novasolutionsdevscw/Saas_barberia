<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Turno;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        $clienteIds = Turno::where('barberia_id', $user->barberia_id)
            ->whereNotNull('cliente_id')
            ->distinct()
            ->pluck('cliente_id');

        $clientes = Cliente::where('barberia_id', $user->barberia_id)
            ->where('registrado', true)
            ->whereIn('id', $clienteIds)
            ->orderBy('nombre')
            ->get()
            ->map(function (Cliente $cliente) use ($user) {
                $turnos = Turno::where('barberia_id', $user->barberia_id)
                    ->where('cliente_id', $cliente->id);

                return [
                    'id' => $cliente->id,
                    'nombre' => $cliente->nombre,
                    'telefono' => $cliente->telefono,
                    'email' => $cliente->email,
                    'registrado' => $cliente->registrado,
                    'total_turnos' => $turnos->count(),
                    'ultima_fecha' => $turnos->max('fecha'),
                ];
            });

        return response()->json($clientes);
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
