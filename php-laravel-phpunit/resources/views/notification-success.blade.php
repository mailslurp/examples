@extends('layout')
@section('content')
<div class="scale-100 p-6 bg-white dark:bg-gray-800/50 dark:bg-gradient-to-bl from-gray-700/50 via-transparent
dark:ring-1 dark:ring-inset dark:ring-white/5 rounded-lg shadow-2xl shadow-gray-500/20 dark:shadow-none flex transition-all duration-250 focus:outline focus:outline-2 focus:outline-red-500">
    <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Thanks!</h2>

        <p class="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed" data-test-id="notification-success">
            We have saved your email address <span class="font-semibold" data-test-id="email-result">{{$email}}</span>
        </p>
    </div>
</div>
@endsection
