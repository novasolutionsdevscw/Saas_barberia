<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barberos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('barberia_id')
                ->constrained('barberias')
                ->cascadeOnDelete();

            // Opcional: vínculo con usuario del sistema
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('nombre', 100);
            $table->string('foto', 255)->nullable();
            $table->string('especialidad', 150)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->boolean('estado')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barberos');
    }
};

