<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barbero;
use App\Models\BloqueoBarbero;
use App\Models\HorarioBarbero;
use App\Models\Servicio;
use App\Models\Turno;
use App\Repositories\BarberiaRepository;
use App\Rules\FechaNoAnteriorAHoy;
use App\Services\PagoReservaService;
use App\Services\PublicLandingService;
use App\Services\TurnoCitaService;
use App\Services\TurnoService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PublicBarberiaController extends Controller
{
    public function __construct(
        private readonly BarberiaRepository $barberiaRepository,
        private readonly PublicLandingService $publicLandingService,
        private readonly TurnoService $turnoService,
        private readonly PagoReservaService $pagoReserva,
        private readonly TurnoCitaService $citaService,
        private readonly WhatsAppService $whatsApp,
    ) {}

    public function show(int $id): JsonResponse
    {
        $barberia = $this->barberiaRepository->findById($id);

        if (! $barberia) {
            return response()->json(['message' => 'Barbería no encontrada.'], 404);
        }

        return response()->json([
            'id' => $barberia->id,
            'slug' => $barberia->slug,
            'nombre' => $barberia->nombre,
            'mensaje' => 'ID de barbería Barber Nova',
        ]);
    }

    public function showBySlug(string $slug): JsonResponse
    {
        try {
            $data = $this->publicLandingService->getBySlug($slug);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        return response()->json($data);
    }

    public function disponibilidad(Request $request, string $slug, string $uuid): JsonResponse
    {
        $request->validate([
            'fecha' => ['required', 'date_format:Y-m-d', new FechaNoAnteriorAHoy],
        ]);

        $barberia = $this->barberiaRepository->findBySlug($slug);

        if (! $barberia || ! $barberia->activa) {
            return response()->json(['message' => 'Barbería no encontrada.'], 404);
        }

        $fecha = $request->query('fecha');
        $barbero = Barbero::where('uuid', $uuid)
            ->where('barberia_id', $barberia->id)
            ->where('estado', true)
            ->firstOrFail();

        $bloqueado = BloqueoBarbero::where('barbero_id', $barbero->id)
            ->where('fecha', $fecha)
            ->exists();

        if ($bloqueado) {
            return response()->json([
                'disponible' => false,
                'motivo' => 'El barbero no trabaja este día.',
            ]);
        }

        $diaSemana = (int) date('w', strtotime($fecha));
        $horario = HorarioBarbero::where('barbero_id', $barbero->id)
            ->where('dia_semana', $diaSemana)
            ->where('activo', true)
            ->first();

        if (! $horario) {
            return response()->json([
                'disponible' => false,
                'motivo' => 'El barbero no trabaja este día de la semana.',
            ]);
        }

        $horasOcupadas = Turno::where('barbero_id', $barbero->id)
            ->where('fecha', $fecha)
            ->bloqueanSlot()
            ->pluck('hora')
            ->map(fn ($h) => substr($h, 0, 5))
            ->toArray();

        return response()->json([
            'disponible' => true,
            'hora_inicio' => substr($horario->hora_inicio, 0, 5),
            'hora_fin' => substr($horario->hora_fin, 0, 5),
            'horas_ocupadas' => $horasOcupadas,
        ]);
    }

    public function storeTurno(Request $request, string $slug): JsonResponse
    {
        $barberia = $this->barberiaRepository->findBySlug($slug);

        if (! $barberia || ! $barberia->activa) {
            return response()->json(['message' => 'Barbería no encontrada.'], 404);
        }

        $validated = $request->validate([
            'barbero_uuid'  => 'required|string|exists:barberos,uuid',
            'servicio_uuid' => 'required|string|exists:servicios,uuid',
            'fecha'         => ['required', 'date_format:Y-m-d', new FechaNoAnteriorAHoy],
            'hora'          => 'required|date_format:H:i',
            'nombre'        => 'required|string|max:100',
            'telefono'      => 'required|string|max:50',
            'email'         => 'nullable|email|max:100',
            'registrarme'   => 'nullable|boolean',
        ]);

        $barbero = Barbero::where('uuid', $validated['barbero_uuid'])
            ->where('barberia_id', $barberia->id)
            ->where('estado', true)
            ->firstOrFail();

        $servicio = Servicio::where('uuid', $validated['servicio_uuid'])
            ->where('barberia_id', $barberia->id)
            ->where('estado', true)
            ->firstOrFail();

        $payload = [
            'barberia_id'  => $barberia->id,
            'barbero_id'   => $barbero->id,
            'servicio_id'  => $servicio->id,
            'fecha'        => $validated['fecha'],
            'hora'         => $validated['hora'],
            'nombre'       => $validated['nombre'],
            'telefono'     => $validated['telefono'],
            'email'        => $validated['email'] ?? null,
            'registrarme'  => $validated['registrarme'] ?? false,
        ];

        $turno = $this->pagoReserva->crearPublicoConPago($payload);
        $turno->load(['barbero', 'servicio', 'cliente']);

        $citaUrl = $this->whatsApp->urlCita($turno->uuid, $request);
        $pagoConfig = $this->pagoReserva->datosPagoParaCliente($barberia->id);
        $requierePago = $turno->estado === 'esperando_pago';

        $message = $requierePago
            ? 'Reserva creada. Realiza el pago y sube tu comprobante para confirmar la cita.'
            : 'Turno reservado correctamente. El barbero confirmará tu cita y recibirás WhatsApp.';

        return response()->json([
            'message' => $message,
            'data'    => array_merge([
                'uuid'     => $turno->uuid,
                'barbero'  => $turno->barbero->nombre,
                'servicio' => $turno->servicio->nombre,
                'fecha'    => $turno->fecha,
                'hora'     => substr($turno->hora, 0, 5),
                'estado'   => $turno->estado,
                'precio'   => $turno->precio,
                'cita_url' => $citaUrl,
                'qr_payload' => $citaUrl,
            ], $this->pagoReserva->formatoPagoTurno($turno), $pagoConfig),
        ], 201);
    }

    public function subirComprobante(Request $request, string $slug, string $uuid): JsonResponse
    {
        $barberia = $this->barberiaRepository->findBySlug($slug);

        if (! $barberia || ! $barberia->activa) {
            return response()->json(['message' => 'Barbería no encontrada.'], 404);
        }

        $validated = $request->validate([
            'telefono' => 'required|string|max:50',
            'comprobante' => 'required|image|max:5120',
        ]);

        $turno = Turno::where('uuid', $uuid)
            ->where('barberia_id', $barberia->id)
            ->firstOrFail();

        $turno = $this->pagoReserva->subirComprobante(
            $turno,
            $validated['telefono'],
            $request->file('comprobante'),
        );

        $whatsappBarbero = $this->pagoReserva->notificarBarberoPago($turno);

        return response()->json([
            'message' => 'Comprobante recibido. La barbería validará tu pago pronto.',
            'whatsapp_barbero_url' => $whatsappBarbero,
            'data' => $this->citaService->formatoPublico($turno),
        ]);
    }
}
