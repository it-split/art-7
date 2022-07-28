import { Body, Controller, Get, Logger, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../../auth/admin.guard";
import { SettingsService } from "./settings.service";

@Controller('admin/settings')
export class SettingsController {
    private readonly logger = new Logger(SettingsController.name);

    constructor(
        private readonly settingsService: SettingsService,
    ) {}

    @Get()
    async getSettings() {
        this.logger.log('Retrieving server settings')
        return SettingsService.settings;
    }

    @UseGuards(AdminGuard)
    @Post('/registration-enabled')
    async setRegistrationEnabled(
        @Body() body: { val: boolean }
    ) {
        this.logger.warn(`Registration enabled: ${JSON.stringify(body.val)}`);
        return this.settingsService.setRegistrationEnabled(body.val)
    }

    @UseGuards(AdminGuard)
    @Post('/plot-claiming-enabled')
    async setPlotClaimingEnabled(
        @Body() body: { val: boolean }
    ) {
        this.logger.warn(`Plot Claiming enabled: ${JSON.stringify(body.val)}`);
        return this.settingsService.setPlotClaimingEnabled(body.val)
    }

    @UseGuards(AdminGuard)
    @Post('/drawing-enabled')
    async setDrawingEnabled(
        @Body() body: { val: boolean }
    ) {
        this.logger.warn(`Drawing enabled: ${JSON.stringify(body.val)}`);
        return this.settingsService.setDrawingEnabled(body.val)
    }

    @UseGuards(AdminGuard)
    @Post('/chat-enabled')
    async setChatEnabled(
        @Body() body: { val: boolean }
    ) {
        this.logger.warn(`Chat enabled: ${JSON.stringify(body.val)}`);
        return this.settingsService.setChatEnabled(body.val)
    }

}