import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository } from "typeorm";
import { Settings } from "./settings.entity";
import { PublicGateway } from "../../shared/websocket/public.gateway";

@Injectable()
export class SettingsService {
    private readonly logger = new Logger(SettingsService.name);
    private repository: Repository<Settings>;
    public static settings: Settings;

    constructor(
        private readonly connection: Connection,
    ) {
        this.repository = this.connection.getRepository<Settings>(Settings);
        this.repository.findOne(1)
            .then((result) => {
                if (result) {
                    SettingsService.settings = result;
                    this.logger.log(`Live Application Settings: ${JSON.stringify(SettingsService.settings)}`);
                } else {
                    this.logger.log(`No settings found, creating defaults`)
                    this.repository.save({ id: 1 }).then((result) => {
                        SettingsService.settings = result;
                        this.logger.log(`Live Application Settings: ${JSON.stringify(SettingsService.settings)}`);
                    });
                }
            })
            .catch((err) => {
               this.logger.error(`Encountered an error loading settings: ${JSON.stringify(err)}`);
               throw new InternalServerErrorException('error.loadingSettings')
            });
    }

    async setRegistrationEnabled(val: boolean): Promise<Settings> {
        SettingsService.settings.registrationEnabled = val;
        PublicGateway.server.emit('chat', { msg: val ? 'Registration has been enabled!' : 'Registration has been disabled!' });
        return this.saveSettings();
    }

    async setPlotClaimingEnabled(val: boolean): Promise<Settings> {
        SettingsService.settings.plotClaimingEnabled = val;
        PublicGateway.server.emit('chat', { msg: val ? 'Plot claiming has been enabled!' : 'Plot claiming has been disabled!' });
        return this.saveSettings();
    }

    async setDrawingEnabled(val: boolean): Promise<Settings> {
        SettingsService.settings.drawingEnabled = val;
        PublicGateway.server.emit('chat', { msg: val ? 'Drawing has been enabled!' : 'Drawing has been disabled!' });
        return this.saveSettings();
    }

    async setChatEnabled(val: boolean): Promise<Settings> {
        SettingsService.settings.chatEnabled = val;
        PublicGateway.server.emit('chat', { msg: val ? 'Chat has been enabled' : 'Chat has been disabled' });
        return this.saveSettings();
    }

    private saveSettings(): Promise<Settings> {
        PublicGateway.server.emit('serverSettingsChange', { settings: SettingsService.settings });
        return this.repository.save(SettingsService.settings);
    }
}
