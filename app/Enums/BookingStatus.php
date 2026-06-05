<?php

namespace App\Enums;

enum BookingStatus: string
{
    case NEW = 'NEW';
    case APPROVED = 'APPROVED';
    case DECLINED = 'DECLINED';
    case CANCELED = 'CANCELED';
    case IN_PROGRESS = 'IN_PROGRESS';
    case COMPLETED = 'COMPLETED';
}
