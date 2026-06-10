<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horarios_barbero', function (Blueprint $table) {
            $table->id();

            $table->foreignId('barbero_id')
                ->constrained('barberos')
                ->cascadeOnDelete();

            $table->tinyInteger('dia_semana'); // 0=domingo, 1=lunes ... 6=sábado
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->boolean('activo')->default(true);

            $table->timestamps();

            $table->unique(['barbero_id', 'dia_semana']);
        });

        Schema::create('bloqueos_barbero', function (Blueprint $table) {
            $table->id();

            $table->foreignId('barbero_id')
                ->constrained('barberos')
                ->cascadeOnDelete();

            $table->date('fecha');
            $table->string('motivo')->nullable();

            $table->timestamps();

            $table->unique(['barbero_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bloqueos_barbero');
        Schema::dropIfExists('horarios_barbero');
    }
};