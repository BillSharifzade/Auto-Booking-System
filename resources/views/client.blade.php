<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Car Booking</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/client/main.tsx'])
</head>
<body>
    <div id="root"></div>
</body>
</html>
