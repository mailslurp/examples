@extends('layout', ['logo' => '/newsletter.svg'])
@section('content')
<div class="scale-100 p-6 bg-white dark:bg-gray-800/50 dark:bg-gradient-to-bl from-gray-700/50 via-transparent
dark:ring-1 dark:ring-inset dark:ring-white/5 rounded-lg shadow-2xl shadow-gray-500/20 dark:shadow-none flex transition-all duration-250 focus:outline focus:outline-2 focus:outline-red-500">
    <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Enter your newsletter details</h2>

        <p class="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            We will email you every Sunday with the latest Laravel news.
        </p>
        <div class="mt-4">
            <form class="flex flex-col gap-4" method="POST" action="/newsletter" data-test-id="newsletter-form">
                @csrf
                <label>
                    <input type="email" id="email" name="email" required placeholder="Your email address..." class="appearance-none rounded p-2 w-full">
                </label>
                <button type="submit" id="submit" class="rounded bg-red-500 text-white p-2 px-4">Sign up</button>
            </form>
        </div>
    </div>
</div>
@endsection
