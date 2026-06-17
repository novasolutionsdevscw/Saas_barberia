<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE turnos MODIFY COLUMN estado ENUM(
                'esperando_pago',
                'pendiente_validacion',
                'pendiente',
                'confirmado',
                'cancelado',
                'completado'
            ) NOT NULL DEFAULT 'pendiente'"
        );

        Schema::table('turnos', function (Blueprint $table) {
            $table->decimal('pago_monto_esperado', 10, 2)->nullable()->after('precio');
            $table->string('comprobante_url', 500)->nullable()->after('pago_monto_esperado');
            $table->timestamp('comprobante_subido_at')->nullable()->after('comprobante_url');
            $table->string('pago_motivo_rechazo', 255)->nullable()->after('comprobante_subido_at');
            $table->timestamp('hold_expires_at')->nullable()->after('pago_motivo_rechazo');
            $table->timestamp('pago_validado_at')->nullable()->after('hold_expires_at');
        });
    }

    public function down(): void
    {
        DB::table('turnos')
            ->whereIn('estado', ['esperando_pago', 'pendiente_validacion'])
            ->update(['estado' => 'pendiente']);

        Schema::table('turnos', function (Blueprint $table) {
            $table->dropColumn([
                'pago_monto_esperado',
                'comprobante_url',
                'comprobante_subido_at',
                'pago_motivo_rechazo',
                'hold_expires_at',
                'pago_validado_at',
            ]);
        });

        DB::statement(
            "ALTER TABLE turnos MODIFY COLUMN estado ENUM('pendiente', 'confirmado', 'cancelado', 'completado') NOT NULL DEFAULT 'pendiente'"
        );
    }
};
