<?php

namespace App\Services;

use App\Models\MovimientoInventario;
use App\Models\Producto;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventarioService
{
    public function resumen(int $barberiaId): array
    {
        $productos = Producto::where('barberia_id', $barberiaId)
            ->where('estado', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'stock', 'precio', 'imagen']);

        $inicioMes = Carbon::now()->startOfMonth();
        $finMes    = Carbon::now()->endOfMonth();

        $movsMes = MovimientoInventario::where('barberia_id', $barberiaId)
            ->whereBetween('created_at', [$inicioMes, $finMes]);

        $entradasMes = (int) (clone $movsMes)->where('tipo', 'entrada')->sum('cantidad');
        $salidasMes  = (int) (clone $movsMes)->where('tipo', 'salida')->sum('cantidad');

        $valorInventario = round(
            $productos->sum(fn ($p) => $p->stock * (float) $p->precio),
            2
        );

        $porProducto = MovimientoInventario::where('barberia_id', $barberiaId)
            ->whereBetween('created_at', [$inicioMes, $finMes])
            ->select('producto_id', 'tipo', DB::raw('sum(cantidad) as total'))
            ->groupBy('producto_id', 'tipo')
            ->get()
            ->groupBy('producto_id');

        $actividadMes = $productos->map(function ($p) use ($porProducto) {
            $grupo = $porProducto->get($p->id, collect());
            $entradas = (int) $grupo->where('tipo', 'entrada')->sum('total');
            $salidas  = (int) $grupo->where('tipo', 'salida')->sum('total');

            return [
                'id'       => $p->id,
                'nombre'   => $p->nombre,
                'stock'    => $p->stock,
                'precio'   => (float) $p->precio,
                'imagen'   => $p->imagen,
                'entradas' => $entradas,
                'salidas'  => $salidas,
            ];
        })->values();

        return [
            'kpi' => [
                'total_productos'  => $productos->count(),
                'unidades_totales' => $productos->sum('stock'),
                'valor_inventario' => $valorInventario,
                'entradas_mes'     => $entradasMes,
                'salidas_mes'      => $salidasMes,
                'neto_mes'         => $entradasMes - $salidasMes,
                'movimientos_mes'  => (clone $movsMes)->count(),
            ],
            'productos'   => $productos,
            'stock_bajo'  => $productos->where('stock', '<=', 5)->values(),
            'actividad_mes' => $actividadMes,
        ];
    }

    public function listarMovimientos(int $barberiaId, array $filtros = [])
    {
        $query = MovimientoInventario::where('barberia_id', $barberiaId)
            ->with('producto:id,nombre,stock,precio');

        if (! empty($filtros['tipo'])) {
            $query->where('tipo', $filtros['tipo']);
        }

        if (! empty($filtros['producto_id'])) {
            $query->where('producto_id', $filtros['producto_id']);
        }

        if (! empty($filtros['desde'])) {
            $query->whereDate('created_at', '>=', $filtros['desde']);
        }

        if (! empty($filtros['hasta'])) {
            $query->whereDate('created_at', '<=', $filtros['hasta']);
        }

        return $query->orderByDesc('created_at')->limit(200)->get();
    }

    public function registrar(int $barberiaId, array $data): MovimientoInventario
    {
        return DB::transaction(function () use ($barberiaId, $data) {
            $producto = Producto::where('barberia_id', $barberiaId)
                ->where('id', $data['producto_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $cantidad = (int) $data['cantidad'];

            if ($data['tipo'] === 'salida' && $producto->stock < $cantidad) {
                throw ValidationException::withMessages([
                    'cantidad' => ['Stock insuficiente. Disponible: '.$producto->stock],
                ]);
            }

            $delta = $data['tipo'] === 'entrada' ? $cantidad : -$cantidad;
            $producto->stock = max(0, $producto->stock + $delta);
            $producto->save();

            return MovimientoInventario::create([
                'barberia_id' => $barberiaId,
                'producto_id' => $producto->id,
                'tipo'          => $data['tipo'],
                'cantidad'      => $cantidad,
                'descripcion'   => $data['descripcion'] ?? null,
            ])->load('producto:id,nombre,stock,precio');
        });
    }
}
