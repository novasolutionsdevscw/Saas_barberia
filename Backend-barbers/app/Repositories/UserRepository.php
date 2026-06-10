<?php

namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }

    public function findById(int $id): ?User
    {
        return User::query()->find($id);
    }

    public function create(array $data): User
    {
        return User::query()->create($data);
    }

    public function emailExists(string $email): bool
    {
        return User::query()->where('email', $email)->exists();
    }
}
