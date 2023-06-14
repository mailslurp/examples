<?php
//<gen>php_laravel_phpunit_newsletter_notification

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewsletterNotification extends Notification
{
    use Queueable;


    public function __construct()
    {
    }

    public function via(object $notifiable): array
    {
        // use mail to send
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line('Welcome to our notifications!')
            ->line('We are glad you have decided to use notifications.');
    }
}
//</gen>
