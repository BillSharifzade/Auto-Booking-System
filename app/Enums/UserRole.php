<?php

namespace App\Enums;

enum UserRole: string
{
    case CLIENT = 'CLIENT';
    case DRIVER = 'DRIVER';
    case ADMIN = 'ADMIN';
}
