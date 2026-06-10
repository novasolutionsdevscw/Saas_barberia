<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos_empresa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barberia_id')->constrained('barberias')->cascadeOnDelete();
            $table->decimal('monto', 10, 2)->default(100);
            $table->date('fecha_pago');
            $table->date('nueva_fecha_vencimiento')->nullable();
            $table->string('registrado_por')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_empresa');
    }
};
