<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barberias', function (Blueprint $table) {
            $table->enum('estado_pago', ['pagado', 'pendiente'])->default('pendiente')->after('activa');
            $table->enum('estado_sistema', ['activo', 'en_gracia', 'bloqueado'])->default('activo')->after('estado_pago');
            $table->date('fecha_vencimiento')->nullable()->after('estado_sistema');
        });
    }

    public function down(): void
    {
        Schema::table('barberias', function (Blueprint $table) {
            $table->dropColumn(['estado_pago', 'estado_sistema', 'fecha_vencimiento']);
        });
    }
};
