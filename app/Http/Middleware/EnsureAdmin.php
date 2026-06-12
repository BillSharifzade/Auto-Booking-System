<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->isAdmin() || !$user->is_active) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        return $next($request);
    }
}
