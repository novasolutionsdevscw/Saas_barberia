<?php

namespace App\Console\Commands;

use App\Services\PagoReservaService;
use Illuminate\Console\Command;

class LiberarHoldsExpiradosCommand extends Command
{
    protected $signature = 'turnos:liberar-holds';

    protected $description = 'Cancela reservas con pago pendiente cuyo tiempo de hold expiró';

    public function handle(PagoReservaService $pagoReserva): int
    {
        $count = $pagoReserva->liberarHoldsExpirados();

        $this->info("Reservas liberadas: {$count}");

        return self::SUCCESS;
    }
}
