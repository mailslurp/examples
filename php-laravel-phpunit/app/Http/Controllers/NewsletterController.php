<?php

namespace App\Http\Controllers;

use App\Mail\Newsletter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use MailSlurp;

//<gen>php_laravel_phpunit_newsletter_controller
class NewsletterController extends Controller
{
    public function create()
    {
        return view('newsletter');
    }

    public function store(Request $request)
    {
        $email = $request->validate(['email' => 'required|email']);
        Mail::to($email['email'])->send(new Newsletter($email['email']));

        return view('newsletter-success', ['email' => $email['email']]);
    }
}
//</gen>
