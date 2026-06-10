<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportesService;
use Illuminate\Http\Request;

class ReportesController extends Controller
{
    public function __construct(
        private readonly ReportesService $service
    ) {}

    public function index(Request $request)
    {
        $user = $this->authorizeAdmin($request);

        $validated = $request->validate(
            [
                'desde' => 'nullable|date_format:Y-m-d',
                'hasta' => 'nullable|date_format:Y-m-d|after_or_equal:desde',
            ],
            [
                'hasta.after_or_equal' => 'La fecha hasta debe ser igual o posterior a la fecha desde.',
            ],
        );

        return response()->json(
            $this->service->generar(
                $user->barberia_id,
                $validated['desde'] ?? null,
                $validated['hasta'] ?? null,
            )
        );
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
