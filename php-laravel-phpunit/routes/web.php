<?php

use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
//<gen>php_laravel_phpunit_add_routes
Route::get('/newsletter', [NewsletterController::class, 'create']);
Route::post('/newsletter', [NewsletterController::class, 'store']);
Route::get('/notification', [NotificationController::class, 'create']);
Route::post('/notification', [NotificationController::class, 'store']);
//</gen>
