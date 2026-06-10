<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('galeria_cortes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barberia_id')->constrained('barberias')->cascadeOnDelete();
            $table->string('titulo', 120)->nullable();
            $table->string('imagen', 500);
            $table->unsignedTinyInteger('orden')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('galeria_cortes');
    }
};
