<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('clientes', 'barberia_id')) {
            Schema::table('clientes', function (Blueprint $table) {
                $table->foreignId('barberia_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('barberias')
                    ->cascadeOnDelete();
            });
        }

        DB::table('clientes')
            ->whereNull('barberia_id')
            ->orderBy('id')
            ->each(function ($cliente) {
                $barberiaId = DB::table('turnos')
                    ->where('cliente_id', $cliente->id)
                    ->value('barberia_id');

                if (! $barberiaId) {
                    $barberiaId = DB::table('barberias')->value('id');
                }

                if ($barberiaId) {
                    DB::table('clientes')
                        ->where('id', $cliente->id)
                        ->update(['barberia_id' => $barberiaId]);
                }
            });

        if (Schema::hasColumn('clientes', 'barberia_id')) {
            $nullable = DB::selectOne(
                "SELECT IS_NULLABLE FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'barberia_id'"
            );

            if ($nullable && $nullable->IS_NULLABLE === 'YES') {
                Schema::table('clientes', function (Blueprint $table) {
                    $table->foreignId('barberia_id')->nullable(false)->change();
                });
            }
        }

        $indexes = collect(DB::select('SHOW INDEX FROM clientes'))
            ->pluck('Key_name')
            ->unique();

        if ($indexes->contains('clientes_telefono_unique')) {
            Schema::table('clientes', function (Blueprint $table) {
                $table->dropUnique('clientes_telefono_unique');
            });
        }

        if (! $indexes->contains('clientes_barberia_id_telefono_unique')) {
            Schema::table('clientes', function (Blueprint $table) {
                $table->unique(['barberia_id', 'telefono']);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('clientes', 'barberia_id')) {
            return;
        }

        Schema::table('clientes', function (Blueprint $table) {
            $table->dropUnique(['barberia_id', 'telefono']);
            $table->unique('telefono');
            $table->dropForeign(['barberia_id']);
            $table->dropColumn('barberia_id');
        });
    }
};
