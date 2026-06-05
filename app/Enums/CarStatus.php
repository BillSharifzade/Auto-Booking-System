<?php

namespace App\Enums;

enum CarStatus: string
{
    case ACTIVE = 'ACTIVE';
    case MAINTENANCE = 'MAINTENANCE';
    case ARCHIVED = 'ARCHIVED';
}
