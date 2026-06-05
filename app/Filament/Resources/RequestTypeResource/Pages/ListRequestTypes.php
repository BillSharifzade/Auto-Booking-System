<?php

namespace App\Filament\Resources\RequestTypeResource\Pages;

use App\Filament\Resources\RequestTypeResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListRequestTypes extends ListRecords
{
    protected static string $resource = RequestTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
