<?php

//<gen>php_laravel_phpunit_newsletter_controller

namespace App\Http\Controllers;

use App\Mail\Newsletter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class NewsletterController extends Controller
{
    public function create()
    {
        return view('newsletter');
    }

    public function store(Request $request)
    {
        // get the email from the form submission
        $email = $request->validate(['email' => 'required|email']);

        // send an email to the user using the Newsletter Mailable
        Mail::to($email['email'])->send(new Newsletter($email['email']));

        return view('newsletter-success', ['email' => $email['email']]);
    }
}
//</gen>
