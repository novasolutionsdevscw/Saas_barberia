<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BloqueoBarbero extends Model
{
    protected $table = 'bloqueos_barbero';

    protected $fillable = [
        'barbero_id',
        'fecha',
        'motivo',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function barbero()
    {
        return $this->belongsTo(Barbero::class);
    }

    protected $hidden = ['id', 'barbero_id', 'created_at', 'updated_at'];
}