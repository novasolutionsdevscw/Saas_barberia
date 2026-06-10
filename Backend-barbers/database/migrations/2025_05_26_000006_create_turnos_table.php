<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turnos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('barberia_id')
                ->constrained('barberias')
                ->cascadeOnDelete();

            $table->foreignId('cliente_id')
                ->nullable()                   
                ->constrained('clientes')
                ->nullOnDelete();

            $table->foreignId('barbero_id')
                ->constrained('barberos')
                ->cascadeOnDelete();

            $table->foreignId('servicio_id')
                ->constrained('servicios')
                ->cascadeOnDelete();

            $table->date('fecha');
            $table->time('hora');

            $table->enum('estado', ['pendiente', 'confirmado', 'cancelado'])
                ->default('pendiente');

            $table->decimal('precio', 10, 2)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('turnos');
    }
};
