<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE turnos MODIFY COLUMN estado ENUM('pendiente', 'confirmado', 'cancelado', 'completado') NOT NULL DEFAULT 'pendiente'"
        );
    }

    public function down(): void
    {
        DB::table('turnos')->where('estado', 'completado')->update(['estado' => 'confirmado']);

        DB::statement(
            "ALTER TABLE turnos MODIFY COLUMN estado ENUM('pendiente', 'confirmado', 'cancelado') NOT NULL DEFAULT 'pendiente'"
        );
    }
};
