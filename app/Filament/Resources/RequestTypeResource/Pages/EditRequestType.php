<?php

namespace App\Filament\Resources\RequestTypeResource\Pages;

use App\Filament\Resources\RequestTypeResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditRequestType extends EditRecord
{
    protected static string $resource = RequestTypeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
