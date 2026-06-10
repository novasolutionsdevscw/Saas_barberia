<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('barberia_id')->nullable()->after('id')->constrained('barberias')->cascadeOnDelete();
            $table->string('rol', 30)->default('admin_barberia')->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['barberia_id']);
            $table->dropColumn(['barberia_id', 'rol']);
        });
    }
};
