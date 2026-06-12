<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Client API Routes
Route::get('/request-types', [App\Http\Controllers\ClientController::class, 'getRequestTypes']);
Route::get('/cars/{id}', [App\Http\Controllers\ClientController::class, 'getCarById']);
Route::get('/bookings/my', [App\Http\Controllers\ClientController::class, 'getUserBookings']);
Route::get('/bookings/car/{carId}', [App\Http\Controllers\ClientController::class, 'getCarBookings']);
Route::post('/bookings', [App\Http\Controllers\ClientController::class, 'createBooking']);
Route::post('/bookings/{id}/cancel', [App\Http\Controllers\ClientController::class, 'cancelBooking']);
Route::get('/availability/check', [App\Http\Controllers\ClientController::class, 'checkAvailability']);

// Client API for Departments and Positions (for booking wizard)
Route::get('/departments', [AdminController::class, 'getDepartments']);
Route::get('/positions', [AdminController::class, 'getPositions']);

// Admin API Routes (used by admin panel).
// The 'web' group adds sessions/cookies/CSRF so the React admin SPA can use
// classic session-based login; 'admin' requires an authenticated ADMIN user.
Route::middleware('web')->group(function () {
    Route::post('/admin/login', [AuthController::class, 'login']);
    Route::post('/admin/logout', [AuthController::class, 'logout']);
    Route::get('/admin/me', [AuthController::class, 'me']);

    Route::middleware('admin')->group(function () {
        // Vehicles (Cars)
        Route::get('/admin/vehicles', [AdminController::class, 'getVehicles']);
        Route::get('/admin/vehicles/{id}', [AdminController::class, 'getVehicle']);
        Route::post('/admin/vehicles', [AdminController::class, 'createVehicle']);
        Route::put('/admin/vehicles/{id}', [AdminController::class, 'updateVehicle']);
        Route::delete('/admin/vehicles/{id}', [AdminController::class, 'deleteVehicle']);
        Route::patch('/admin/vehicles/{id}/status', [AdminController::class, 'updateVehicleStatus']);
        Route::patch('/admin/vehicles/{id}/assign-driver', [AdminController::class, 'assignDriverToVehicle']);
        Route::post('/admin/force-blocks', [AdminController::class, 'createForceBlock']);

        // Drivers
        Route::get('/admin/drivers', [AdminController::class, 'getDrivers']);
        Route::get('/admin/drivers/{id}', [AdminController::class, 'getDriver']);
        Route::post('/admin/drivers', [AdminController::class, 'createDriver']);
        Route::put('/admin/drivers/{id}', [AdminController::class, 'updateDriver']);
        Route::delete('/admin/drivers/{id}', [AdminController::class, 'deleteDriver']);
        Route::patch('/admin/drivers/{id}/status', [AdminController::class, 'updateDriverStatus']);

        // Bookings (Admin)
        Route::get('/admin/bookings', [AdminController::class, 'getBookings']);
        Route::get('/admin/bookings/{id}', [AdminController::class, 'getBooking']);
        Route::post('/admin/bookings', [AdminController::class, 'store']);
        Route::put('/admin/bookings/{id}', [AdminController::class, 'update']);
        Route::delete('/admin/bookings/{id}', [AdminController::class, 'destroy']);
        Route::patch('/admin/bookings/{id}/status', [AdminController::class, 'updateBookingStatus']);
        Route::post('/admin/bookings/{id}/approve', [AdminController::class, 'approveBooking']);
        Route::post('/admin/bookings/{id}/decline', [AdminController::class, 'declineBooking']);
        Route::post('/admin/bookings/{id}/cancel', [AdminController::class, 'cancelBooking']);

        // Admin accounts
        Route::get('/admin/admins', [AdminController::class, 'getAdmins']);
        Route::post('/admin/admins', [AdminController::class, 'createAdmin']);
        Route::put('/admin/admins/{id}', [AdminController::class, 'updateAdmin']);
        Route::delete('/admin/admins/{id}', [AdminController::class, 'deleteAdmin']);

        // Request Types
        Route::get('/admin/request-types', [AdminController::class, 'getRequestTypes']);
        Route::post('/admin/request-types', [AdminController::class, 'createRequestType']);
        Route::put('/admin/request-types/{id}', [AdminController::class, 'updateRequestType']);
        Route::delete('/admin/request-types/{id}', [AdminController::class, 'deleteRequestType']);

        // Cars (used by timeline)
        Route::get('/admin/cars', [AdminController::class, 'getCars']);

        // Departments
        Route::get('/admin/departments', [AdminController::class, 'getDepartments']);
        Route::get('/admin/departments/{id}', [AdminController::class, 'getDepartment']);
        Route::post('/admin/departments', [AdminController::class, 'createDepartment']);
        Route::put('/admin/departments/{id}', [AdminController::class, 'updateDepartment']);
        Route::delete('/admin/departments/{id}', [AdminController::class, 'deleteDepartment']);

        // Positions
        Route::get('/admin/positions', [AdminController::class, 'getPositions']);
        Route::get('/admin/positions/{id}', [AdminController::class, 'getPosition']);
        Route::post('/admin/positions', [AdminController::class, 'createPosition']);
        Route::put('/admin/positions/{id}', [AdminController::class, 'updatePosition']);
        Route::delete('/admin/positions/{id}', [AdminController::class, 'deletePosition']);
    });
});
