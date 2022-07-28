import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Settings } from "./settings.entity";
import { SettingsService } from "./settings.service";
import { SettingsController } from "./settings.controller";

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([Settings])
    ],
    providers: [SettingsService],
    exports: [SettingsService],
    controllers: [SettingsController]
})
export class SettingsModule {
}
