<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barberias', function (Blueprint $table) {
            $table->string('slug', 100)->nullable()->unique()->after('nombre');
        });

        $used = [];

        DB::table('barberias')->orderBy('id')->each(function ($barberia) use (&$used) {
            $base = Str::slug($barberia->nombre) ?: 'barberia';
            $slug = $base;
            $i = 1;

            while (in_array($slug, $used, true)) {
                $slug = "{$base}-{$i}";
                $i++;
            }

            $used[] = $slug;

            DB::table('barberias')->where('id', $barberia->id)->update(['slug' => $slug]);
        });

        Schema::table('barberias', function (Blueprint $table) {
            $table->string('slug', 100)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('barberias', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
