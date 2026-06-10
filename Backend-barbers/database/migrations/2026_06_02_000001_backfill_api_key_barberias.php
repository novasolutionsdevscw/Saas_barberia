<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $ids = DB::table('barberias')->whereNull('api_key')->pluck('id');

        foreach ($ids as $id) {
            DB::table('barberias')
                ->where('id', $id)
                ->update(['api_key' => 'pub_' . Str::random(32)]);
        }
    }

    public function down(): void
    {
        // No revertir claves generadas
    }
};
