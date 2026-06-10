<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('barberia_id')
                ->constrained('barberias')
                ->cascadeOnDelete();

            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->integer('stock')->default(0);
            $table->decimal('precio', 10, 2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};

