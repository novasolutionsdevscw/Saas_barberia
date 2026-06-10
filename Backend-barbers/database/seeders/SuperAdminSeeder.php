<?php

namespace Database\Seeders;

use App\Helpers\EncryptionHelper;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'superadmin@barbernova.com'],
            [
                'name' => 'Super Administrador',
                'password' => EncryptionHelper::hash('SuperAdmin2026!'),
                'barberia_id' => null,
                'rol' => User::ROL_SUPER_ADMIN,
            ],
        );
    }
}
