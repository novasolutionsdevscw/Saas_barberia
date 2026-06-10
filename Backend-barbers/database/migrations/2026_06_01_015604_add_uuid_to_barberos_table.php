<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barberos', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
        });

        // Poblar uuid en registros existentes
        DB::table('barberos')->get()->each(function ($barbero) {
            DB::table('barberos')
                ->where('id', $barbero->id)
                ->update(['uuid' => (string) Str::uuid()]);
        });

        // Ahora que todos tienen uuid, hacerlo NOT NULL
        Schema::table('barberos', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('barberos', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};