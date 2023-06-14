<?php

namespace App\Http\Controllers;
use App\Notifications\NewsletterNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Http\Request;

//<gen>php_laravel_phpunit_notification_controller
class NotificationController extends Controller
{
    public function create()
    {
        return view('notification');
    }

    public function store(Request $request)
    {
        $email = $request->validate(['email' => 'required|email']);
        Notification::route('mail', $email['email'])
            ->notify(new NewsletterNotification());
        return view('notification-success', ['email' => $email['email']]);
    }
}
//</gen>
