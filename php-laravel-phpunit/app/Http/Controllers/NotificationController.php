<?php

//<gen>php_laravel_phpunit_notification_controller

namespace App\Http\Controllers;

use App\Notifications\NewsletterNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class NotificationController extends Controller
{
    public function create()
    {
        return view('notification');
    }

    public function store(Request $request)
    {

        // get the email from the form submission
        $email = $request->validate(['email' => 'required|email']);

        // send an email to the user using the Newsletter Notification
        Notification::route('mail', $email['email'])
            ->notify(new NewsletterNotification());

        return view('notification-success', ['email' => $email['email']]);
    }
}
//</gen>
