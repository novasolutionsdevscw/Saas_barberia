<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PagoBarberia extends Model
{
    public const MONTO_DEFAULT = 100;

    protected $table = 'pagos_empresa';

    protected $fillable = [
        'barberia_id',
        'monto',
        'fecha_pago',
        'nueva_fecha_vencimiento',
        'registrado_por',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'fecha_pago' => 'date',
            'nueva_fecha_vencimiento' => 'date',
        ];
    }

    public function barberia(): BelongsTo
    {
        return $this->belongsTo(Barberia::class, 'barberia_id');
    }
}
