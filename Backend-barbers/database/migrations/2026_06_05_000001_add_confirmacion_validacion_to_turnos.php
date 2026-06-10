<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->timestamp('confirmado_at')->nullable()->after('estado');
            $table->timestamp('validado_at')->nullable()->after('confirmado_at');
        });
    }

    public function down(): void
    {
        Schema::table('turnos', function (Blueprint $table) {
            $table->dropColumn(['confirmado_at', 'validado_at']);
        });
    }
};
