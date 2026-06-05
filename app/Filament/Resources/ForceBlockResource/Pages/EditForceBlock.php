<?php

namespace App\Filament\Resources\ForceBlockResource\Pages;

use App\Filament\Resources\ForceBlockResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditForceBlock extends EditRecord
{
    protected static string $resource = ForceBlockResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
