<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewsletterTest extends TestCase
{
    /**
     * Can get newsletter page
     */
    public function test_can_get_newsletter_page(): void
    {
        $response = $this->get('/newsletter');

        $response->assertStatus(200);
    }
}
