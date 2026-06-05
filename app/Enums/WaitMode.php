<?php

namespace App\Enums;

enum WaitMode: string
{
    case WAIT_ON_SITE = 'WAIT_ON_SITE';
    case RETURN_AT_TIME = 'RETURN_AT_TIME';
}
