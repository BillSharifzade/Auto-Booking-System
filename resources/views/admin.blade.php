<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Админ-панель</title>
    @viteReactRefresh
    @vite(['resources/js/admin/main.tsx'])
</head>
<body>
    <div id="root"></div>
</body>
</html>
