<?php

namespace App\Services;

use App\Models\Barbero;
use App\Models\Cliente;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\Servicio;
use App\Models\Turno;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportesService
{
    public function generar(int $barberiaId, ?string $desde = null, ?string $hasta = null): array
    {
        $inicio = $desde
            ? Carbon::parse($desde)->startOfDay()
            : Carbon::now()->startOfMonth();
        $fin = $hasta
            ? Carbon::parse($hasta)->endOfDay()
            : Carbon::now()->endOfMonth();

        $desdeStr = $inicio->toDateString();
        $hastaStr = $fin->toDateString();

        $base = Turno::query()
            ->where('turnos.barberia_id', $barberiaId)
            ->whereBetween('turnos.fecha', [$desdeStr, $hastaStr]);

        $porEstado = (clone $base)
            ->select('turnos.estado', DB::raw('count(*) as total'))
            ->groupBy('turnos.estado')
            ->pluck('total', 'estado');

        $estados = ['pendiente', 'confirmado', 'completado', 'cancelado'];
        $turnosPorEstado = [];
        foreach ($estados as $e) {
            $turnosPorEstado[$e] = (int) ($porEstado[$e] ?? 0);
        }

        $turnosTotal = array_sum($turnosPorEstado);
        $ingresos = (float) (clone $base)
            ->whereIn('turnos.estado', ['confirmado', 'completado'])
            ->sum('turnos.precio');

        $ticketPromedio = $turnosPorEstado['confirmado'] + $turnosPorEstado['completado'] > 0
            ? round($ingresos / ($turnosPorEstado['confirmado'] + $turnosPorEstado['completado']), 2)
            : 0;

        $porBarbero = (clone $base)
            ->join('barberos', 'turnos.barbero_id', '=', 'barberos.id')
            ->whereIn('turnos.estado', ['confirmado', 'completado', 'pendiente'])
            ->select(
                'barberos.nombre',
                DB::raw('count(*) as total'),
                DB::raw("sum(case when turnos.estado in ('confirmado','completado') then turnos.precio else 0 end) as ingresos")
            )
            ->groupBy('barberos.id', 'barberos.nombre')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'nombre'   => $r->nombre,
                'total'    => (int) $r->total,
                'ingresos' => (float) $r->ingresos,
            ]);

        $porServicio = (clone $base)
            ->join('servicios', 'turnos.servicio_id', '=', 'servicios.id')
            ->whereIn('turnos.estado', ['confirmado', 'completado', 'pendiente'])
            ->select(
                'servicios.nombre',
                DB::raw('count(*) as total'),
                DB::raw("sum(case when turnos.estado in ('confirmado','completado') then turnos.precio else 0 end) as ingresos")
            )
            ->groupBy('servicios.id', 'servicios.nombre')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'nombre'   => $r->nombre,
                'total'    => (int) $r->total,
                'ingresos' => (float) $r->ingresos,
            ]);

        $turnosPorDia = (clone $base)
            ->select('turnos.fecha', DB::raw('count(*) as total'))
            ->groupBy('turnos.fecha')
            ->orderBy('turnos.fecha')
            ->get()
            ->map(fn ($r) => [
                'fecha' => $r->fecha instanceof \Carbon\Carbon
                    ? $r->fecha->format('Y-m-d')
                    : (string) $r->fecha,
                'total' => (int) $r->total,
            ]);

        $ultimosTurnos = Turno::where('barberia_id', $barberiaId)
            ->with(['barbero:id,nombre', 'servicio:id,nombre', 'cliente:id,nombre'])
            ->orderByDesc('fecha')
            ->orderByDesc('hora')
            ->limit(8)
            ->get()
            ->map(fn (Turno $t) => [
                'id'       => $t->id,
                'fecha'    => $t->fecha?->format('Y-m-d') ?? (string) $t->fecha,
                'hora'     => substr((string) $t->hora, 0, 5),
                'estado'   => $t->estado,
                'precio'   => (float) $t->precio,
                'barbero'  => $t->barbero?->nombre,
                'servicio' => $t->servicio?->nombre,
                'cliente'  => $t->cliente?->nombre,
            ]);

        $clienteIds = Turno::where('barberia_id', $barberiaId)->distinct()->pluck('cliente_id');
        $clientesRegistrados = Cliente::where('barberia_id', $barberiaId)
            ->where('registrado', true)
            ->whereIn('id', $clienteIds)
            ->count();

        $inventario = $this->resumenInventarioReporte($barberiaId, $inicio, $fin);

        return [
            'periodo' => [
                'desde' => $desdeStr,
                'hasta' => $hastaStr,
                'label' => $inicio->translatedFormat('M Y'),
            ],
            'resumen' => [
                'turnos_total'          => $turnosTotal,
                'turnos_pendientes'     => $turnosPorEstado['pendiente'],
                'turnos_confirmados'    => $turnosPorEstado['confirmado'],
                'turnos_completados'    => $turnosPorEstado['completado'],
                'turnos_cancelados'     => $turnosPorEstado['cancelado'],
                'ingresos'              => $ingresos,
                'ticket_promedio'       => $ticketPromedio,
                'clientes_registrados'  => $clientesRegistrados,
                'barberos_activos'      => Barbero::where('barberia_id', $barberiaId)->where('estado', true)->count(),
                'servicios_activos'     => Servicio::where('barberia_id', $barberiaId)->where('estado', true)->count(),
            ],
            'turnos_por_estado' => $turnosPorEstado,
            'por_barbero'       => $porBarbero,
            'por_servicio'      => $porServicio,
            'turnos_por_dia'    => $turnosPorDia,
            'ultimos_turnos'    => $ultimosTurnos,
            'inventario'        => $inventario,
        ];
    }

    private function resumenInventarioReporte(int $barberiaId, Carbon $inicio, Carbon $fin): array
    {
        $productos = Producto::where('barberia_id', $barberiaId)->where('estado', true)->get();

        $movs = MovimientoInventario::where('barberia_id', $barberiaId)
            ->whereBetween('created_at', [$inicio, $fin]);

        $entradas = (int) (clone $movs)->where('tipo', 'entrada')->sum('cantidad');
        $salidas  = (int) (clone $movs)->where('tipo', 'salida')->sum('cantidad');

        return [
            'total_productos'  => $productos->count(),
            'unidades_stock'   => $productos->sum('stock'),
            'valor_inventario' => round($productos->sum(fn ($p) => $p->stock * (float) $p->precio), 2),
            'stock_bajo'       => $productos->where('stock', '<=', 5)->count(),
            'entradas_periodo' => $entradas,
            'salidas_periodo'  => $salidas,
        ];
    }
}
