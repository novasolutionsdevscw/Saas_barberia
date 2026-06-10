<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HorarioBarbero extends Model
{
    protected $table = 'horarios_barbero';

    protected $fillable = [
        'barbero_id',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function barbero()
    {
        return $this->belongsTo(Barbero::class);
    }

    protected $hidden = ['id', 'barbero_id', 'created_at', 'updated_at'];
    
}