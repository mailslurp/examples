<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    /**
     * Can get notification page
     */
    public function test_can_get_notification_page(): void
    {
        $response = $this->get('/notification');

        $response->assertStatus(200);
    }
}
