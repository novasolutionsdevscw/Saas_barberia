<?php

namespace App\Console\Commands;

use App\Helpers\EncryptionHelper;
use App\Models\User;
use Illuminate\Console\Command;

class ResetSuperAdminCommand extends Command
{
    protected $signature = 'matriz:reset-super-admin
                            {--password=SuperAdmin2026! : Contraseña del super administrador}';

    protected $description = 'Crea o restablece el usuario super_admin (útil tras cambiar APP_KEY)';

    public function handle(): int
    {
        $password = (string) $this->option('password');

        $user = User::query()->updateOrCreate(
            ['email' => 'superadmin@barbernova.com'],
            [
                'name' => 'Super Administrador',
                'password' => EncryptionHelper::hash($password),
                'barberia_id' => null,
                'rol' => User::ROL_SUPER_ADMIN,
            ],
        );

        $this->info('Super administrador listo.');
        $this->line("  Email:    {$user->email}");
        $this->line("  Password: {$password}");

        return self::SUCCESS;
    }
}
