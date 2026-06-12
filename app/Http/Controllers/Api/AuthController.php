<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (
            !$user
            || !$user->password
            || !Hash::check($credentials['password'], $user->password)
            || !$user->isAdmin()
            || !$user->is_active
        ) {
            return response()->json(['error' => 'Неверный email или пароль'], 401);
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return response()->json(['user' => $this->formatUser($user)]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin() || !$user->is_active) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        return response()->json(['user' => $this->formatUser($user)]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->full_name ?? $user->username,
            'email' => $user->email,
            'role' => $user->role->value,
        ];
    }
}
