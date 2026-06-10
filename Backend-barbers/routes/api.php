<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarberoController;
use App\Http\Controllers\Api\ConfiguracionController;
use App\Http\Controllers\Api\MatrizController;
use App\Http\Controllers\Api\PublicBarberiaController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\ServicioController;
use App\Http\Controllers\Api\HorarioBarberoController;
use App\Http\Controllers\Api\TurnoController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\InventarioController;
use App\Http\Controllers\Api\ReportesController;
use App\Http\Controllers\Api\PublicCitaController;
use App\Http\Controllers\Api\BarberoPanelController;
use App\Http\Controllers\Api\GaleriaCorteController;
use App\Http\Middleware\JwtAuthMiddleware;
use App\Http\Middleware\MultiTenantMiddleware;
use App\Http\Middleware\ResolveBarberiaByApiKey;
use App\Http\Middleware\SubscriptionMiddleware;
use App\Http\Middleware\SuperAdminMiddleware;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware([JwtAuthMiddleware::class])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::get('/public/barberia/{id}', [PublicBarberiaController::class, 'show']);
Route::get('/public/b/{slug}', [PublicBarberiaController::class, 'showBySlug']);
Route::get('/public/b/{slug}/barberos/{uuid}/disponibilidad', [PublicBarberiaController::class, 'disponibilidad']);
Route::post('/public/b/{slug}/turnos', [PublicBarberiaController::class, 'storeTurno']);
Route::get('/public/cita/{uuid}', [PublicCitaController::class, 'show']);

Route::middleware(['throttle:60,1', ResolveBarberiaByApiKey::class])->group(function () {
    Route::get('/public/servicios', [ServicioController::class, 'indexPublico']);
    Route::get('/public/barberos', [BarberoController::class, 'indexPublico']);
    Route::get('/public/barberos/{uuid}/disponibilidad', [HorarioBarberoController::class, 'disponibilidad']);
    Route::prefix('turnos')->group(function () {
        Route::post('/',                       [TurnoController::class, 'storePublico']);
        Route::get('/disponibilidad',          [TurnoController::class, 'disponibilidad']);
        Route::get('/mis-turnos',              [TurnoController::class, 'misTurnos']);
        Route::patch('/{uuid}/cancelar',       [TurnoController::class, 'cancelarPublico']);
    });
});

Route::middleware([JwtAuthMiddleware::class, SuperAdminMiddleware::class])
    ->prefix('matriz')
    ->group(function () {
        Route::get('/dashboard', [MatrizController::class, 'dashboard']);
        Route::get('/pagos', [MatrizController::class, 'pagos']);
        Route::get('/estados', [MatrizController::class, 'estados']);
        Route::get('/reportes', [MatrizController::class, 'reportes']);
        Route::post('/barberias', [MatrizController::class, 'storeBarberia']);
        Route::post('/barberias/{barberia}/registrar-pago', [MatrizController::class, 'registrarPago']);
        Route::post('/barberias/{barberia}/bloquear', [MatrizController::class, 'bloquear']);
        Route::post('/barberias/{barberia}/activar', [MatrizController::class, 'activar']);
    });

Route::middleware([
    JwtAuthMiddleware::class,
    MultiTenantMiddleware::class,
    SubscriptionMiddleware::class,
])->group(function () {
    Route::get('/configuracion', [ConfiguracionController::class, 'show']);
    Route::put('/configuracion', [ConfiguracionController::class, 'update']);
    Route::put('/configuracion/landing', [ConfiguracionController::class, 'updateLanding']);
    Route::post('/configuracion/logo', [ConfiguracionController::class, 'uploadLogo']);
    Route::post('/configuracion/banner', [ConfiguracionController::class, 'uploadBanner']);
    Route::get('/configuracion/galeria', [GaleriaCorteController::class, 'index']);
    Route::post('/configuracion/galeria', [GaleriaCorteController::class, 'store']);
    Route::delete('/configuracion/galeria/{id}', [GaleriaCorteController::class, 'destroy']);
    Route::prefix('barberos/{uuid}')->group(function () {
        Route::get('horarios',            [HorarioBarberoController::class, 'indexHorarios']);
        Route::post('horarios',           [HorarioBarberoController::class, 'syncHorarios']);
        Route::delete('horarios/{dia}',   [HorarioBarberoController::class, 'destroyHorario']);

        Route::get('bloqueos',            [HorarioBarberoController::class, 'indexBloqueos']);
        Route::post('bloqueos',           [HorarioBarberoController::class, 'storeBloqueo']);
        Route::delete('bloqueos/{fecha}', [HorarioBarberoController::class, 'destroyBloqueo']);
    });

    Route::apiResource('barberos', BarberoController::class);
    Route::apiResource('servicios', ServicioController::class);
    Route::apiResource('productos', ProductoController::class);
    Route::post('productos/{producto}/imagen', [ProductoController::class, 'uploadImagen']);
    Route::post('barberos/{barbero}/foto', [BarberoController::class, 'uploadFoto']);
    Route::prefix('admin/turnos')->group(function () {
        Route::get('/',              [TurnoController::class, 'index']);
        Route::get('/{id}',          [TurnoController::class, 'show']);
        Route::post('/',             [TurnoController::class, 'store']);
        Route::post('/{id}/confirmar', [TurnoController::class, 'confirmar']);
        Route::put('/{id}',          [TurnoController::class, 'update']);
        Route::delete('/{id}',       [TurnoController::class, 'destroy']);
        Route::patch('/{id}/estado', [TurnoController::class, 'cambiarEstado']);
    });

    Route::prefix('barbero')->group(function () {
        Route::get('/perfil', [BarberoPanelController::class, 'perfil']);
        Route::put('/perfil', [BarberoPanelController::class, 'updatePerfil']);
        Route::get('/mis-turnos', [BarberoPanelController::class, 'misTurnos']);
        Route::post('/turnos/{id}/confirmar', [BarberoPanelController::class, 'confirmarTurno']);
        Route::post('/turnos/consultar-qr', [BarberoPanelController::class, 'consultarQr']);
        Route::post('/turnos/validar-qr', [BarberoPanelController::class, 'validarQr']);
    });

    Route::get('/admin/clientes', [ClienteController::class, 'index']);

    Route::get('/reportes', [ReportesController::class, 'index']);

    Route::prefix('inventario')->group(function () {
        Route::get('/resumen', [InventarioController::class, 'resumen']);
        Route::get('/movimientos', [InventarioController::class, 'index']);
        Route::post('/movimientos', [InventarioController::class, 'store']);
    });
});
